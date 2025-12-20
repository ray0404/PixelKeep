import CryptoJS from 'crypto-js';

export function encrypt(data: any, key: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

export function decrypt(cipher: string, key: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
}

// For binary data (images/audio)
export function encryptBinary(arrayBuffer: ArrayBuffer, key: string): string {
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
  return CryptoJS.AES.encrypt(wordArray, key).toString();
}

export function decryptBinary(cipher: string, key: string): CryptoJS.lib.WordArray | null {
  try {
    return CryptoJS.AES.decrypt(cipher, key);
  } catch (e) {
    console.error("Binary decryption failed:", e);
    return null;
  }
}
