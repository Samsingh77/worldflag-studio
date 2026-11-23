import type { FlagAspect } from '../data/countries';

export async function svgToPngBlob(
  svgString: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let processedSvg = svgString;
    if (!/\bwidth\s*=/.test(processedSvg.slice(0, 200))) {
      processedSvg = processedSvg.replace(
        '<svg',
        `<svg width="${width}" height="${height}"`
      );
    }

    const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not initialize 2D canvas context'));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Canvas PNG export failed'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode SVG for PNG export'));
    };

    img.src = url;
  });
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadFile(blob, filename);
}

export async function downloadPng(
  svgString: string,
  filename: string,
  size: number,
  aspect: FlagAspect = '4x3'
): Promise<void> {
  const width = size;
  const height = aspect === '1x1' ? size : Math.round((size * 3) / 4);
  const blob = await svgToPngBlob(svgString, width, height);
  downloadFile(blob, filename);
}
