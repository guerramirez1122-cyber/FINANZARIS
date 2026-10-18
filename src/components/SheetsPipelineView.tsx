import React, { useState, useEffect } from 'react';
import { SheetConfig, ExpenseTicket, FamilyMember, ExpenseCategory } from '../types/expense';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Download, 
  Check, 
  Table, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Sparkles,
  Search,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { 
  listUserSpreadsheets, 
  getSpreadsheetDetails, 
  fetchSheetRows, 
  parseGoogleSheetRowsToTickets,
  DriveSpreadsheet,
  SheetTabInfo 
} from '../services/googleSheets';

interface SheetsPipelineViewProps {
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (config: SheetConfig) => void;
  tickets: ExpenseTicket[];
  onSyncSheets: () => void;
  isSyncing: boolean;
  googleUser: User | null;
  googleAccessToken: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isAuthLoading: boolean;
  onImportLiveTickets: (tickets: ExpenseTicket[]) => void;
  members: FamilyMember[];
  categories: ExpenseCategory[];
}

export const SheetsPipelineView: React.FC<SheetsPipelineViewProps> = ({
  sheetConfig,
  onUpdateSheetConfig,
  tickets,
  onSyncSheets,
  isSyncing,
  googleUser,
  googleAccessToken,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthLoading,
  onImportLiveTickets,
  members,
  categories,
}) => {
  const [sheetUrl, setSheetUrl] = useState(sheetConfig.sheetIdOrUrl);
  const [sheetTabName, setSheetTabName] = useState(sheetConfig.sheetName);
  const [isSaved, setIsSaved] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Drive spreadsheet picker state
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheet[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<SheetTabInfo[]>([]);
  const [selectedDriveSheetId, setSelectedDriveSheetId] = useState<string>('');
  const [driveError, setDriveError] = useState<string | null>(null);

  // Load user spreadsheets when signed in
  useEffect(() => {
    if (googleAccessToken) {
      loadDriveSheets(googleAccessToken);
    }
  }, [googleAccessToken]);

  const loadDriveSheets = async (token: string) => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const sheets = await listUserSpreadsheets(token);
      setDriveSheets(sheets);
      if (sheets.length > 0 && !selectedDriveSheetId) {
        setSelectedDriveSheetId(sheets[0].id);
        fetchTabsForSheet(token, sheets[0].id);
      }
    } catch (err: any) {
      setDriveError(err.message || 'Failed to list spreadsheets from Drive');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const fetchTabsForSheet = async (token: string, sheetId: string) => {
    try {
      const details = await getSpreadsheetDetails(token, sheetId);
      setAvailableTabs(details.sheets);
      if (details.sheets.length > 0) {
        setSheetTabName(details.sheets[0].title);
      }
    } catch (err: any) {
      console.error('Error fetching sheet tabs:', err);
    }
  };

  const handleSelectDriveSheet = async (sheetId: string) => {
    setSelectedDriveSheetId(sheetId);
    setSheetUrl(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    if (googleAccessToken) {
      await fetchTabsForSheet(googleAccessToken, sheetId);
    }
  };

  const handlePullFromLiveSheet = async () => {
    if (!googleAccessToken) {
      onSyncSheets();
      return;
    }

    // Extract sheet ID from URL or input
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const targetId = match ? match[1] : sheetUrl.trim();

    if (!targetId) {
      alert('Please select or enter a valid Google Sheet ID.');
      return;
    }

    try {
      const rows = await fetchSheetRows(googleAccessToken, targetId, sheetTabName);
      const parsed = parseGoogleSheetRowsToTickets(rows, members, categories);
      if (parsed.tickets.length > 0) {
        onImportLiveTickets(parsed.tickets);
        onUpdateSheetConfig({
          ...sheetConfig,
          sheetIdOrUrl: sheetUrl,
          sheetName: sheetTabName,
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        alert('Connected to Google Sheet, but no expense rows with valid amounts were found.');
      }
    } catch (err: any) {
      alert(`Error pulling live data from Google Sheets: ${err.message}`);
    }
  };

  const handleSaveConfig = () => {
    onUpdateSheetConfig({
      ...sheetConfig,
      sheetIdOrUrl: sheetUrl,
      sheetName: sheetTabName,
      lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Date', 'Merchant', 'Category', 'Amount', 'Paid By', 'Split Rule', 'AI Confidence', 'Status'];
    const rows = tickets.map((t) => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.amount.toFixed(2),
      t.paidByMemberId,
      t.splitType,
      t.aiConfidence,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Family_Expenses_Audited_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Backend Data Pipeline</span>
          <span aria-hidden="true">·</span>
          <span>Google Drive & Sheets API Sync</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Google Sheets & Form Database Pipeline
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Directly query your &quot;presupuesto-familiar-498719&quot; Google Sheets database, pull Form responses, and sync verified statuses.
        </p>
      </div>

      {/* Google Authentication Integration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Google Workspace OAuth 2.0 Connection
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {googleUser ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected as {googleUser.email}
                  </span>
                ) : (
                  'Sign in with Google to browse and sync your Google Sheets directly'
                )}
              </p>
            </div>
          </div>

          <div>
            {googleUser ? (
              <button
                onClick={onGoogleSignOut}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Disconnect Account
              </button>
            ) : (
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                isLoading={isAuthLoading}
                text="Sign in with Google"
              />
            )}
          </div>
        </div>

        {/* If user is signed in, show Drive Spreadsheets selector */}
        {googleUser && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Select from Your Google Drive Spreadsheets:
              </label>
              <button
                onClick={() => googleAccessToken && loadDriveSheets(googleAccessToken)}
                disabled={isLoadingDrive}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>Refresh Drive List</span>
              </button>
            </div>

            {driveError ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg">
                {driveError}
              </div>
            ) : isLoadingDrive ? (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-lg">
                Listing spreadsheets from Google Drive...
              </div>
            ) : driveSheets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">Spreadsheet File</span>
                  <select
                    value={selectedDriveSheetId}
                    onChange={(e) => handleSelectDriveSheet(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium"
                  >
                    {driveSheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({new Date(s.modifiedTime).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">Sheet Worksheet Tab</span>
                  <select
                    value={sheetTabName}
                    onChange={(e) => setSheetTabName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium"
                  >
                    {availableTabs.length > 0 ? (
                      availableTabs.map((t) => (
                        <option key={t.sheetId} value={t.title}>
                          {t.title}
                        </option>
                      ))
                    ) : (
                      <option value={sheetTabName}>{sheetTabName}</option>
                    )}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-lg">
                No spreadsheets found in Drive. You can still paste your Sheet URL below.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Status Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target Spreadsheet Configured</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Worksheet Tab: &quot;{sheetTabName}&quot;
          </h2>
          <p className="text-xs text-slate-500">
            Last synced: {sheetConfig.lastSyncedAt || 'Just now'} · {tickets.length} total tickets loaded in FamilyLedger
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePullFromLiveSheet}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Pulling Data...' : 'Sync Live Sheet Now'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{exportSuccess ? 'Downloaded!' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Direct URL Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Manual Sheet URL Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Or paste the link directly from your browser address bar
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Google Sheet URL</label>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings saved
            </span>
          ) : (
            <span className="text-xs text-slate-400">Project: presupuesto-familiar-498719</span>
          )}

          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Save Target URL
          </button>
        </div>
      </div>
    </div>
  );
};
