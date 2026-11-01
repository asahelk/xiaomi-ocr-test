import { readFileSync } from "node:fs";
import ollama from "ollama";

const MODEL = "longwayxu/xiaomi-ocr-0:bf16";

export async function ocr(imagePath: string, prompt: string): Promise<string> {
  const image = readFileSync(imagePath).toString("base64");
  const res = await ollama.chat({
    model: MODEL,
    messages: [{ role: "user", content: prompt, images: [image] }],
    options: { temperature: 0, num_ctx: 8192, num_predict: 4096 },
  });
  return res.message.content;
}
