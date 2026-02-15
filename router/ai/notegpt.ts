import { Request, Response } from "express";
import axios from "axios";

async function notegptAI(message: string) {
  if (!message) throw new Error("Parameter 'q' diperlukan");

  const response = await axios.post(
    "https://notegpt.io/api/v2/chat/stream",
    {
      message,
      language: "ace",
      model: "deepseek-reasoner",
      tone: "default",
      length: "moderate",
      conversation_id: "641eed40-0865-4dcf-9b90-39c868e4b710"
    },
    {
      headers: { "Content-Type": "application/json" },
      responseType: "stream"
    }
  );

  let resultText = "";

  await new Promise<void>((resolve, reject) => {
    response.data.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const payload = line.replace(/^data:\s*/, "");
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) resultText += parsed.text;
          } catch {}
        }
      }
    });

    response.data.on("end", resolve);
    response.data.on("error", reject);
  });

  return resultText || "Tidak ada respons dari Notegpt";
}

// ===============================
// Handler Express mirip TalkAI
// ===============================
export default async function notegptHandler(req: Request, res: Response) {
  try {
    const query = (req.query.q || req.body.q) as string;

    if (!query) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Parameter 'q' diperlukan"
      });
    }

    const aiResponse = await notegptAI(query);

    res.json({
      creator: "KayzzAoshi",
      status: true,
      response: aiResponse
    });
  } catch (err: any) {
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      error: err.message || "Internal Server Error"
    });
  }
}