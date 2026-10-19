import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Support large image payloads for high-resolution receipt photos
app.use(express.json({ limit: '30mb' }));

// Initialize GoogleGenAI SDK (reads GEMINI_API_KEY from environment)
const ai = new GoogleGenAI();

// Endpoint: AI Vision OCR receipt parsing
app.post('/api/ocr-ticket', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    const prompt = `You are an expert receipt & invoice OCR reader. Read this receipt image carefully and extract all transaction data with high precision.
Extract:
1. "merchant": The exact store or company name on the receipt (e.g. "Costco", "Walmart", "Mercadona", "Target", "Starbucks", etc.).
2. "amount": The final total amount paid (number, e.g. 45.60).
3. "taxAmount": Total sales tax / IVA / VAT (number, or 0 if not listed).
4. "date": The date on receipt in format "YYYY-MM-DD" (or current date if not visible).
5. "category": Choose the single most appropriate category from this list:
   - "Groceries & Market"
   - "Home & Utilities"
   - "Dining & Outings"
   - "Children & Education"
   - "Health & Wellness"
   - "Transportation & Auto"
   - "Family Entertainment"
   - "Household General"
6. "aiConfidence": An integer confidence score between 75 and 99.
7. "items": An array of items purchased:
   [
     {
       "description": "Item description",
       "quantity": 1,
       "unitPrice": 10.00,
       "lineTotal": 10.00
     }
   ]

Return ONLY a valid JSON object matching the fields above. Do not output any markdown code fences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If output had extra formatting, clean it
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      merchant: parsed.merchant || 'Comercio Local',
      amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
      taxAmount: typeof parsed.taxAmount === 'number' ? parsed.taxAmount : parseFloat(parsed.taxAmount) || 0,
      date: parsed.date || new Date().toISOString().slice(0, 10),
      category: parsed.category || 'Household General',
      aiConfidence: parsed.aiConfidence || 90,
      items: Array.isArray(parsed.items) && parsed.items.length > 0
        ? parsed.items.map((item: any, idx: number) => ({
            id: `item-${Date.now()}-${idx}`,
            description: item.description || 'Artículo',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || Number(item.lineTotal) || 0,
            lineTotal: Number(item.lineTotal) || Number(item.unitPrice) || 0,
          }))
        : [
            {
              id: `item-${Date.now()}-0`,
              description: parsed.merchant || 'Total ticket',
              quantity: 1,
              unitPrice: Number(parsed.amount) || 0,
              lineTotal: Number(parsed.amount) || 0,
            },
          ],
    });
  } catch (err: any) {
    console.error('OCR analysis error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error analizando imagen con Gemini Vision OCR',
    });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[FamilyLedger Server] Running on http://0.0.0.0:${port}`);
  });
}

start();
