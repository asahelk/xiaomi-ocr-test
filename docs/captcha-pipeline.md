# CAPTCHA pipeline notes

How `solveCaptcha()` in [`captcha-ocr.ts`](../captcha-ocr.ts) works, and why each setting is what it is. Everything here was learned by experimenting against captured captcha samples (`captcha-*.jpg`, `probe-*.jpg`).

## The input

The captcha family this targets arrives as 130×50 px images (PNG data, served with a `.jpg` extension — sharp reads them either way). They contain exactly 4 alphanumeric characters, often overlapping, with a strike line drawn through the letters and mild noise/borders. Letters are drawn in several colors; the strike line shares the black and yellow used by the letters themselves.

## Pipeline

```
130×50 jpg ──sharp──► 400px-wide PNG ──base64──► ollama.chat ──regex+upper──► "AB12"
           resize 400, lanczos3
           normalise()
```

| Stage | Setting | Why |
| --- | --- | --- |
| Upscale | `resize({ width: 400, kernel: "lanczos3" })` | ~3× of the 130 px source. The model reads small text much better after upscaling, but larger factors (4× and up) fuse overlapping letters into blobs. 400 px is the sweet spot found by experiment. |
| Contrast | `.normalise()` | Per-channel contrast stretch; makes faint letter edges more legible without inventing colors. |
| Decode options | `temperature: 0` | Deterministic output — the same image always yields the same answer. |
| | `num_ctx: 8192` | Room for the image tokens plus prompt. |
| | `num_predict: 32` | The answer is 4 characters; a short cap stops the model from rambling explanations. |
| Post-process | `content.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()` | Guards against stray punctuation or whitespace around the answer; uppercase normalizes the model's casing. |

## What didn't work: color-based letter masking

The obvious idea for removing the strike line is to mask by color — keep only pixels in the letter colors, delete the line color. **This fails for this captcha family**: the letters are drawn in black and yellow too, the same colors as the strike line, so any color threshold that deletes the line also deletes real characters.

The fix is to not touch the pixels at all and instead tell the model what to ignore. The prompt says *"Ignore any lines, borders or noise"*, and the model handles the strike line on its own.

## Upscaling experiments

`upscale.ps1` was used to render a captcha at different scales and see what the model receives:

- Near-native resolution: characters too small, the model misreads or refuses.
- Width 400 (~3×): best results.
- 4× and above: overlapping letters fuse together and get read as single characters.

## Reproducing

```bash
bun run index.ts                                # bundled sample
bun run index.ts captcha-1793410708957-465.jpg  # any captured sample
```

To try a different scale, edit the `width` value in `captcha-ocr.ts` and rerun; to inspect what the model sees at a given factor, use `powershell -File upscale.ps1` (expects a `captcha-orig.jpg` in the repo root).
