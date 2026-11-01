# xiaomi-ocr-test

Experiments with Xiaomi's OCR model (`longwayxu/xiaomi-ocr-0:bf16`) served locally through [Ollama](https://ollama.com), written in TypeScript and run with [Bun](https://bun.com).

The project contains:

- **`ocr()`** — a generic helper that sends any image to the model and returns the extracted text.
- **`solveCaptcha()`** — a CAPTCHA solver that preprocesses 130×50 captcha images with `sharp` and reads the 4-character code.
- **A test suite** — end-to-end receipt OCR checks that verify the model extracts invoice numbers, line items and totals without hallucinating.
- **PowerShell helpers** — scripts that generate the synthetic test receipt and upscale captcha images for experiments.

## Requirements

- [Bun](https://bun.com) v1.4+
- [Ollama](https://ollama.com) running locally (desktop app or `ollama serve`)
- The model:

  ```bash
  ollama pull longwayxu/xiaomi-ocr-0:bf16
  ```

## Setup

```bash
bun install
```

## Usage

### Solve a CAPTCHA from the command line

```bash
bun run index.ts                        # uses the bundled captcha-1793387963764-647.jpg
bun run index.ts path/to/captcha.jpg    # or any image
```

Output:

```
Reading captcha-1793387963764-647.jpg ...
CAPTCHA: 5VGI
```

### Run the receipt OCR tests

```bash
bun test
```

`ocr.test.ts` OCRs the generated `test-receipt.png` and asserts that the invoice number (`2026-1101`), the line items and the `$42.50` total are extracted, and that no wrong total is hallucinated. The Ollama server must be running; the first call loads the model into memory and can take a while, so the setup hook allows 4 minutes.

### Use it from code

Generic OCR of any image:

```ts
import { ocr } from "./ocr";

const text = await ocr("test-receipt.png", "Extract all text from this image exactly as it appears, in reading order.");
console.log(text);
```

Solve a CAPTCHA (returns 4 uppercase alphanumeric characters):

```ts
import { solveCaptcha } from "./captcha-ocr";

const answer = await solveCaptcha("captcha-1793387963764-647.jpg");
console.log(answer); // e.g. "7XK2"
```

## The code

### `ocr.ts` — generic OCR helper

Reads an image file, base64-encodes it and sends it as a single user message to the model. Greedy decoding (`temperature: 0`) keeps output deterministic; a 4096-token cap is enough for full-page text.

```ts
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
```

### `captcha-ocr.ts` — CAPTCHA solver

The captcha images are tiny (130×50 px) with a strike line drawn through the letters. The solver upscales to 400 px width, stretches the contrast, and asks the model for exactly the 4 characters; anything non-alphanumeric in the reply is stripped and the result is uppercased.

```ts
import sharp from "sharp";
import ollama from "ollama";

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
```

Preprocessing findings (why these exact settings) are documented in [docs/captcha-pipeline.md](docs/captcha-pipeline.md).

### `index.ts` — CLI entry point

Takes the image path from `argv[2]` (defaulting to a bundled captcha sample) and prints the solved code. Top-level `await` works because Bun supports it.

## Helper scripts (PowerShell)

Both scripts use Windows `System.Drawing`, so they only run on Windows:

- **`gen-image.ps1`** — regenerates `test-receipt.png`, a synthetic 600×420 coffee-shop invoice used by the test suite. Run from the repo root: `powershell -File gen-image.ps1`.
- **`upscale.ps1`** — experiment helper that upscales a `captcha-orig.jpg` in the repo root 4× to `captcha-4x.png` with high-quality bicubic interpolation. Useful for eyeballing what the model sees at different scales.

## Project structure

| File | Purpose |
| --- | --- |
| `ocr.ts` | Generic `ocr(imagePath, prompt)` helper around `ollama.chat` |
| `captcha-ocr.ts` | `solveCaptcha()` — sharp preprocessing + 4-character captcha reading |
| `index.ts` | CLI entry point: `bun run index.ts [image]` |
| `ocr.test.ts` | Bun test suite: end-to-end receipt OCR assertions |
| `gen-image.ps1` | Generates `test-receipt.png` |
| `upscale.ps1` | Upscales `captcha-orig.jpg` 4× to `captcha-4x.png` |
| `captcha-*.jpg` | Captured captcha samples (130×50 px, PNG data despite the extension) |
| `probe-*.jpg` | Extra captcha capture used for probing model behavior |
| `test-receipt.png` | Synthetic receipt image the tests OCR |
| `docs/captcha-pipeline.md` | Deep dive: preprocessing experiments and findings |
