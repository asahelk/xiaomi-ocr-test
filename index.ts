import { solveCaptcha } from "./captcha-ocr";

const imagePath = process.argv[2] ?? "captcha-1793387963764-647.jpg";

console.log(`Reading ${imagePath} ...`);
const answer = await solveCaptcha(imagePath);
console.log("CAPTCHA:", answer);
