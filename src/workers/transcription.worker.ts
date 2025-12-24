import { pipeline, env } from '@xenova/transformers';

// EXTREME CONFIG: Force everything to remote CDN
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

// The remotePathTemplate is removed to allow the library to use its default.
// This is to fix a bug where the path was being constructed incorrectly.

// Also set WASM paths to CDN to prevent local 404s
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/';
env.backends.onnx.wasm.wasmPaths = CDN_URL;

let transcriber: any = null;

async function getTranscriber(progress_callback: any) {
    if (transcriber === null) {
        // Diagnostic: Check if we can reach the model config directly
        try {
            self.postMessage({ type: 'STATUS', data: 'Contacting the HF Oracle...' });
            // Use a cache-busting param to ensure we see the real network response
            const configUrl = `https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/config.json?t=${Date.now()}`;
            const testResponse = await fetch(configUrl);
            const text = await testResponse.text();
            
            if (text.trim().startsWith('<!DOCTYPE')) {
                const snippet = text.slice(0, 100).replace(/</g, '&lt;');
                throw new Error(`Local server intercepted request! Content starts with: ${snippet}...`);
            }
            JSON.parse(text);
        } catch (e: any) {
            throw new Error(`Oracle Connection Failed: ${e.message}`);
        }

        self.postMessage({ type: 'STATUS', data: 'Channeling the Oracle...' });
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
            progress_callback,
        });
    }
    return transcriber;
}

self.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    if (type === 'PING') {
        self.postMessage({ type: 'PONG', data: 'Worker is alive' });
        return;
    }

    if (type === 'TRANSCRIBE') {
        try {
            const { audio } = data;
            
            const p = await getTranscriber((progress: any) => {
                self.postMessage({ 
                    type: 'DOWNLOAD_PROGRESS', 
                    data: progress 
                });
            });

            self.postMessage({ type: 'STATUS', data: 'Reading the Echo...' });

            const output = await p(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                callback_function: () => {
                    // Optional: could send partial results here
                }
            });

            self.postMessage({ type: 'STATUS', data: 'Scribing the Vision...' });
            self.postMessage({ type: 'COMPLETE', data: output.text });

        } catch (error: any) {
            console.error('Worker Error:', error);
            self.postMessage({ type: 'ERROR', data: `Ritual Error: ${error.message}` });
        }
    }
});