import { NextResponse } from 'next/server';

// Simple server-side proxy to Google Gemini API.
// Env: set GEMINI_API_KEY in your deployment environment (do NOT prefix with NEXT_PUBLIC_).

type ReqBody = {
  companyName?: string;
  position?: string;
  strengths?: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 400 });
    }

    const { companyName, position, strengths }: ReqBody = await req.json();
    const company = (companyName || '').trim();
    const role = (position || '').trim();
    const strong = (strengths || '').trim();

    const prompt = [
      '以下の入力から、日本語で「志望理由」を1〜2ページ相当の長さで生成してください。',
      '構成は次の見出し順を厳守してください: ',
      '1) 見出し: 「{company}への志望理由」',
      '2) [志望理由1: 事業への共感]（会社の事業や価値提供に対する共感）',
      '3) [志望理由2: スキルの活用]（応募職種: {role}）',
      '4) [志望理由3: 成長機会]（入社後の挑戦・成長の方向性）',
      '5) [入社後の貢献]（具体的な貢献イメージ）',
      '',
      '制約:',
      '- 箇条書きではなく段落主体で、読みやすい日本語にする。',
      '- 誇張や断定を避け、前向きで具体的な表現にする。',
      '- 事実でない実績は作らない。',
      '',
      `入力:
会社名: ${company || '（未指定）'}
応募職種: ${role || '（未指定）'}
強み・経験: ${strong || '（未指定）'}`,
    ].join('\n');

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const res = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
      // Route handlers run server-side; no need for next: { revalidate }
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${res.status} ${text?.slice(0, 200)}` }, { status: 502 });
    }
    const data = await res.json();
    // Extract the first candidate text safely
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') ||
      '';

    if (!text) {
      return NextResponse.json({ error: 'No content returned from Gemini' }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

