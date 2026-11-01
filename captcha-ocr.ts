// captcha-ocr.ts
import sharp from "sharp";      // npm i sharp
import ollama from "ollama";    // npm i ollama  (v0.6.x: default import!)

const MODEL = "longwayxu/xiaomi-ocr-0:bf16";

const PROMPT =
    "This is a CAPTCHA image containing exactly 4 alphanumeric characters. " +
    "Ignore any lines, borders or noise. " +
    "Output ONLY the 4 characters, with no explanation.";

// No color-based letter masking: this captcha family draws letters in black and
// yellow too — the same colors as the strike line and unlike the background — so
// any color threshold deletes real characters. The model ignores the strike line
// on its own when told to.
export async function solveCaptcha(imagePath: string): Promise<string> {
    const pre = await sharp(imagePath)
        .resize({ width: 400, kernel: "lanczos3" })  // ~3x of the 130px source; larger upscales fuse overlapping letters
        .normalise()                                  // per-channel contrast stretch
        .png()
        .toBuffer();

    const res = await ollama.chat({
        model: MODEL,
        messages: [{
            role: "user",
            content: PROMPT,
            images: [pre.toString("base64")],
        }],
        options: { temperature: 0, num_ctx: 8192, num_predict: 32 },
    });

    // Strip anything that isn't a character
    return res.message.content.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
