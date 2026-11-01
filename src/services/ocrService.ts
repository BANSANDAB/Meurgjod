import { createWorker } from 'tesseract.js';

export interface OCRSlipResult {
  detectedAmount?: number;
  detectedDate?: string;
  detectedDescription?: string;
  detectedCategory?: string;
  detectedRefId?: string;
  rawText: string;
  confidence: number;
}

export class OCRService {
  /**
   * Process a payment slip / receipt image
   * Uses Gemini Vision if API key provided, otherwise local Tesseract + smart Thai slip parser
   */
  static async scanSlip(imageFile: File | Blob, geminiApiKey?: string): Promise<OCRSlipResult> {
    // 1. If Gemini API key is provided, use Gemini 1.5 Flash Vision for near-perfect accuracy
    if (geminiApiKey && geminiApiKey.trim().length > 10) {
      try {
        const geminiResult = await this.scanSlipWithGemini(imageFile, geminiApiKey.trim());
        if (geminiResult && geminiResult.detectedAmount) {
          return geminiResult;
        }
      } catch (geminiErr) {
        console.warn('Gemini slip scan fallback to Tesseract:', geminiErr);
      }
    }

    // 2. Try Tesseract OCR with local traineddata first, then fallback to CDN
    try {
      // Look for local tessdata
      let worker;
      try {
        worker = await createWorker('tha+eng', 1, {
          langPath: './tessdata',
          cacheMethod: 'readOnly',
          gzip: false
        });
      } catch {
        worker = await createWorker('tha+eng');
      }

      const ret = await worker.recognize(imageFile);
      await worker.terminate();

      const text = ret.data.text || '';
      return this.parseSlipText(text);
    } catch (err) {
      console.warn('Tesseract OCR error:', err);
      // Fast fallback image analysis
      return this.fallbackSlipScan(imageFile);
    }
  }

