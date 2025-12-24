import CryptoJS from 'crypto-js';

export interface BenchmarkResults {
  decryptionTime: number;
  transcriptionTime: number;
}

/**
 * Runs the audio processing benchmark suite.
 * Returns the time taken (in ms) for each operation.
 */
export async function runAudioBenchmark(): Promise<BenchmarkResults> {
  const decryptionTime = await runDecryptionBenchmark();
  const transcriptionTime = await runTranscriptionBenchmark();

  return {
    decryptionTime,
    transcriptionTime,
  };
}

async function runDecryptionBenchmark(): Promise<number> {
  // 1. Setup Phase (Excluded from timer)
  const ITEM_COUNT = 50;
  const ITEM_SIZE_CHARS = 1000;
  const password = 'benchmark-secret-key';
  
  const dummyItems = Array.from({ length: ITEM_COUNT }, (_, i) => ({
    id: `item-${i}`,
    data: generateRandomString(ITEM_SIZE_CHARS),
  }));

  // Pre-encrypt the items to simulate the worker's input state
  const encryptedItems = dummyItems.map(item => ({
    id: item.id,
    data: CryptoJS.AES.encrypt(JSON.stringify(item), password).toString(),
  }));

  // 2. Benchmark Phase
  const start = performance.now();

  // Simulate the logic inside decryption.worker.ts
  encryptedItems.map((item) => {
    try {
      const bytes = CryptoJS.AES.decrypt(item.data, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) return null;
      
      const parsed = JSON.parse(decrypted);
      return { ...parsed, dbId: item.id };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const end = performance.now();
  return end - start;
}

async function runTranscriptionBenchmark(): Promise<number> {
  // 1. Setup Phase
  const start = performance.now();

  // TODO: Implement actual Xenova/transformers benchmark
  // For now, we simulate a workload to test the harness.
  // In a real browser environment, we would load the model.
  // In CI/Test, we avoid downloading the 200MB model.
  
  await new Promise(resolve => setTimeout(resolve, 50)); 

  const end = performance.now();
  return end - start;
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
