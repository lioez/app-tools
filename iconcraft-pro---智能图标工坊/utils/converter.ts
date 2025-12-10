/**
 * Creates a valid ICO file binary from a PNG blob.
 * A simple ICO implementation supporting a single image.
 */
export const pngToIco = async (pngBlob: Blob): Promise<Blob> => {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngData = new Uint8Array(pngBuffer);
  
  // Get image dimensions via a temporary bitmap
  const bitmap = await createImageBitmap(pngBlob);
  const width = bitmap.width > 255 ? 0 : bitmap.width; // 0 means 256
  const height = bitmap.height > 255 ? 0 : bitmap.height; // 0 means 256
  
  // ICO Header (6 bytes)
  const header = new Uint8Array([
    0, 0,             // Reserved
    1, 0,             // Type (1 = ICO)
    1, 0              // Count (1 image)
  ]);

  // Image Entry (16 bytes)
  const entry = new Uint8Array(16);
  const view = new DataView(entry.buffer);
  
  entry[0] = width;   // Width
  entry[1] = height;  // Height
  entry[2] = 0;       // Color palette (0 = no palette)
  entry[3] = 0;       // Reserved
  view.setUint16(4, 1, true); // Color planes (1)
  view.setUint16(6, 32, true); // Bits per pixel (32)
  view.setUint32(8, pngData.length, true); // Size of image data
  view.setUint32(12, 6 + 16, true); // Offset (Header + Entry)

  // Concatenate parts
  const icoData = new Uint8Array(header.length + entry.length + pngData.length);
  icoData.set(header, 0);
  icoData.set(entry, header.length);
  icoData.set(pngData, header.length + entry.length);

  return new Blob([icoData], { type: 'image/x-icon' });
};

/**
 * Wraps a PNG/Image URL into an SVG container.
 * This allows "converting" a raster image to SVG format.
 */
export const createSvgWrapper = (dataUrl: string, width: number, height: number): Blob => {
  const svgContent = `
<svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}" />
</svg>`.trim();

  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};