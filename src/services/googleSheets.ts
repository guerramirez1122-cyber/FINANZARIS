import { ExpenseTicket, ExpenseCategory, FamilyMember } from '../types/expense';

export interface DriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
}

// List user's Google Sheets using Drive API v3
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheet[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Drive files (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Google Sheets:', error);
    throw error;
  }
}

// Get spreadsheet metadata and tab list
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: SheetTabInfo[] }> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title,index)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch spreadsheet details (${res.status})`);
    }

    const data = await res.json();
    const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
    }));

    return {
      title: data.properties?.title || 'Spreadsheet',
      sheets,
    };
  } catch (error) {
    console.error('Error fetching sheet details:', error);
    throw error;
  }
}

// Fetch all rows from a sheet tab
export async function fetchSheetRows(
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string
): Promise<string[][]> {
  try {
    const range = encodeURIComponent(`${tabTitle}!A1:Z1000`);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to read sheet data (${res.status})`);
    }

    const data = await res.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet values:', error);
    throw error;
  }
}

// Update a specific cell in the sheet (e.g. marking verified)
export async function updateSheetCell(
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string,
  cellRange: string, // e.g. "H14"
  value: string
): Promise<boolean> {
  try {
    const range = encodeURIComponent(`${tabTitle}!${cellRange}`);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[value]],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update sheet cell (${res.status})`);
    }

    return true;
  } catch (error) {
    console.error('Error updating cell in sheet:', error);
    throw error;
  }
}

// Intelligent Google Form / Sheet Row Parser:
// Detects columns in English or Spanish from Google Form responses or custom tables
export function parseGoogleSheetRowsToTickets(
  rows: string[][],
  members: FamilyMember[],
  categories: ExpenseCategory[]
): { tickets: ExpenseTicket[]; statusColLetter?: string } {
  if (!rows || rows.length <= 1) return { tickets: [] };

  const headers = rows[0].map((h) => (h || '').trim().toLowerCase());

  // Find column indexes
  const findCol = (keywords: string[]) => {
    return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const idColIdx = findCol(['ticket', 'id', 'folio', 'código', 'codigo']);
  const timestampColIdx = findCol(['timestamp', 'marca temporal', 'fecha y hora', 'submitted at']);
  const dateColIdx = findCol(['date', 'fecha', 'día', 'dia']);
  const merchantColIdx = findCol(['merchant', 'comercio', 'establecimiento', 'tienda', 'proveedor', 'lugar']);
  const amountColIdx = findCol(['amount', 'monto', 'total', 'precio', 'gasto', 'valor', 'costo']);
  const categoryColIdx = findCol(['category', 'categoría', 'categoria', 'rubro', 'tipo']);
  const paidByColIdx = findCol(['paid by', 'pagado por', 'quién pagó', 'quien pago', 'miembro', 'persona', 'email', 'correo']);
  const itemsColIdx = findCol(['item', 'artículo', 'articulo', 'detalle', 'descripción', 'descripcion', 'concepto']);
  const statusColIdx = findCol(['status', 'estado', 'verificado', 'aprobado', 'approval']);
  const confidenceColIdx = findCol(['confidence', 'confianza', 'ai score']);

  const statusColLetter = statusColIdx >= 0 ? String.fromCharCode(65 + statusColIdx) : undefined;

  const parsedTickets: ExpenseTicket[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Extract amount
    let rawAmount = amountColIdx >= 0 ? row[amountColIdx] : '';
    if (!rawAmount && r > 0) {
      // Fallback search in row for something looking like a currency/number
      const numCell = row.find((cell) => /^\$?\s*\d+([.,]\d{2})?$/.test(cell.trim()));
      if (numCell) rawAmount = numCell;
    }
    const cleanAmount = parseFloat((rawAmount || '0').replace(/[^0-9.-]/g, '')) || 0;
    if (cleanAmount <= 0) continue; // Skip empty rows

    // Extract date
    let rawDate = dateColIdx >= 0 ? row[dateColIdx] : '';
    if (!rawDate && timestampColIdx >= 0) rawDate = row[timestampColIdx];
    let isoDate = new Date().toISOString().slice(0, 10);
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        isoDate = parsedDate.toISOString().slice(0, 10);
      }
    }

    // Extract merchant
    const merchant = (merchantColIdx >= 0 ? row[merchantColIdx] : '') || `Ticket #${r}`;

    // Extract category
    let category = categoryColIdx >= 0 ? row[categoryColIdx] : '';
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === category.toLowerCase() || category.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchedCategory) {
      category = matchedCategory.name;
    } else if (!category) {
      category = 'Groceries & Market';
    }

    // Extract paid by member
    const rawPaidBy = (paidByColIdx >= 0 ? row[paidByColIdx] : '').toLowerCase();
    const matchedMember = members.find(
      (m) =>
        rawPaidBy.includes(m.name.toLowerCase()) ||
        (m.email && rawPaidBy.includes(m.email.toLowerCase())) ||
        (m.role && rawPaidBy.includes(m.role.toLowerCase()))
    );
    const paidByMemberId = matchedMember ? matchedMember.id : 'mem_elena';

    // Status
    const rawStatus = (statusColIdx >= 0 ? row[statusColIdx] : '').toLowerCase();
    const isVerified = rawStatus.includes('verif') || rawStatus.includes('aprob') || rawStatus.includes('ok');

    // Items
    const rawItems = itemsColIdx >= 0 ? row[itemsColIdx] : '';

    parsedTickets.push({
      id: idColIdx >= 0 && row[idColIdx] ? row[idColIdx] : `ROW-${r + 1}`,
      date: isoDate,
      merchant,
      category,
      amount: cleanAmount,
      taxAmount: 0,
      tipAmount: 0,
      paidByMemberId,
      splitType: 'parents_only',
      splitWithMemberIds: ['mem_elena', 'mem_carlos'],
      items: rawItems
        ? rawItems.split(',').map((it, idx) => ({
            id: `row-it-${idx}`,
            description: it.trim(),
            quantity: 1,
            unitPrice: cleanAmount / Math.max(1, rawItems.split(',').length),
            lineTotal: cleanAmount / Math.max(1, rawItems.split(',').length),
          }))
        : [{ id: 'it-1', description: merchant, quantity: 1, unitPrice: cleanAmount, lineTotal: cleanAmount }],
      aiConfidence: confidenceColIdx >= 0 ? parseInt(row[confidenceColIdx]) || 95 : 95,
      status: isVerified ? 'verified' : 'needs_review',
      source: 'google_sheets',
      sheetRowIndex: r + 1,
      tags: ['Form / Sheet Ingest'],
    });
  }

  return { tickets: parsedTickets, statusColLetter };
}
