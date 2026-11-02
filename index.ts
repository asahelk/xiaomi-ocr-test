import { solveCaptcha } from "./captcha-ocr";

const imagePath = process.argv[2] ?? "probe-1793523963317-m2.jpg";
// const imagePath = process.argv[2] ?? "probe-1793523963357-m2-gris.png";

console.log(`Reading ${imagePath} ...`);
const answer = await solveCaptcha(imagePath);
console.log("CAPTCHA:", answer);
