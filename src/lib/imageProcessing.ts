/**
 * Client-side image processing utilities using Canvas API.
 * All processing happens locally in the browser - no server uploads.
 */

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  originalWidth?: number;
  originalHeight?: number;
}

export interface ConvertOptions {
  format: ImageFormat;
  quality?: number; // 0-1 for JPEG/WebP
  backgroundColor?: string; // For transparent -> opaque conversions
}

export interface CompressOptions {
  quality: number; // 0-1
  format?: ImageFormat;
}

export interface BlurOptions {
  amount: number; // pixels
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  opacity: number; // 0-1
  position: WatermarkPosition;
  rotation: number; // degrees
}

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface MemeTextOptions {
  topText?: string;
  bottomText?: string;
  fontSize?: number;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontFamily?: string;
}

export interface ThumbnailOptions {
  title: string;
  width: number;
  height: number;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  overlayOpacity?: number; // 0-1, dark overlay behind text
  position?: 'center' | 'bottom';
}

/**
 * Load an image from a URL/File into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Create a canvas and draw an image onto it
 */
export function createCanvas(
  width: number,
  height: number,
  image?: HTMLImageElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  if (image) {
    ctx.drawImage(image, 0, 0, width, height);
  }
  return canvas;
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateAspectRatioFit(
  targetWidth: number,
  targetHeight: number,
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  const ratio = Math.min(
    targetWidth / originalWidth,
    targetHeight / originalHeight
  );
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Resize an image
 */
export async function resizeImage(
  imageUrl: string,
  options: ResizeOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  let finalWidth = options.width;
  let finalHeight = options.height;

  if (options.maintainAspectRatio && options.originalWidth && options.originalHeight) {
    const fitted = calculateAspectRatioFit(
      options.width,
      options.height,
      options.originalWidth,
      options.originalHeight
    );
    finalWidth = fitted.width;
    finalHeight = fitted.height;
  }

  const canvas = createCanvas(finalWidth, finalHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Convert image format
 */
export async function convertImage(
  imageUrl: string,
  options: ConvertOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;

  // Handle transparency for JPEG conversion
  if (options.format === 'image/jpeg' && options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const quality = options.quality ?? 0.92;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), options.format, quality);
  });
}

/**
 * Compress image
 */
export async function compressImage(
  imageUrl: string,
  options: CompressOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const format = options.format || 'image/jpeg';
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), format, options.quality);
  });
}

/**
 * Apply blur effect to image
 */
