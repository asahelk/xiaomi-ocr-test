// captcha-ocr.ts
import sharp from "sharp";      // npm i sharp
import ollama from "ollama";    // npm i ollama  (v0.6.x: default import!)

interface TokenLogprob {
    token: string;
    logprob: number;
}
interface Logprob extends TokenLogprob {
    top_logprobs?: TokenLogprob[];
}

const MODEL = "longwayxu/xiaomi-ocr-0:bf16";

const PROMPT =
    "This is a CAPTCHA image containing exactly four uppercase alphanumeric characters. " +
    "Ignore any lines, borders or noise. " +
    "Output ONLY the four characters, with no explanation. Analyze deeply and carefully pixel by pixel. Your answer always must be four characters. If you are not sure about any character, output the most likely one.";

// No color-based letter masking: this captcha family draws letters in black and
// yellow too — the same colors as the strike line and unlike the background — so
// any color threshold deletes real characters. The model ignores the strike line
// on its own when told to.
export async function solveCaptcha(imagePath: string): Promise<{ code: string, conf: number | null }> {
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
        options: { temperature: 1, num_ctx: 8192, num_predict: 32 },
        top_logprobs: 1,
        logprobs: true
    });

    // Strip anything that isn't a character
    return { code: res.message.content.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(), conf: calculateConfidence(res.logprobs as Logprob[]) };
}


function calculateConfidence(logprobs: Logprob[]) {
    if (!logprobs?.length) return null;

    const tokens = logprobs.filter(
        item => item.token !== "</think>"
    );

    if (!tokens.length) return null;

    const avgLogProb = tokens.reduce(
        (sum, item) => sum + item.logprob,
        0
    ) / tokens.length;

    return Number((Math.exp(avgLogProb) * 100).toFixed(2));
}
