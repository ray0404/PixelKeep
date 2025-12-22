import { pipeline, env } from '@xenova/transformers';

// Configuration for local-first environment
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

async function getTranscriber(progress_callback: any) {
    if (transcriber === null) {
        transcriber = await pipeline('automatic-speech-recognition', 'openai/whisper-tiny.en', {
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

    if (type === 'TRANScribe') {
        try {
            const { audio } = data;
            
            self.postMessage({ type: 'STATUS', data: 'Loading Oracle...' });
            
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
                callback_function: (beams: any) => {
                    // Optional: could send partial results here
                }
            });

            self.postMessage({ type: 'STATUS', data: 'Scribing the Vision...' });
            self.postMessage({ type: 'COMPLETE', data: output.text });

        } catch (error: any) {
            self.postMessage({ type: 'ERROR', data: error.message });
        }
    }
});