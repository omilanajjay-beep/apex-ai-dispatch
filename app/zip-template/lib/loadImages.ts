export async function fetchImageWithProgress(
  url: string,
  onProgress: (loadedBytes: number, totalBytes: number) => void
): Promise<HTMLImageElement> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);

  const totalBytes = Number(response.headers.get('Content-Length')) || 0;
  const reader = response.body?.getReader();
  
  if (!reader) {
    const blob = await response.blob();
    return createImageElement(blob);
  }

  let receivedBytes = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      onProgress(receivedBytes, totalBytes);
    }
  }

  const blobParts: BlobPart[] = chunks.map((chunk) => {
    const buffer = new ArrayBuffer(chunk.byteLength);
    new Uint8Array(buffer).set(chunk);
    return buffer;
  });
  const blob = new Blob(blobParts);
  return createImageElement(blob);
}

function createImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}
