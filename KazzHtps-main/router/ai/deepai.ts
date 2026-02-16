import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

function getApiKey(): string {
  const prefix = 'tryit';
  const id = Math.floor(1e10 + Math.random() * 9e10).toString();
  const hash = crypto.randomBytes(16).toString('hex');
  return `${prefix}-${id}-${hash}`;
}

function cleanResponse(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/[\/\\]/g, '');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/([^\n])\n([^\n])/g, '$1 $2');
  cleaned = cleaned.replace(/([^`])\s{2,}([^`])/g, '$1 $2');
  return cleaned.trim();
}

async function deepaiChat(input: string) {
  const form = new FormData();
  form.append('chat_style', 'chat');
  form.append('chatHistory', JSON.stringify([{ role: 'user', content: input }]));
  form.append('model', 'standard');
  form.append('hacker_is_stinky', 'very_stinky');

  const headers = {
    ...form.getHeaders(),
    'api-key': getApiKey(),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://deepai.org',
    'Referer': 'https://deepai.org/'
  };

  const res = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', form, { 
    headers,
    timeout: 30000 
  });

  let rawResponse = res.data?.output || res.data?.text || (typeof res.data === 'string' ? res.data : '');
  
  if (!rawResponse) throw new Error("Gagal mendapatkan respon dari DeepAI");

  return cleanResponse(rawResponse);
}

export default async function deepaiHandler(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Parameter 'q' diperlukan." });

    const result = await deepaiChat(q as string);

    res.status(200).json({
      status: true,
      model: "DeepAI Standard",
      result: result
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada DeepAI API",
      error: error.message
    });
  }
}