declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export const version: string;
  export interface PDFPageProxy {
    rotate: number;
    getViewport: (params: { scale: number; rotation?: number }) => {
      width: number;
      height: number;
      convertToViewportPoint: (x: number, y: number) => [number, number];
    };
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
    getTextContent: () => Promise<{ items: Array<{ str: string; transform: number[]; width: number }> }>;
  }
  export interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  }
  export function getDocument(src: unknown): {
    promise: Promise<PDFDocumentProxy>;
    onPassword?: (callback: (password: string | Error) => void, reason: number) => void;
  };
}

