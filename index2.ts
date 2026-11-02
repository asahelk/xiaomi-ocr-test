// index.ts
import { Client, handle_file } from "@gradio/client";
import { join } from "path";
const HF_TOKEN = Bun.env.HF_TOKEN; // or process.env.API_TOKEN

// Explicitly configuring your live Hugging Face Space endpoint
const SPACE_URL = "https://colemadmh-cej-monitor.hf.space";

async function runOCR() {
    try {
        console.log("Establishing handshakes with the Hugging Face Space engine...");
        // The client automatically manages state, headers, and initialization parameters
        const app = await Client.connect(SPACE_URL, { token: HF_TOKEN });

        const imagePath = join(import.meta.dir, "probe-1793523963317-m2.jpg");
        const promptText = "This is a CAPTCHA image containing exactly four uppercase alphanumeric characters. Ignore any lines, borders or noise. Output ONLY the four characters, with no explanation. Analyze deeply and carefully pixel by pixel. Your answer always must be four characters. If you are not sure about any character, output the most likely one.";

        console.log("Submitting job payload to endpoint pipeline...");

        // Explicitly targeting the custom defined "/ocr" api name signature
        const result = await app.predict("/ocr", {
            image: handle_file(imagePath),
            prompt: promptText,
        });

        console.log("\n--- OCR Processing Complete ---");
        console.log(JSON.stringify(result.data, null, 2));

    } catch (error) {
        console.error("Pipeline processing failure:", error);
    }
}

runOCR();
