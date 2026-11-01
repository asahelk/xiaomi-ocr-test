import { beforeAll, expect, test } from "bun:test";
import { ocr } from "./ocr";

const PROMPT =
  "Extract all text from this image exactly as it appears, in reading order.";

let ocrOut = "";

beforeAll(async () => {
  ocrOut = await ocr("test-receipt.png", PROMPT);
  console.log("\n--- OCR output ---\n" + ocrOut + "\n------------------");
}, 240_000);

const normalize = (s: string) => s.replace(/\s+/g, " ").toUpperCase();

test("extracts the invoice number", () => {
  expect(normalize(ocrOut)).toContain("2026-1101");
});

test("extracts line items", () => {
  const out = normalize(ocrOut);
  expect(out).toContain("COFFEE BEANS");
  expect(out).toContain("CERAMIC MUG");
});

test("extracts the correct total", () => {
  expect(normalize(ocrOut)).toContain("42.50");
});

test("does not hallucinate a wrong total", () => {
  expect(normalize(ocrOut)).not.toMatch(/TOTAL[^0-9]*\$?(43|44|45)\./);
});