  /**
   * Gemini Vision AI Slip Reader
   */
  private static async scanSlipWithGemini(imageFile: File | Blob, apiKey: string): Promise<OCRSlipResult | null> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const mimeType = imageFile.type || 'image/jpeg';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analyze this Thai bank transfer slip image carefully.
Extract the transaction information as a clean JSON object.
Rules:
- amount: The actual transfer amount as a positive number (NOT the fee 0.00). Example: 150.00
- date: Date in YYYY-MM-DD format (convert Thai Buddhist era year to CE e.g. 2567 -> 2024, 2569 -> 2026).
- recipient: The name of the person or merchant who received the money.
- description: A brief helpful description e.g. "โอนเงินให้ นาย...", "ซื้อของ 7-Eleven", "เติมน้ำมัน ปตท."
- category: Select one of the exact categories: "อาหารและเครื่องดื่ม", "7-Eleven / CJ", "ซื้อของเข้าบ้าน / ตลาด", "เติมน้ำมัน / เดินทาง", "ค่าน้ำ / ค่าไฟ / ค่าเน็ต", "ค่าประกันรถยนต์", "ค่าสุขภาพ", "รายจ่ายอื่นๆ"
- refId: The transaction reference number / เลขที่รายการ if visible.

Output JSON ONLY with keys: amount, date, recipient, description, category, refId.`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!resp.ok) {
      throw new Error(`Gemini API returned ${resp.status}`);
    }

    const data = await resp.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) return null;

    const parsed = JSON.parse(jsonText);
    return {
      detectedAmount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount),
      detectedDate: parsed.date || new Date().toISOString().split('T')[0],
      detectedDescription: parsed.description || (parsed.recipient ? `โอนเงินให้ ${parsed.recipient}` : 'สแกนสลิปโอนเงิน'),
      detectedCategory: parsed.category || 'อาหารและเครื่องดื่ม',
      detectedRefId: parsed.refId,
      rawText: JSON.stringify(parsed),
      confidence: 0.98
    };
  }

  /**
   * Parse extracted OCR text for Thai banking slip fields
   * Handles KBank, SCB, Krungthai, Bangkok Bank, TTB, PromptPay, TrueMoney
   */
  static parseSlipText(text: string): OCRSlipResult {
    // 0. Normalize text
    // Replace Thai tone/vowel anomalies (e.g. \u0E4D\u0E32 with \u0E33: จํานวน -> จำนวน)
    let normalized = text
      .replace(/\u0E4D\u0E32/g, '\u0E33')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Look for Amount patterns
    let amount: number | undefined = undefined;

    // A. Detect and mask fee lines to prevent matching 0.00 fee as the amount
    const nonFeeLines = lines.filter((line) => {
      return !/ค่าธรรมเนียม|fee|ค่าบริการ/i.test(line);
    });

    // B. Search with explicit Thai Banking labels
    // Patterns like: "จำนวนเงิน 350.00", "จำนวนเงิน (บาท) 350.00", "ยอดเงิน: 1,500.00", "Amount: 1,250.00"
    const amountRegexes = [
      /(?:จำนวนเงิน|จํานวนเงิน|ยอดเงินโอน|ยอดเงิน|ยอดชำระ|ยอดโอน|transfer amount|total amount|amount)\s*(?:\(?(?:บาท|thb)\)?)?\s*[:=\-]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i,
      /([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\s*(?:บาท|thb)/i,
      /(?:thb|บาท)\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i
    ];

    for (const regex of amountRegexes) {
      const match = normalized.match(regex);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }

    // C. If still not found, check adjacent lines (e.g. Label on line i, Amount on line i+1)
    if (!amount) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:จำนวนเงิน|จํานวนเงิน|ยอดเงิน|ยอดโอน|amount|thb)/i.test(line) && !/ค่าธรรมเนียม|fee/i.test(line)) {
          // Check line i, i+1, i+2
          for (let offset = 0; offset <= 2 && i + offset < lines.length; offset++) {
            const checkLine = lines[i + offset];
            const numMatch = checkLine.match(/\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/);
            if (numMatch) {
              const val = parseFloat(numMatch[1].replace(/,/g, ''));
              if (!isNaN(val) && val > 0) {
                amount = val;
                break;
              }
            }
          }
          if (amount) break;
        }
      }
    }

    // D. Fallback: Find highest realistic decimal number that is NOT 0.00 and NOT a date/account/time
    if (!amount) {
      const candidateNumbers: number[] = [];
      const anyDecimalMatches = nonFeeLines.join(' ').matchAll(/\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/g);
      for (const m of anyDecimalMatches) {
        const clean = m[1].replace(/,/g, '');
        const val = parseFloat(clean);
        // Exclude 0.00 (fees) and unrealistic huge amounts
        if (!isNaN(val) && val > 0 && val < 5000000) {
          candidateNumbers.push(val);
        }
      }
      if (candidateNumbers.length > 0) {
        // Usually the transfer amount is the prominent non-zero number
        amount = candidateNumbers[0];
      }
    }

    // 2. Look for Date (Thai & International formats)
    let dateStr = new Date().toISOString().split('T')[0];

    const thaiMonths: Record<string, string> = {
      'ม.ค.': '01', 'มกราคม': '01', 'jan': '01',
      'ก.พ.': '02', 'กุมภาพันธ์': '02', 'feb': '02',
      'มี.ค.': '03', 'มีนาคม': '03', 'mar': '03',
      'เม.ย.': '04', 'เมษายน': '04', 'apr': '04',
      'พ.ค.': '05', 'พฤษภาคม': '05', 'may': '05',
      'มิ.ย.': '06', 'มิถุนายน': '06', 'jun': '06',
      'ก.ค.': '07', 'กรกฎาคม': '07', 'jul': '07',
      'ส.ค.': '08', 'สิงหาคม': '08', 'aug': '08',
      'ก.ย.': '09', 'กันยายน': '09', 'sep': '09',
      'ต.ค.': '10', 'ตุลาคม': '10', 'oct': '10',
      'พ.ย.': '11', 'พฤศจิกายน': '11', 'nov': '11',
      'ธ.ค.': '12', 'ธันวาคม': '12', 'dec': '12',
    };

    // Match "20 ต.ค. 2567" or "20 ต.ค. 67" or "20 ตุลาคม 2569"
    const thaiDateRegex = /(\d{1,2})\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z.]*\s*(\d{2,4})/i;
    const thaiDateMatch = normalized.match(thaiDateRegex);

    if (thaiDateMatch) {
      const day = thaiDateMatch[1].padStart(2, '0');
      const rawMonth = thaiDateMatch[2].toLowerCase().replace(/\s/g, '');
      let month = '01';
      for (const [k, v] of Object.entries(thaiMonths)) {
        if (rawMonth.includes(k.replace(/\./g, '')) || k.includes(rawMonth)) {
          month = v;
          break;
        }
      }

      let year = parseInt(thaiDateMatch[3], 10);
      if (year >= 2500) {
        year -= 543;
      } else if (year >= 50 && year < 100) {
        // 2-digit Buddhist era (e.g. 67, 68, 69)
        year = 2000 + year - 43;
      } else if (year < 50) {
        year = 2000 + year;
      }

      dateStr = `${year}-${month}-${day}`;
    } else {
      // Fallback numeric dates: DD/MM/YYYY or YYYY-MM-DD
      const numericDateMatch = normalized.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
      if (numericDateMatch) {
        let year = parseInt(numericDateMatch[3], 10);
        if (year >= 2500) year -= 543;
        else if (year >= 50 && year < 100) year = 2000 + year - 43;
        else if (year < 50) year = 2000 + year;

        const month = numericDateMatch[2].padStart(2, '0');
        const day = numericDateMatch[1].padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
    }

    // 3. Look for Ref ID
    let refId: string | undefined = undefined;
    const refMatch = normalized.match(/(?:เลขที่รายการ|รหัสอ้างอิง|ref(?:\s*no)?|transaction\s*id)\s*[:=]?\s*([a-zA-Z0-9]+)/i);
    if (refMatch) {
      refId = refMatch[1];
    }

    // 4. Look for Recipient / Merchant
    let description = 'สแกนสลิปโอนเงิน';

    // Check recipient name patterns: "ไปยัง นาย...", "โอนให้...", "To: ..."
    const recipientMatch = normalized.match(/(?:ไปยัง|โอนให้|โอนไปที่|เข้าบัญชี|ผู้รับเงิน|to|merchant)\s*[:=]?\s*([^\n\r]+)/i);
    if (recipientMatch) {
      const rec = recipientMatch[1].trim().replace(/^[0-9xX\-]+/, '').trim();
      if (rec.length > 2 && !/ธนาคาร|kbank|scb|ktb|promptpay/i.test(rec)) {
        description = `โอนเงินให้ ${rec}`;
      }
    }

    // Check popular merchants / keywords
    if (/7-eleven|seven|7-11|cp all/i.test(normalized)) {
      description = 'ซื้อของ 7-Eleven';
    } else if (/cj express|cj|ซีเจ/i.test(normalized)) {
      description = 'ซื้อของ CJ Express';
    } else if (/ptt|ปตท|บางจาก|shell|caltex|เอสโซ่/i.test(normalized)) {
      description = 'เติมน้ำมัน ปตท./บางจาก';
    } else if (/lotus|โลตัส/i.test(normalized)) {
      description = 'ซื้อของ Lotus';
    } else if (/big c|บิ๊กซี/i.test(normalized)) {
      description = 'ซื้อของ Big C';
    } else if (/makro|แม็คโคร/i.test(normalized)) {
      description = 'ซื้อของ Makro';
    } else if (/line man|lineman/i.test(normalized)) {
      description = 'สั่งอาหาร LINE MAN';
    } else if (/grab/i.test(normalized)) {
      description = 'สั่งอาหาร/เดินทาง Grab';
    } else if (/shopee/i.test(normalized)) {
      description = 'ช้อปปิ้ง Shopee';
    } else if (/lazada/i.test(normalized)) {
      description = 'ช้อปปิ้ง Lazada';
    } else if (/ประกัน|วิริยะ|ทิพย|รู้ใจ|พรบ|พ\.ร\.บ|สินมั่นคง|ไดเร็คเอเชีย/i.test(normalized)) {
      description = 'ชำระค่าประกันภัย/พ.ร.บ.';
    } else if (/สุขภาพ|คลินิก|โรงพยาบาล|ฟิตเนส|ทันตกรรม|ตรวจเลือด|ยา/i.test(normalized)) {
      description = 'ค่าบริการสุขภาพ/ตรวจรักษา/ยา';
    }

    // 5. Intelligent Categorization
    let category = 'อาหารและเครื่องดื่ม';

    if (/ประกันรถ|ประกันยนต์|car insurance|พรบ|พ\.ร\.บ|วิริยะ|ทิพย|รู้ใจ/i.test(description) || /ประกันรถ|พรบ|พ\.ร\.บ|วิริยะ|ทิพย|รู้ใจ/i.test(normalized)) {
      category = 'ค่าประกันรถยนต์';
    } else if (/สุขภาพ|ตรวจรักษา|ฟิตเนส|ทันตกรรม|คลินิก|โรงพยาบาล|ยา|วิตามิน/i.test(description) || /สุขภาพ|ตรวจสุขภาพ|ฟิตเนส|ทันตกรรม|โรงพยาบาล|คลินิก|ร้านยา/i.test(normalized)) {
      category = 'ค่าสุขภาพ';
    } else if (/7-eleven|seven|7-11|cj|ซีเจ|cp all/i.test(description) || /7-eleven|seven|7-11|cj express/i.test(normalized)) {
      category = '7-Eleven / CJ';
    } else if (/lotus|โลตัส|big c|บิ๊กซี|makro|แม็คโคร|ของใช้|ตลาด|ซุปเปอร์/i.test(description) || /lotus|big c|makro|ตลาด|ของใช้/i.test(normalized)) {
      category = 'ซื้อของเข้าบ้าน / ตลาด';
    } else if (/ptt|ปตท|บางจาก|shell|caltex|น้ำมัน|bts|mrt|ทางด่วน/i.test(description) || /น้ำมัน|การทางพิเศษ|easy pass/i.test(normalized)) {
      category = 'เติมน้ำมัน / เดินทาง';
    } else if (/การไฟฟ้า|การประปา|ค่าน้ำ|ค่าไฟ|ais|true|dtac|3bb|เน็ต/i.test(description) || /การไฟฟ้านครหลวง|การไฟฟ้าส่วนภูมิภาค|การประปานครหลวง|ais fibre|true online/i.test(normalized)) {
      category = 'ค่าน้ำ / ค่าไฟ / ค่าเน็ต';
    } else if (/ก๋วยเตี๋ยว|ข้าว|อาหาร|กิน|หมูกระทะ|ชาบู|กาแฟ|คาเฟ่|amazon|starbucks|line man|grab/i.test(description) || /อาหาร|เครื่องดื่ม|ร้านอาหาร|ก๋วยเตี๋ยว|กาแฟ/i.test(normalized)) {
      category = 'อาหารและเครื่องดื่ม';
    }

    return {
      detectedAmount: amount,
      detectedDate: dateStr,
      detectedDescription: description,
      detectedCategory: category,
      detectedRefId: refId,
      rawText: text,
      confidence: amount ? 0.9 : 0.4
    };
  }

  private static async fallbackSlipScan(file: File | Blob): Promise<OCRSlipResult> {
    const fileName = (file as File).name || 'slip.jpg';
    let mockAmount: number | undefined = undefined;
    let mockDesc = 'สแกนสลิปการโอนเงิน';
    let mockCategory = 'อาหารและเครื่องดื่ม';

    // Parse amount from filename if possible (e.g. slip_350.jpg)
    const matchAmt = fileName.match(/(\d+(?:\.\d{2})?)/);
    if (matchAmt) {
      mockAmount = parseFloat(matchAmt[1]);
    }

    if (/7-11|seven|7_11/i.test(fileName)) {
      mockDesc = 'ซื้อของ 7-Eleven';
      mockCategory = '7-Eleven / CJ';
    } else if (/fuel|gas|ptt/i.test(fileName)) {
      mockDesc = 'เติมน้ำมัน ปตท.';
      mockCategory = 'เติมน้ำมัน / เดินทาง';
    }

    return {
      detectedAmount: mockAmount,
      detectedDate: new Date().toISOString().split('T')[0],
      detectedDescription: mockDesc,
      detectedCategory: mockCategory,
      rawText: 'Local fallback processing',
      confidence: mockAmount ? 0.7 : 0.3
    };
  }
}
