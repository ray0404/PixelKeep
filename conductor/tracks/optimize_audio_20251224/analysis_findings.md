# Analysis Findings

## Bottlenecks Identified

1. **Main Thread Audio Decoding:**
   - Location: `src/stores/useTranscriptionStore.ts`
   - Issue: `audioContext.decodeAudioData` is called on the main thread. This blocks the UI while decoding the audio blob into a buffer.
   - Impact: UI freezes when starting transcription.

2. **Data Copying overhead:**
   - Location: `src/stores/useTranscriptionStore.ts` -> `src/workers/transcription.worker.ts`
   - Issue: `float32Data` (which can be large) is sent via `postMessage` without using the `transfer` parameter. This causes the browser to clone the data.
   - Impact: Increased memory usage and delay in starting the worker.

3. **Lack of Granular Progress:**
   - Location: `src/workers/transcription.worker.ts`
   - Issue: The worker only reports 'DOWNLOAD_PROGRESS' and generic 'STATUS'. The `pipeline` callback function is empty: `callback_function: () => { // Optional: could send partial results here }`.
   - Impact: User sees a static 'Transcribing...' message for the duration of the process.

4. **Decryption Efficiency (Potential):**
   - Location: `src/workers/decryption.worker.ts`
   - Issue: `CryptoJS` is synchronous. While in a worker, processing large batches might be slow.
   - Impact: Latency in loading notes if many need decryption.
