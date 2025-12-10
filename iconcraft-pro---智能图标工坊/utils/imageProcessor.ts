import { removeBackground } from "@imgly/background-removal";
import { FileFormat } from '../types';
import { pngToIco, createSvgWrapper } from './converter';

// Configuration to load WASM assets
// 使用本地模型文件，避免 CDN 加载问题
const getPublicPath = () => {
  const base = window.location.origin;
  return `${base}/models/`;
};

const IMGLY_CONFIG = {
  publicPath: getPublicPath(),
  debug: true,
  progress: (key: string, current: number, total: number) => {
    // console.log(`Downloading ${key}: ${current} / ${total}`);
  }
};

/**
 * Removes background using @imgly/background-removal (WebAssembly).
 */
export const processBackgroundRemoval = async (imageSource: string | Blob): Promise<Blob> => {
  try {
    // removeBackground returns a Blob directly
    const blob = await removeBackground(imageSource, IMGLY_CONFIG);
    return blob;
  } catch (error) {
    console.error("Background removal failed:", error);
    // Provide a more helpful error message
    throw new Error("模型资源加载失败。请检查网络连接 (cdn.jsdelivr.net)。");
  }
};

/**
 * Resizes an image and exports it to the requested format.
 */
export const resizeAndExport = async (
  sourceUrl: string,
  width: number,
  height: number,
  format: FileFormat
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Handle Formats
      if (format === FileFormat.SVG) {
        // For SVG, we convert the resized canvas to PNG data URL first
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(createSvgWrapper(pngDataUrl, width, height));
        return;
      }

      if (format === FileFormat.ICO) {
        // Convert canvas to blob (PNG) then wrap in ICO
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error("Conversion failed"));
            return;
          }
          try {
            const icoBlob = await pngToIco(blob);
            resolve(icoBlob);
          } catch (e) {
            reject(e);
          }
        }, 'image/png');
        return;
      }

      // Standard Formats (PNG, WEBP)
      const mimeType = format === FileFormat.WEBP ? 'image/webp' : 'image/png';
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Blob creation failed"));
      }, mimeType, 1.0);
    };

    img.onerror = () => reject(new Error("Failed to load processed image"));
    img.crossOrigin = "anonymous";
    img.src = sourceUrl;
  });
};