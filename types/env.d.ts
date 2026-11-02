export {}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            HF_TOKEN: `hf_${string}`;
        }
    }
}