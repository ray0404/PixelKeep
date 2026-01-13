import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption Utils', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const original = 'secret message';
    const key = 'password123';
    
    const cipher = encrypt(original, key);
    expect(cipher).not.toBe(original);
    
    const decrypted = decrypt(cipher, key);
    expect(decrypted).toBe(original);
  });

  it('should encrypt and decrypt an object correctly', () => {
    const original = { title: 'My Note', content: 'Hidden stuff' };
    const key = 'password123';
    
    const cipher = encrypt(original, key);
    const decrypted = decrypt(cipher, key);
    
    expect(decrypted).toEqual(original);
  });

  it('should return null for incorrect password', () => {
    const original = 'secret message';
    const key = 'password123';
    const wrongKey = 'password456';
    
    const cipher = encrypt(original, key);
    const decrypted = decrypt(cipher, wrongKey);
    
    // Crypto-js often returns empty string or garbage on wrong key, 
    // but our util catches errors.
    // Ideally it returns null or throws. 
    // Based on the code: "return decrypted ? JSON.parse(decrypted) : null;"
    // If decryption fails to produce valid UTF8, .toString() is empty.
    expect(decrypted).toBeNull();
  });
});