export async function blurImage(
  imageUrl: string,
  options: BlurOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;

  ctx.filter = `blur(${options.amount}px)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Add text watermark to image
 */
export async function addWatermark(
  imageUrl: string,
  options: WatermarkOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // Calculate font size relative to image
  const fontSize = Math.max(
    16,
    Math.round((options.fontSize / 100) * Math.min(canvas.width, canvas.height))
  );
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = options.opacity;

  // Handle rotation
  if (options.rotation !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Calculate position
  const metrics = ctx.measureText(options.text);
  const textWidth = metrics.width;
  const padding = fontSize * 0.5;
  let x: number, y: number;

  switch (options.position) {
    case 'top-left':
      x = padding;
      y = padding + fontSize / 2;
      break;
    case 'top-center':
      x = (canvas.width - textWidth) / 2;
      y = padding + fontSize / 2;
      break;
    case 'top-right':
      x = canvas.width - textWidth - padding;
      y = padding + fontSize / 2;
      break;
    case 'center-left':
      x = padding;
      y = canvas.height / 2;
      break;
    case 'center':
      x = (canvas.width - textWidth) / 2;
      y = canvas.height / 2;
      break;
    case 'center-right':
      x = canvas.width - textWidth - padding;
      y = canvas.height / 2;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - padding - fontSize / 2;
      break;
    case 'bottom-center':
      x = (canvas.width - textWidth) / 2;
      y = canvas.height - padding - fontSize / 2;
      break;
    case 'bottom-right':
      x = canvas.width - textWidth - padding;
      y = canvas.height - padding - fontSize / 2;
      break;
    default:
      x = (canvas.width - textWidth) / 2;
      y = canvas.height / 2;
  }

  // Draw text shadow/outline for readability
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = fontSize * 0.05;
  ctx.strokeText(options.text, x, y);

  // Draw main text
  ctx.fillStyle = options.color;
  ctx.fillText(options.text, x, y);

  ctx.globalAlpha = 1;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Generate meme with top/bottom text
 */
export async function generateMeme(
  imageUrl: string,
  options: MemeTextOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const fontSize =
    options.fontSize || Math.round(canvas.height / 8);
  const fontFamily = options.fontFamily || 'Impact, Arial Black, sans-serif';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = options.textColor || '#FFFFFF';
  ctx.strokeStyle = options.strokeColor || '#000000';
  ctx.lineWidth = options.strokeWidth || fontSize * 0.05;

  const centerX = canvas.width / 2;
  const padding = fontSize * 0.3;

  // Top text
  if (options.topText) {
    const lines = wrapText(ctx, options.topText, canvas.width - padding * 2);
    lines.forEach((line, i) => {
      const y = padding + i * (fontSize * 1.2);
      ctx.strokeText(line, centerX, y);
      ctx.fillText(line, centerX, y);
    });
  }

  // Bottom text
  if (options.bottomText) {
    ctx.textBaseline = 'bottom';
    const lines = wrapText(ctx, options.bottomText, canvas.width - padding * 2);
    const totalHeight = lines.length * fontSize * 1.2;
    lines.forEach((line, i) => {
      const y = canvas.height - padding - (lines.length - 1 - i) * (fontSize * 1.2);
      ctx.strokeText(line, centerX, y);
      ctx.fillText(line, centerX, y);
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Generate thumbnail with title overlay
 */
export async function generateThumbnail(
  imageUrl: string,
  options: ThumbnailOptions
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d')!;

  // Draw background color first if specified
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Cover-fit the image to fill the canvas
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = options.width / options.height;
  let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

  if (imgRatio > canvasRatio) {
    // Image is wider - fit height, crop sides
    drawHeight = options.height;
    drawWidth = drawHeight * imgRatio;
    offsetX = (options.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller - fit width, crop top/bottom
    drawWidth = options.width;
    drawHeight = drawWidth / imgRatio;
    offsetX = 0;
    offsetY = (options.height - drawHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  // Draw overlay for text readability
  const overlayOpacity = options.overlayOpacity ?? 0.4;
  if (overlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw title text
  if (options.title) {
    const fontSize = options.fontSize || Math.round(canvas.height / 8);
    ctx.font = `bold ${fontSize}px Arial Black, Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = options.textColor || '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = fontSize * 0.06;

    const padding = fontSize * 0.5;
    const maxWidth = canvas.width - padding * 2;
    const lines = wrapText(ctx, options.title, maxWidth);
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;

    let startY: number;
    if (options.position === 'bottom') {
      startY = canvas.height - padding - totalTextHeight + lineHeight;
    } else {
      // center
      startY = (canvas.height - totalTextHeight) / 2 + lineHeight;
    }

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Convert multiple images to a single PDF document.
 * Uses manual PDF construction with proper structure including trailer dictionary.
 * All images are re-encoded as JPEG via canvas for consistent embedding.
 */
export async function convertImagesToPdf(
  imageUrls: string[],
  options: {
    pageSize?: 'a4' | 'letter' | 'fit';
    orientation?: 'portrait' | 'landscape';
    margin?: 'none' | 'small' | 'medium' | 'large';
  } = {}
): Promise<Blob> {
  const pdfParts: Uint8Array[] = [];
  const imageStreams: Uint8Array[] = [];
  const SIZES = {
    a4: { w: 595.28, h: 841.89 },
    letter: { w: 612, h: 792 },
  };
  const MARGINS = { none: 0, small: 18, medium: 36, large: 54 };
  const margin = MARGINS[options.margin || 'none'];
  const strToBytes = (str: string): Uint8Array => {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xFF;
    return bytes;
  };
  let currentOffset = 0;
  const addBytes = (bytes: Uint8Array) => {
    pdfParts.push(bytes);
    currentOffset += bytes.length;
  };
  const addStr = (str: string) => {
    const bytes = strToBytes(str);
    addBytes(bytes);
    return bytes.length;
  };
  const imgDimensions: { w: number; h: number }[] = [];
  for (const url of imageUrls) {
    const img = await loadImage(url);
    imgDimensions.push({ w: img.naturalWidth, h: img.naturalHeight });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
    );
    imageStreams.push(new Uint8Array(await blob.arrayBuffer()));
  }
  const offsets: number[] = [];
  let nextObjId = 1;
  const catalogId = nextObjId++;
  const pagesId = nextObjId++;
  const pageCount = imageStreams.length;
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];
  const imageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(nextObjId++);
    contentObjIds.push(nextObjId++);
    imageObjIds.push(nextObjId++);
  }
  const totalObjects = nextObjId;
  const headerBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A,
    0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A
  ]);
  addBytes(headerBytes);
  offsets[catalogId] = currentOffset;
  addStr(catalogId + ' 0 obj' + String.fromCharCode(10) + '<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>' + String.fromCharCode(10) + 'endobj' + String.fromCharCode(10));
  const kidsRefs = pageObjIds.map(id => id + ' 0 R').join(' ');
  offsets[pagesId] = currentOffset;
  addStr(pagesId + ' 0 obj' + String.fromCharCode(10) + '<< /Type /Pages /Kids [' + kidsRefs + '] /Count ' + pageCount + ' >>' + String.fromCharCode(10) + 'endobj' + String.fromCharCode(10));
  for (let i = 0; i < pageCount; i++) {
    const pageId = pageObjIds[i];
    const contentId = contentObjIds[i];
    const imageId = imageObjIds[i];
    const imgData = imageStreams[i];
    const dims = imgDimensions[i];
    let pageW: number, pageH: number;
    const orient = options.orientation || 'portrait';
    if (options.pageSize === 'fit') {
      const maxDim = 3000;
      const scale = Math.min(1, maxDim / Math.max(dims.w, dims.h));
      pageW = dims.w * scale;
      pageH = dims.h * scale;
    } else {
      const size = options.pageSize === 'letter' ? SIZES.letter : SIZES.a4;
      if (orient === 'landscape') { pageW = size.h; pageH = size.w; }
      else { pageW = size.w; pageH = size.h; }
    }
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const imgScale = Math.min(availW / dims.w, availH / dims.h);
    const renderW = dims.w * imgScale;
    const renderH = dims.h * imgScale;
    const renderX = margin + (availW - renderW) / 2;
    const renderY = margin + (availH - renderH) / 2;
    const contentStr = 'q ' + renderW.toFixed(2) + ' 0 0 ' + renderH.toFixed(2) + ' ' + renderX.toFixed(2) + ' ' + renderY.toFixed(2) + ' cm /Img Do Q';
    const contentBytes = strToBytes(contentStr);
    offsets[pageId] = currentOffset;
    addStr(pageId + ' 0 obj' + String.fromCharCode(10) + '<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + pageW.toFixed(2) + ' ' + pageH.toFixed(2) + '] /Contents ' + contentId + ' 0 R /Resources << /XObject << /Img ' + imageId + ' 0 R >> >>' + String.fromCharCode(10) + 'endobj' + String.fromCharCode(10));
    offsets[contentId] = currentOffset;
    addStr(contentId + ' 0 obj' + String.fromCharCode(10) + '<< /Length ' + contentBytes.length + ' >>' + String.fromCharCode(10) + 'stream' + String.fromCharCode(10));
    addBytes(contentBytes);
    addStr(String.fromCharCode(10) + 'endstream' + String.fromCharCode(10) + 'endobj' + String.fromCharCode(10));
    offsets[imageId] = currentOffset;
    addStr(imageId + ' 0 obj' + String.fromCharCode(10) + '<< /Type /XObject /Subtype /Image /Width ' + dims.w + ' /Height ' + dims.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imgData.length + ' >>' + String.fromCharCode(10) + 'stream' + String.fromCharCode(10));
    addBytes(imgData);
    addStr(String.fromCharCode(10) + 'endstream' + String.fromCharCode(10) + 'endobj' + String.fromCharCode(10));
  }
  const xrefOffset = currentOffset;
  let xref = 'xref' + String.fromCharCode(10) + '0 ' + totalObjects + String.fromCharCode(10);
  xref += '0000000000 65535 f ' + String.fromCharCode(10);
  for (let id = 1; id < totalObjects; id++) {
    const off = offsets[id] ?? 0;
    xref += off.toString().padStart(10, '0') + ' 00000 n ' + String.fromCharCode(10);
  }
  xref += 'trailer' + String.fromCharCode(10) + '<< /Size ' + totalObjects + ' /Root ' + catalogId + ' 0 R >>' + String.fromCharCode(10) + 'startxref' + String.fromCharCode(10) + xrefOffset + String.fromCharCode(10) + '%%EOF' + String.fromCharCode(10);
  addStr(xref);
  const combinedParts: BlobPart[] = pdfParts.map(part => {
    if (part instanceof Uint8Array) { return new Uint8Array(part); }
    return part;
  });
  return new Blob(combinedParts, { type: 'application/pdf' });
}
