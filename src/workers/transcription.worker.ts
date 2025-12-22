// Transcription Worker
// This worker will handle the loading and execution of the Whisper model

self.addEventListener('message', async (event) => {
    const { type } = event.data;

    if (type === 'PING') {
        self.postMessage({ type: 'PONG', data: 'Worker is alive' });
    }
});

export {};
