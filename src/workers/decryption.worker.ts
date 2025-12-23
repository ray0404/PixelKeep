import CryptoJS from 'crypto-js';

self.onmessage = (event) => {
  const { items, password, type } = event.data;

  if (!items || !password) {
    self.postMessage({ type, data: [] });
    return;
  }

  try {
    const decryptedData = items.map((item: any) => {
      try {
        const bytes = CryptoJS.AES.decrypt(item.data, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;
        
        const parsed = JSON.parse(decrypted);
        // Ensure ID is preserved from the record if it's not in the encrypted data
        return { ...parsed, dbId: item.id };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    self.postMessage({ type, data: decryptedData });
  } catch (e) {
    self.postMessage({ type, error: 'Decryption batch failed' });
  }
};
