declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export const version: string;
  export function getDocument(src: any): {
    promise: Promise<any>;
    onPassword?: (callback: (password: string | Error) => void, reason: number) => void;
  };
}

