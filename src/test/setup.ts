import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock Worker
class WorkerMock {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null;
  
  constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = null;
  }

  postMessage(_msg: any) {
    // Basic echo for testing, or just do nothing
    // In real app, worker sends back decrypted data.
    // We can simulate async response.
    if (this.onmessage) {
       // Simulate empty response or error depending on need, 
       // but for now just silence the error.
       // setTimeout(() => this.onmessage!({ data: { data: [] } } as any), 0);
    }
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

global.Worker = WorkerMock as any;

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
