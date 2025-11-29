export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read blob as a data URL."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
