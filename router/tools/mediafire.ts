import express, { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';
const COOKIE_API_URL = 'https://cookies.ryzecodes.xyz/api/cookies';

async function getSessionHeaders() {
  const cookieResponse = await axios.get(COOKIE_API_URL);
  if (!cookieResponse.data?.cookies) throw new Error("Invalid response from Cookie API");
  const cookieHeader = cookieResponse.data.cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
  return {
    'User-Agent': USER_AGENT,
    'Cookie': cookieHeader,
    'Origin': 'https://app.mediafire.com',
    'Referer': 'https://app.mediafire.com/'
  };
}

async function getSessionToken(headers: any) {
  const tokenRes = await axios.post(
    'https://www.mediafire.com/application/get_session_token.php',
    'response_format=json',
    { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const token = tokenRes.data.response?.session_token;
  if (!token) throw new Error("Failed to get session token");
  return token;
}

async function getActionToken(headers: any, sessionToken: string) {
  const actionRes = await axios.post(
    'https://www.mediafire.com/api/1.5/user/get_action_token.php',
    `session_token=${sessionToken}&response_format=json&type=upload&lifespan=1440`,
    { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  if (actionRes.data.response.result !== 'Success') throw new Error("Failed to get action token");
  return actionRes.data.response.action_token;
}

async function checkUpload(headers: any, sessionToken: string, filename: string, fileSize: number, fileHash: string) {
  const form = new FormData();
  const descriptor = [{ filename, folder_key: 'myfiles', size: fileSize, hash: fileHash, resumable: 'yes', preemptive: 'yes' }];
  form.append('uploads', JSON.stringify(descriptor));
  form.append('session_token', sessionToken);
  form.append('response_format', 'json');
  const res = await axios.post('https://www.mediafire.com/api/1.5/upload/check.php', form, { headers: { ...headers, ...form.getHeaders() } });
  const data = res.data.response;
  if (data.result !== 'Success') throw new Error("Upload check failed");
  if (data.hash_exists === 'yes') throw new Error("File already exists on MediaFire");
  return data.upload_url?.resumable || 'https://www.mediafire.com/api/upload/resumable.php';
}

async function uploadFile(headers: any, sessionToken: string, actionToken: string, uploadUrl: string, media: Buffer, filename: string) {
  const fileSize = media.length;
  const fileHash = crypto.createHash('sha256').update(media).digest('hex');
  const targetUrl = `${uploadUrl}?session_token=${sessionToken}&action_token=${actionToken}&response_format=json`;
  const uploadHeaders = {
    ...headers,
    'x-file-hash': fileHash,
    'x-file-size': fileSize.toString(),
    'x-file-name': filename,
    'x-filename': filename,
    'x-filesize': fileSize.toString(),
    'x-unit-id': '0',
    'x-unit-size': fileSize.toString(),
    'x-unit-hash': fileHash,
    'Content-Type': 'application/octet-stream'
  };
  const res = await axios.post(targetUrl, media, { headers: uploadHeaders, maxBodyLength: Infinity });
  const uploadKey = res.data.response?.doupload?.key;
  if (!uploadKey) throw new Error("Upload failed, no key returned");

  // Poll for quickkey
  let quickKey: string | null = null;
  const pollUrl = 'https://www.mediafire.com/api/1.5/upload/poll_upload.php';
  let attempts = 0;
  while (!quickKey && attempts < 20) {
    attempts++;
    const pollForm = new FormData();
    pollForm.append('key', uploadKey);
    pollForm.append('session_token', sessionToken);
    pollForm.append('response_format', 'json');
    const pollRes = await axios.post(pollUrl, pollForm, { headers: { ...headers, ...pollForm.getHeaders() } });
    const result = pollRes.data.response.doupload;
    if (result.result === '0' && result.status === '99') quickKey = result.quickkey;
    else if (result.result !== '0') throw new Error(`Poll error: ${JSON.stringify(result)}`);
    else await new Promise(r => setTimeout(r, 2000));
  }

  if (!quickKey) throw new Error("Failed to get quickkey after upload");
  return `https://www.mediafire.com/file/${quickKey}/`;
}

export const mediafireUploadHandler = [
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ status: false, message: "File not provided" });

      const filename = req.file.originalname || `upload_${Date.now()}.bin`;
      const media = req.file.buffer;

      const headers = await getSessionHeaders();
      const sessionToken = await getSessionToken(headers);
      const actionToken = await getActionToken(headers, sessionToken);
      const uploadUrl = await checkUpload(headers, sessionToken, filename, media.length, crypto.createHash('sha256').update(media).digest('hex'));
      const link = await uploadFile(headers, sessionToken, actionToken, uploadUrl, media, filename);

      res.status(200).json({
        status: true,
        file: filename,
        size: media.length,
        link
      });
    } catch (error: any) {
      res.status(500).json({ status: false, message: error.message });
    }
  }
];