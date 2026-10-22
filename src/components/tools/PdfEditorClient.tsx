"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { notify } from "@/lib/toast";
import styles from "./PdfEditor.module.css";

// ── Types ──────────────────────────────────────────────────────────
export type ToolType =
  | "select"
  | "editText"
  | "text"
  | "draw"
  | "highlight"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "image"
  | "signature"
  | "comment";

export interface Annotation {
  id: string;
  pageIndex: number;
  type: ToolType;
  x: number; // PDF points (72 DPI)
  y: number; // PDF points (72 DPI)
  width: number;
  height: number;
  // Text specific
  text?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  fontFamily?: "Helvetica" | "TimesRoman" | "Courier";
  // Shape / Draw specific
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  points?: Array<{ x: number; y: number }>;
  // Image / Signature
  dataUrl?: string;
  // Comment specific
  commentAuthor?: string;
}

export interface ExistingTextItem {
  id: string;
  pageIndex: number;
  originalText: string;
  currentText: string;
  x: number; // Viewport screen X at scale 1.0 (from top-left)
  y: number; // Viewport screen Y at scale 1.0 (from top-left)
  tx: number; // PDF.js native tx coordinate
  ty: number; // PDF.js native ty coordinate (baseline from bottom)
  originalWidth: number; // original text width in points
  width: number; // dynamic width in points (auto-expands for longer text!)
  height: number; // height in points
  fontSize: number; // font size in points
  originalFontSize: number;
  fontFamily: "Helvetica" | "TimesRoman" | "Courier";
  fontName: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  isDeleted: boolean;
  isModified: boolean;
  canNativeEdit: boolean; // whether text was verified in PDF stream
  source: "pdf-native" | "ocr";
  subStrings?: string[];
  rotation?: number; // text orientation in degrees
  bgColor?: string; // sampled local background color (e.g. #FFFFFF)
  baselineX: number; // Exact screen baseline X at scale 1.0 (prevents vertical displacement)
  baselineY: number; // Exact screen baseline Y at scale 1.0 (prevents vertical displacement)
}

export interface PageMeta {
  pageIndex: number; // 0, 1, 2... in output order
  originalPageIndex: number; // -1 if newly added blank page
  width: number; // in PDF points
  height: number; // in PDF points
  rotation: number; // additional rotation in degrees (0, 90, 180, 270)
}

interface HistoryStep {
  pages: PageMeta[];
  annotations: Annotation[];
  existingTexts: ExistingTextItem[];
}

// ── Color & Coordinate Helpers ─────────────────────────────────────
function hexToRgb(hex: string) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16) || 0;
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ── Character-Aware Accurate Text Measurement ──────────────────────
let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

export function calculateTextWidth(
  text: string,
  fontSize: number,
  fontFamily: "Helvetica" | "TimesRoman" | "Courier" = "Helvetica",
  bold: boolean = false,
  italic: boolean = false
): number {
  if (!text) return 0;
  if (typeof window !== "undefined") {
    if (!measureCanvas) {
      measureCanvas = document.createElement("canvas");
      measureCtx = measureCanvas.getContext("2d");
    }
    if (measureCtx) {
      const weight = bold ? "bold " : "";
      const style = italic ? "italic " : "";
      let cssFam = "Helvetica, Arial, sans-serif";
      if (fontFamily === "TimesRoman") cssFam = "'Times New Roman', Times, serif";
      else if (fontFamily === "Courier") cssFam = "'Courier New', Courier, monospace";

      measureCtx.font = `${style}${weight}${fontSize}px ${cssFam}`;
      const m = measureCtx.measureText(text);
      if (m.width > 0) return Math.ceil(m.width);
    }
  }

  // Character-aware mathematical fallback
  let width = 0;
  for (const ch of text) {
    if ("ijlItf1.,:;!|'".includes(ch)) width += fontSize * 0.32;
    else if ("mwMW_@%#".includes(ch)) width += fontSize * 0.85;
    else if (" ".includes(ch)) width += fontSize * 0.28;
    else if (ch >= "0" && ch <= "9") width += fontSize * (fontFamily === "Courier" ? 0.60 : 0.56);
    else if (ch >= "A" && ch <= "Z") width += fontSize * 0.68;
    else width += fontSize * 0.52;
  }
  if (bold) width *= 1.08;
  return Math.ceil(width);
}

// ── Icons (High-performance inline SVGs) ───────────────────────────
function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FitWidthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 2 12 4 10" />
      <polyline points="20 14 22 12 20 10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RotateCwIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowUpIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EditExistingTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function PdfEditorClient() {
  // ── Document State ───────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>("Generating edited PDF...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // ── Existing Text Detection & Editing State ───────────────────────
  const [existingTexts, setExistingTexts] = useState<ExistingTextItem[]>([]);
  const [selectedExistingTextId, setSelectedExistingTextId] = useState<string | null>(null);
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [ocrProgressText, setOcrProgressText] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "ben" | "eng+ben">("eng");
  const [scannedPages, setScannedPages] = useState<{ [pageIndex: number]: boolean }>({});
  const ocrRunningRef = useRef<boolean>(false);

  // ── General Editing State ────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Tool settings defaults
  const [currentColor, setCurrentColor] = useState<string>("#1E293B");
  const [currentFontSize, setCurrentFontSize] = useState<number>(16);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(3);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // Undo / Redo
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Signature modal state
  const [isSigModalOpen, setIsSigModalOpen] = useState<boolean>(false);
  const [sigTab, setSigTab] = useState<"draw" | "type" | "upload">("draw");
  const [typedSigText, setTypedSigText] = useState<string>("");
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigDrawing, setIsSigDrawing] = useState<boolean>(false);

  // Canvas interaction refs
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const pageCanvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const drawCanvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const currentDrawPoints = useRef<Array<{ x: number; y: number }>>([]);
  const isPointerDownRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const drawingPageIdxRef = useRef<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const resizingHandle = useRef<string | null>(null);

  // Thumbnail Cache & Controlled Queue State
  const [thumbnailCache, setThumbnailCache] = useState<{ [pageIndex: number]: string }>({});
  const [thumbnailStatus, setThumbnailStatus] = useState<{ [pageIndex: number]: "idle" | "loading" | "loaded" | "error" }>({});
  const thumbnailQueueRef = useRef<number[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const pageRenderTasksRef = useRef<{ [pageIndex: number]: any }>({});

  // ── Setup PDF.js Worker ──────────────────────────────────────────
  const getPdfJs = useCallback(async () => {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = window.location.origin + "/pdf.worker.min.mjs";
    }
    return pdfjs;
  }, []);

  // ── Undo / Redo Push ─────────────────────────────────────────────
  const pushHistory = useCallback(
    (newAnnotations: Annotation[], newPages: PageMeta[], newExistingTexts: ExistingTextItem[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push({
          annotations: JSON.parse(JSON.stringify(newAnnotations)),
          pages: JSON.parse(JSON.stringify(newPages)),
          existingTexts: JSON.parse(JSON.stringify(newExistingTexts)),
        });
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const step = history[historyIndex - 1];
      setAnnotations(JSON.parse(JSON.stringify(step.annotations)));
      setPages(JSON.parse(JSON.stringify(step.pages)));
      setExistingTexts(JSON.parse(JSON.stringify(step.existingTexts)));
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
      setSelectedExistingTextId(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const step = history[historyIndex + 1];
      setAnnotations(JSON.parse(JSON.stringify(step.annotations)));
      setPages(JSON.parse(JSON.stringify(step.pages)));
      setExistingTexts(JSON.parse(JSON.stringify(step.existingTexts)));
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
      setSelectedExistingTextId(null);
    }
  }, [history, historyIndex]);

  // ── Existing Text Operations ──────────────────────────────────────
  const updateExistingText = (id: string, newText: string) => {
    setExistingTexts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newWidth = calculateTextWidth(
          newText,
          item.fontSize,
          item.fontFamily,
          item.bold,
          item.italic
        );
        return {
          ...item,
          currentText: newText,
          width: Math.max(item.originalWidth, newWidth),
          isModified: newText !== item.originalText,
        };
      })
    );
  };

  const applyExistingTextEdit = (id: string, shouldDeselect: boolean = true) => {
    const target = existingTexts.find((t) => t.id === id);
    if (!target) return;

    const isActuallyModified =
      target.currentText !== target.originalText ||
      target.fontSize !== target.originalFontSize ||
      target.bold ||
      target.italic ||
      target.underline ||
      target.color !== "#1E293B" ||
      target.align !== "left";

    const updated = existingTexts.map((t) => (t.id === id ? { ...t, isModified: isActuallyModified } : t));
    setExistingTexts(updated);

    if (isActuallyModified) {
      pushHistory(annotations, pages, updated);
      notify.success("Text changes saved");
    }

    if (shouldDeselect) {
      setSelectedExistingTextId(null);
    }
  };

  const cancelExistingTextEdit = (id: string) => {
    setExistingTexts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          currentText: item.originalText,
          fontSize: item.originalFontSize,
          fontFamily: item.fontFamily,
          bold: false,
          italic: false,
          underline: false,
          color: "#1E293B",
          align: "left",
          width: item.originalWidth,
          isModified: false,
        };
      })
    );
    setSelectedExistingTextId(null);
    notify.info("Canceled text change");
  };

  const deleteExistingText = (id: string) => {
    const updated = existingTexts.map((item) => {
      if (item.id !== id) return item;
      return { ...item, isDeleted: true, isModified: true };
    });
    setExistingTexts(updated);
    pushHistory(annotations, pages, updated);
    setSelectedExistingTextId(null);
    notify.info("Original text deleted from document");
  };

  const restoreExistingText = (id: string) => {
    const updated = existingTexts.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        currentText: item.originalText,
        fontSize: item.originalFontSize,
        width: item.originalWidth,
        isDeleted: false,
        isModified: false,
      };
    });
    setExistingTexts(updated);
    pushHistory(annotations, pages, updated);
    notify.success("Restored original text");
  };

  const getLineAvailableSpace = (item: ExistingTextItem): number => {
    const pageMeta = pages[item.pageIndex] || { width: 595, height: 842 };
    const pageItems = existingTexts.filter(
      (t) => t.pageIndex === item.pageIndex && !t.isDeleted && t.id !== item.id
    );
    const rightNeighbor = pageItems
      .filter((t) => Math.abs(t.ty - item.ty) < 4 && t.x > item.x)
      .sort((a, b) => a.x - b.x)[0];

    if (rightNeighbor) {
      return Math.max(10, rightNeighbor.x - item.x - 4);
    }
    return Math.max(10, (pageMeta.width || 600) - item.x - 20);
  };

  const autoFitFontSize = (id: string) => {
    const target = existingTexts.find((t) => t.id === id);
    if (!target) return;
    const available = getLineAvailableSpace(target);
    if (target.width <= available) return;
    const ratio = available / target.width;
    const newSize = Math.max(8, Math.floor(target.fontSize * ratio));
    const newWidth = calculateTextWidth(
      target.currentText,
      newSize,
      target.fontFamily,
      target.bold,
      target.italic
    );
    const updated = existingTexts.map((item) =>
      item.id === id
        ? {
            ...item,
            fontSize: newSize,
            width: Math.max(item.originalWidth, newWidth),
            isModified: true,
          }
        : item
    );
    setExistingTexts(updated);
    pushHistory(annotations, pages, updated);
    notify.info("Adjusted font size to fit column without overlap.");
  };

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y, Delete, Esc, Arrow nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (isInput) {
        if (e.key === "Escape") {
          if (selectedExistingTextId) setSelectedExistingTextId(null);
          if (editingTextId) setEditingTextId(null);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !editingTextId) {
          e.preventDefault();
          const next = annotations.filter((a) => a.id !== selectedId);
          setAnnotations(next);
          pushHistory(next, pages, existingTexts);
          setSelectedId(null);
          notify.info("Object deleted");
        } else if (selectedExistingTextId) {
          e.preventDefault();
          deleteExistingText(selectedExistingTextId);
        }
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedExistingTextId(null);
        setEditingTextId(null);
        if (activeTool !== "select") {
          setActiveTool("select");
        }
      } else if (
        selectedId &&
        !editingTextId &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== selectedId) return a;
            if (e.key === "ArrowLeft") return { ...a, x: Math.max(0, a.x - step) };
            if (e.key === "ArrowRight") return { ...a, x: a.x + step };
            if (e.key === "ArrowUp") return { ...a, y: Math.max(0, a.y - step) };
            if (e.key === "ArrowDown") return { ...a, y: a.y + step };
            return a;
          })
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, annotations, editingTextId, existingTexts, pages, pushHistory, redo, selectedExistingTextId, selectedId, undo]);

  // Auto-focus and text select when editing an inserted text annotation
  useEffect(() => {
    if (editingTextId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`annot-text-${editingTextId}`);
        if (el) {
          el.focus();
          try {
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          } catch (err) {}
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [editingTextId]);

  // ── Extract Native Text Content per Page (No OCR needed for normal PDFs) ──
  const extractPageTextContent = useCallback(
    async (docProxy: any, pagesMetaList: PageMeta[], sourceBytes: ArrayBuffer | null) => {
      if (!docProxy) return;
      setIsExtractingText(true);

      const allExtracted: ExistingTextItem[] = [];
      const scannedMap: { [pageIndex: number]: boolean } = {};

      // Inspect content streams from source PDF to verify native stream modification support
      let rawStreamTexts: { [pageIndex: number]: string } = {};
      if (sourceBytes && sourceBytes.byteLength > 0) {
        try {
          const { PDFDocument, PDFArray, PDFRef, decodePDFRawStream } = await import("pdf-lib");
          const tempDoc = await PDFDocument.load(sourceBytes.slice(0), { ignoreEncryption: true });
          for (let pIdx = 0; pIdx < pagesMetaList.length; pIdx++) {
            const meta = pagesMetaList[pIdx];
            if (meta.originalPageIndex < 0) continue;
            const p = tempDoc.getPage(meta.originalPageIndex);
            const contents = p.node.Contents();
            const streamRefs: any[] = [];
            if (contents instanceof PDFArray) {
              for (let c = 0; c < contents.size(); c++) streamRefs.push(contents.get(c));
            } else if (contents) {
              streamRefs.push(contents);
            }
            let combinedStreamStr = "";
            for (const ref of streamRefs) {
              const stream = ref instanceof PDFRef ? tempDoc.context.lookup(ref) : ref;
              if (!stream) continue;
              try {
                const filterObj = stream.dict?.get(tempDoc.context.obj("Filter"));
                if (filterObj?.toString()?.includes("FlateDecode")) {
                  const decoded = decodePDFRawStream(stream).decode();
                  combinedStreamStr += new TextDecoder("latin1").decode(decoded) + "\n";
                } else {
                  combinedStreamStr += new TextDecoder("latin1").decode(stream.getContents()) + "\n";
                }
              } catch (e) {
                // stream decoding skipped
              }
            }
            rawStreamTexts[pIdx] = combinedStreamStr;
          }
        } catch (e) {
          console.warn("Could not inspect raw content streams:", e);
        }
      }

      for (let pIdx = 0; pIdx < pagesMetaList.length; pIdx++) {
        const meta = pagesMetaList[pIdx];
        if (meta.originalPageIndex === -1) continue;

        try {
          const page = await docProxy.getPage(meta.originalPageIndex + 1);
          const totalRotation = (page.rotate + meta.rotation) % 360;
          const viewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
          meta.width = viewport.width;
          meta.height = viewport.height;

          const textContent = await page.getTextContent();
          const rawItems = textContent.items || [];

          if (rawItems.length === 0) {
            scannedMap[pIdx] = true;
            continue;
          }

          const sorted = [...rawItems].filter((it: any) => it.str && it.str.trim().length > 0);
          if (sorted.length === 0) {
            scannedMap[pIdx] = true;
            continue;
          }

          // Sort items primarily by baseline (Y) top-to-bottom, and secondarily by X left-to-right
          sorted.sort((a: any, b: any) => {
            const ptA = viewport.convertToViewportPoint(a.transform[4], a.transform[5]);
            const ptB = viewport.convertToViewportPoint(b.transform[4], b.transform[5]);
            const dy = ptA[1] - ptB[1];
            if (Math.abs(dy) > 3) return dy;
            return ptA[0] - ptB[0];
          });

          // Intelligent Text Grouping:
          // Groups contiguous items that belong to the SAME word or phrase in reading order.
          // STRICTLY PRESERVES column boundaries, table cells, and separate fields!
          const groups: any[][] = [];
          let currentGroup: any[] = [];

          sorted.forEach((item: any) => {
            if (currentGroup.length === 0) {
              currentGroup.push(item);
            } else {
              const prev = currentGroup[currentGroup.length - 1];

              // If previous item signaled end-of-line, start new group
              if (prev.hasEOL) {
                groups.push(currentGroup);
                currentGroup = [item];
                return;
              }

              const ptPrevStart = viewport.convertToViewportPoint(prev.transform[4], prev.transform[5]);
              const ptPrevEnd = viewport.convertToViewportPoint(
                prev.transform[4] + (prev.width || 0),
                prev.transform[5]
              );
              const ptItemStart = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);

              const prevFs = Math.max(
                8,
                Math.hypot(prev.transform[0], prev.transform[1]) || Math.abs(prev.transform[3]) || 12
              );
              const itemFs = Math.max(
                8,
                Math.hypot(item.transform[0], item.transform[1]) || Math.abs(item.transform[3]) || 12
              );

              // 1. Same baseline check (vertical difference <= font size fraction)
              const baselineDiff = Math.abs(ptPrevStart[1] - ptItemStart[1]);
              const sameBaseline = baselineDiff <= Math.max(2.5, Math.min(prevFs, itemFs) * 0.25);

              // 2. Font size compatibility
              const compatibleSize = Math.abs(prevFs - itemFs) <= 2;

              // 3. Horizontal continuity check (strictly preventing table column merging!)
              const screenGap = ptItemStart[0] - ptPrevEnd[0];

              // Normal space between words in typography is ~0.25-0.35 * fontSize
              // Maximum gap allowed within a single phrase/word group:
              const maxAllowedGap = Math.min(Math.max(prevFs * 0.65, 5), 12);

              const isContiguousRun =
                sameBaseline &&
                compatibleSize &&
                screenGap >= -prevFs * 0.35 &&
                screenGap <= maxAllowedGap;

              if (isContiguousRun) {
                currentGroup.push(item);
              } else {
                groups.push(currentGroup);
                currentGroup = [item];
              }
            }
          });
          if (currentGroup.length > 0) groups.push(currentGroup);

          // Convert groups into ExistingTextItem
          groups.forEach((groupItems, groupIdx) => {
            const first = groupItems[0];
            const last = groupItems[groupItems.length - 1];

            // Build combined text
            let combinedText = "";
            groupItems.forEach((it: any, idx: number) => {
              if (idx === 0) {
                combinedText += it.str;
              } else {
                const prev = groupItems[idx - 1];
                const prevEndsSpace = prev.str.endsWith(" ");
                const itStartsSpace = it.str.startsWith(" ");
                if (prevEndsSpace || itStartsSpace) {
                  combinedText += it.str;
                } else {
                  const ptPrevEnd = viewport.convertToViewportPoint(
                    prev.transform[4] + (prev.width || 0),
                    prev.transform[5]
                  );
                  const ptCurrStart = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
                  const gap = ptCurrStart[0] - ptPrevEnd[0];
                  if (gap >= (it.transform[0] || 12) * 0.18) {
                    combinedText += " " + it.str;
                  } else {
                    combinedText += it.str;
                  }
                }
              }
            });
            combinedText = combinedText.trim();
            if (!combinedText) return;

            const fontSize = Math.max(
              8,
              Math.round(Math.hypot(first.transform[0], first.transform[1]) || Math.abs(first.transform[3]) || 14)
            );
            const tx = first.transform[4];
            const ty = first.transform[5]; // exact PDF baseline

            const advanceWidth = Math.max(4, (last.transform[4] + (last.width || 0)) - tx);
            const ascent = fontSize * 0.85;
            const descent = fontSize * 0.2;

            const p1 = viewport.convertToViewportPoint(tx, ty - descent);
            const p2 = viewport.convertToViewportPoint(tx, ty + ascent);
            const p3 = viewport.convertToViewportPoint(tx + advanceWidth, ty - descent);
            const p4 = viewport.convertToViewportPoint(tx + advanceWidth, ty + ascent);

            const minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
            const maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
            const minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
            const maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);

            const screenX = Math.round(minX);
            const screenY = Math.round(minY);
            const screenW = Math.max(6, Math.round(maxX - minX));
            const screenH = Math.max(10, Math.round(maxY - minY));

            const textAngle = Math.round(Math.atan2(first.transform[1], first.transform[0]) * (180 / Math.PI));
            const rotation = (textAngle + totalRotation) % 360;

            const baselinePt = viewport.convertToViewportPoint(tx, ty);
            const baselineX = Math.round(baselinePt[0] * 100) / 100;
            const baselineY = Math.round(baselinePt[1] * 100) / 100;

            let detectedFamily: "Helvetica" | "TimesRoman" | "Courier" = "Helvetica";
            const fontLower = (first.fontName || "").toLowerCase();
            if (fontLower.includes("times") || fontLower.includes("serif") || fontLower.includes("roman")) {
              detectedFamily = "TimesRoman";
            } else if (fontLower.includes("courier") || fontLower.includes("mono")) {
              detectedFamily = "Courier";
            }

            // Verify whether native stream modification is supported for this item
            const streamForPage = rawStreamTexts[pIdx] || "";
            const hexMatch = Array.from(new TextEncoder().encode(combinedText))
              .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
              .join("");
            const hasHexInStream = hexMatch.length >= 4 && streamForPage.includes(hexMatch);
            const hasLitInStream = streamForPage.includes(combinedText.replace(/([()\\])/g, "\\$1"));
            const hasTmInStream = streamForPage.includes(`1 0 0 1 ${Math.round(tx)}`);
            const canNativeEdit = hasHexInStream || hasLitInStream || hasTmInStream;

            allExtracted.push({
              id: `ext_${pIdx}_${groupIdx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              pageIndex: pIdx,
              originalText: combinedText,
              currentText: combinedText,
              x: screenX,
              y: screenY,
              tx,
              ty,
              baselineX,
              baselineY,
              originalWidth: screenW,
              width: screenW,
              height: screenH,
              fontSize,
              originalFontSize: fontSize,
              fontFamily: detectedFamily,
              fontName: first.fontName || "Helvetica",
              color: "#1E293B",
              bold: fontLower.includes("bold"),
              italic: fontLower.includes("italic") || fontLower.includes("oblique"),
              underline: false,
              align: "left",
              isDeleted: false,
              isModified: false,
              canNativeEdit,
              source: "pdf-native",
              subStrings: groupItems.map((i: any) => i.str),
              rotation,
            });
          });
        } catch (err) {
          console.error(`Failed to extract text from page ${pIdx + 1}:`, err);
        }
      }

      setExistingTexts(allExtracted);
      setScannedPages(scannedMap);
      setIsExtractingText(false);
    },
    []
  );

  // ── Run OCR on a Scanned Page (Controlled, Safe, No Duplicates) ────
  const runOcrOnPage = async (pageIdx: number) => {
    if (ocrRunningRef.current) return;
    const canvas = pageCanvasRefs.current[pageIdx];
    if (!canvas) {
      notify.error("Page canvas is not ready yet.");
      return;
    }

    ocrRunningRef.current = true;
    setIsOcrRunning(true);
    setOcrError(null);
    setOcrProgressText("Initializing OCR engine...");

    try {
      // Use locally installed tesseract.js worker
      const { createWorker } = await import("tesseract.js");
      setOcrProgressText(`Loading language data (${ocrLanguage})...`);

      const worker = await createWorker(ocrLanguage, 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgressText(`Recognizing text (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        },
        errorHandler: (err: any) => console.warn("OCR worker notice:", err),
      });

      const result = await worker.recognize(canvas);
      await worker.terminate();

      const rawData = result?.data as any;
      const lines = rawData?.lines || (rawData?.blocks ? rawData.blocks.flatMap((b: any) => (b.paragraphs || []).flatMap((p: any) => p.lines || [])) : []);
      if (!lines || lines.length === 0) {
        notify.info("No readable text recognized on this page.");
        return;
      }

      const meta = pages[pageIdx] || { width: 600, height: 800 };
      const scaleX = meta.width / canvas.width;
      const scaleY = meta.height / canvas.height;

      const newOcrItems: ExistingTextItem[] = [];

      lines.forEach((line: any, lIdx: number) => {
        const text = (line.text || "").trim();
        if (!text) return;

        const x = Math.round(line.bbox.x0 * scaleX);
        const y = Math.round(line.bbox.y0 * scaleY);
        const w = Math.round((line.bbox.x1 - line.bbox.x0) * scaleX);
        const h = Math.round((line.bbox.y1 - line.bbox.y0) * scaleY);
        const fontSize = Math.max(10, Math.round(h * 0.85));

        newOcrItems.push({
          id: `ocr_${pageIdx}_${lIdx}_${Date.now()}`,
          pageIndex: pageIdx,
          originalText: text,
          currentText: text,
          x,
          y,
          tx: x,
          ty: meta.height - y - h,
          baselineX: x,
          baselineY: Math.round((y + h * 0.82) * 100) / 100,
          originalWidth: Math.max(30, w),
          width: Math.max(30, w),
          height: Math.max(14, h),
          fontSize,
          originalFontSize: fontSize,
          fontFamily: "Helvetica",
          fontName: "OCR_Detected",
          color: "#1E293B",
          bold: false,
          italic: false,
          underline: false,
          align: "left",
          isDeleted: false,
          isModified: false,
          canNativeEdit: false,
          source: "ocr",
          subStrings: [text],
        });
      });

      const updated = [...existingTexts.filter((t) => t.pageIndex !== pageIdx), ...newOcrItems];
      setExistingTexts(updated);
      pushHistory(annotations, pages, updated);

      setScannedPages((prev) => ({ ...prev, [pageIdx]: false }));
      notify.success(`OCR detected ${newOcrItems.length} editable text lines!`);
      setActiveTool("editText");
    } catch (err: any) {
      console.warn("OCR initialization or recognition error:", err);
      const friendlyMsg = "Text recognition is unavailable. You can continue editing PDFs with selectable text.";
      setOcrError(friendlyMsg);
      notify.warning(friendlyMsg, { id: "ocr-error-notification" });
    } finally {
      ocrRunningRef.current = false;
      setIsOcrRunning(false);
      setOcrProgressText("");
    }
  };

  // ── PDF Loading & Initialization ─────────────────────────────────
  const loadPdfFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdf") && selectedFile.type !== "application/pdf") {
      setErrorMsg("Please upload a valid PDF document (.pdf).");
      notify.error("Invalid file format. Please upload a PDF.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMsg("File size exceeds 50MB limit. Please upload a smaller PDF.");
      notify.error("File exceeds 50MB limit.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setOcrError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();

      const headerBytes = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 1024)));
      const headerStr = String.fromCharCode(...headerBytes);
      if (!headerStr.includes("%PDF")) {
        throw new Error("This file does not appear to be a valid PDF document.");
      }

      // Preserve an immutable, canonical buffer for the main thread and repeated exports:
      const canonicalBuffer = buffer.slice(0);
      setPdfBytes(canonicalBuffer);

      // Pass an independent byte clone to PDF.js worker so transfer CANNOT detach canonicalBuffer:
      const pdfjs = await getPdfJs();
      const pdfjsData = new Uint8Array(canonicalBuffer.slice(0));
      const loadingTask = pdfjs.getDocument({
        data: pdfjsData,
        cMapUrl: "https://unpkg.com/pdfjs-dist@" + pdfjs.version + "/cmaps/",
        cMapPacked: true,
      });

      loadingTask.onPassword = (callback: any) => {
        const pass = window.prompt("This PDF document is password-protected. Enter password:");
        if (pass) {
          callback(pass);
        } else {
          callback(new Error("Password required"));
        }
      };

      const docProxy = await loadingTask.promise;
      setPdfDocProxy(docProxy);
      setFile(selectedFile);

      const initialPages: PageMeta[] = [];
      for (let i = 1; i <= docProxy.numPages; i++) {
        const page = await docProxy.getPage(i);
        const vp = page.getViewport({ scale: 1.0 });
        initialPages.push({
          pageIndex: i - 1,
          originalPageIndex: i - 1,
          width: vp.width,
          height: vp.height,
          rotation: 0,
        });
      }

      setPages(initialPages);
      setAnnotations([]);
      setSelectedId(null);
      setSelectedExistingTextId(null);
      setCurrentPage(0);

      // Initialize progressive thumbnail queue for multi-page documents
      setThumbnailCache({});
      setThumbnailStatus({});
      thumbnailQueueRef.current = initialPages.map((_, idx) => idx);

      // Extract existing native text items across all pages using safe buffer clone
      extractPageTextContent(docProxy, initialPages, canonicalBuffer.slice(0));

      // Initialize history
      setHistory([{ pages: initialPages, annotations: [], existingTexts: [] }]);
      setHistoryIndex(0);

      notify.success(`Loaded "${selectedFile.name}" (${initialPages.length} pages)`);
    } catch (err: any) {
      console.error("PDF load error:", err);
      setErrorMsg(err.message || "Failed to parse PDF document. It may be corrupted or protected.");
      notify.error("Could not load PDF document.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render PDF Page to Canvas ────────────────────────────────────
  const renderPageCanvas = useCallback(
    async (pageMeta: PageMeta, canvas: HTMLCanvasElement, renderScale: number) => {
      if (!canvas || !pdfDocProxy) return;

      if (pageMeta.originalPageIndex === -1) {
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const width = pageMeta.width * renderScale;
        const height = pageMeta.height * renderScale;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }
        return;
      }

      try {
        const page = await pdfDocProxy.getPage(pageMeta.originalPageIndex + 1);
        const rotation = (page.rotate + pageMeta.rotation) % 360;
        const viewport = page.getViewport({ scale: renderScale, rotation });

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cancel previous rendering task on this canvas if one was running
        if (pageRenderTasksRef.current[pageMeta.pageIndex]) {
          try {
            pageRenderTasksRef.current[pageMeta.pageIndex].cancel();
          } catch (e) {
            // ignore cancellation
          }
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        pageRenderTasksRef.current[pageMeta.pageIndex] = renderTask;

        try {
          await renderTask.promise;
        } catch (rErr: any) {
          if (rErr?.name === "RenderingCancelledException") {
            ctx.restore();
            return;
          }
          throw rErr;
        } finally {
          if (pageRenderTasksRef.current[pageMeta.pageIndex] === renderTask) {
            delete pageRenderTasksRef.current[pageMeta.pageIndex];
          }
        }

        // Cleanly redact original text on the canvas for modified/deleted items using local background color
        const targetPageIdx = pageMeta.pageIndex;
        const modifiedOnThisPage = existingTexts.filter(
          (t) => (t.pageIndex === targetPageIdx || t.pageIndex === pageMeta.originalPageIndex) && (t.isModified || t.isDeleted)
        );

        if (modifiedOnThisPage.length > 0) {
          modifiedOnThisPage.forEach((item) => {
            let bgStyle = "#FFFFFF";
            try {
              const sampleX = Math.max(0, Math.floor((item.x - 2) * renderScale * dpr));
              const sampleY = Math.max(0, Math.floor((item.y - 2) * renderScale * dpr));
              const pixelData = ctx.getImageData(sampleX, sampleY, 1, 1).data;
              if (pixelData[3] > 0) {
                bgStyle = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
              }
            } catch (e) {
              bgStyle = "#FFFFFF";
            }

            ctx.fillStyle = bgStyle;
            const rx = Math.max(0, (item.x - 1) * renderScale);
            const ry = Math.max(0, (item.y - 1) * renderScale);
            const rw = (item.originalWidth + 2) * renderScale;
            const rh = (item.height + 2) * renderScale;
            ctx.fillRect(rx, ry, rw, rh);
          });
        }

        ctx.restore();
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Render error on page ${pageMeta.pageIndex + 1}:`, err);
        }
      }
    },
    [pdfDocProxy, pages, existingTexts]
  );

  // ── Controlled Progressive Thumbnail Generation Queue ───────────
  const processThumbnailQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    if (!pdfDocProxy) return;

    isProcessingQueueRef.current = true;

    try {
      while (thumbnailQueueRef.current.length > 0) {
        const pageIdx = thumbnailQueueRef.current.shift();
        if (pageIdx === undefined) break;

        const pageMeta = pages[pageIdx];
        if (!pageMeta) continue;

        // Skip if already in cache
        if (thumbnailCache[pageIdx]) continue;

        setThumbnailStatus((prev) => ({ ...prev, [pageIdx]: "loading" }));

        try {
          let pageDataUrl = "";
          if (pageMeta.originalPageIndex === -1) {
            const offscreenCanvas = document.createElement("canvas");
            offscreenCanvas.width = 140;
            offscreenCanvas.height = Math.round(140 * ((pageMeta.height || 800) / (pageMeta.width || 600)));
            const ctx = offscreenCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              pageDataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.8);
            }
          } else {
            const page = await pdfDocProxy.getPage(pageMeta.originalPageIndex + 1);
            const totalRotation = (page.rotate + pageMeta.rotation) % 360;
            const targetWidth = 140;
            const unscaledVp = page.getViewport({ scale: 1.0, rotation: totalRotation });
            const thumbScale = targetWidth / (unscaledVp.width || 600);
            const viewport = page.getViewport({ scale: thumbScale, rotation: totalRotation });

            const offscreenCanvas = document.createElement("canvas");
            offscreenCanvas.width = Math.floor(viewport.width);
            offscreenCanvas.height = Math.floor(viewport.height);

            const ctx = offscreenCanvas.getContext("2d", { alpha: false });
            if (ctx) {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

              const renderTask = page.render({
                canvasContext: ctx,
                viewport: viewport,
              });
              await renderTask.promise;
              pageDataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.8);
            }
          }

          if (pageDataUrl) {
            setThumbnailCache((prev) => ({ ...prev, [pageIdx]: pageDataUrl }));
            setThumbnailStatus((prev) => ({ ...prev, [pageIdx]: "loaded" }));
          } else {
            setThumbnailStatus((prev) => ({ ...prev, [pageIdx]: "error" }));
          }
        } catch (pageErr: any) {
          if (pageErr?.name !== "RenderingCancelledException") {
            console.warn(`Thumbnail generation notice for page ${pageIdx + 1}:`, pageErr);
            setThumbnailStatus((prev) => ({ ...prev, [pageIdx]: "error" }));
          }
        }

        // 16ms tick interval yields to UI so typing, scrolling, and clicking stay fluid
        await new Promise((r) => setTimeout(r, 16));
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [pdfDocProxy, pages, thumbnailCache]);

  const retryThumbnail = (pageIdx: number) => {
    setThumbnailStatus((prev) => ({ ...prev, [pageIdx]: "loading" }));
    thumbnailQueueRef.current.unshift(pageIdx);
    processThumbnailQueue();
  };

  // Render pages when zoom, pages, or document proxy change
  useEffect(() => {
    if (!pdfDocProxy || pages.length === 0) return;

    pages.forEach((pageMeta, idx) => {
      const pageCanvas = pageCanvasRefs.current[idx];
      if (pageCanvas) {
        renderPageCanvas(pageMeta, pageCanvas, zoom);
      }
    });
  }, [pdfDocProxy, pages, zoom, renderPageCanvas]);

  // Trigger thumbnail queue when document or pages change
  useEffect(() => {
    if (!pdfDocProxy || pages.length === 0) return;
    processThumbnailQueue();
  }, [pdfDocProxy, pages, processThumbnailQueue]);

  // ── Drag & Drop Handlers for Upload ──────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPdfFile(e.dataTransfer.files[0]);
    }
  };

  // ── Page Operations ──────────────────────────────────────────────
  const rotatePage = (pageIdx: number) => {
    const newPages = pages.map((p, i) => {
      if (i === pageIdx) {
        const nextRot = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...p, rotation: nextRot, width: p.height, height: p.width };
      }
      return p;
    });
    setPages(newPages);

    // Invalidate thumbnail for rotated page and re-queue it
    setThumbnailCache((prev) => {
      const copy = { ...prev };
      delete copy[pageIdx];
      return copy;
    });
    thumbnailQueueRef.current.unshift(pageIdx);
    processThumbnailQueue();

    // Re-extract text content with updated viewport for the rotated page
    if (pdfDocProxy) {
      extractPageTextContent(pdfDocProxy, newPages, pdfBytes ? pdfBytes.slice(0) : null);
    }
    pushHistory(annotations, newPages, existingTexts);
    notify.info(`Rotated page ${pageIdx + 1} 90°`);
  };

  const deletePage = (pageIdx: number) => {
    if (pages.length <= 1) {
      notify.warning("Document must have at least one page.");
      return;
    }
    const newPages = pages
      .filter((_, i) => i !== pageIdx)
      .map((p, i) => ({ ...p, pageIndex: i }));
    const newAnnotations = annotations.filter((a) => a.pageIndex !== pageIdx);
    const newExistingTexts = existingTexts.filter((t) => t.pageIndex !== pageIdx);
    setPages(newPages);
    setAnnotations(newAnnotations);
    setExistingTexts(newExistingTexts);

    setThumbnailCache({});
    setThumbnailStatus({});
    thumbnailQueueRef.current = newPages.map((_, i) => i);
    processThumbnailQueue();

    pushHistory(newAnnotations, newPages, newExistingTexts);
    if (currentPage >= newPages.length) {
      setCurrentPage(newPages.length - 1);
    }
    notify.info(`Deleted page ${pageIdx + 1}`);
  };

  const duplicatePage = (pageIdx: number) => {
    const target = pages[pageIdx];
    const newPage: PageMeta = {
      ...target,
      pageIndex: pageIdx + 1,
    };
    const newPages = [...pages.slice(0, pageIdx + 1), newPage, ...pages.slice(pageIdx + 1)].map(
      (p, i) => ({ ...p, pageIndex: i })
    );
    setPages(newPages);

    setThumbnailCache({});
    setThumbnailStatus({});
    thumbnailQueueRef.current = newPages.map((_, i) => i);
    processThumbnailQueue();

    pushHistory(annotations, newPages, existingTexts);
    notify.success(`Duplicated page ${pageIdx + 1}`);
  };

  const movePage = (pageIdx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? pageIdx - 1 : pageIdx + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[pageIdx];
    newPages[pageIdx] = newPages[targetIdx];
    newPages[targetIdx] = temp;
    const reindexed = newPages.map((p, i) => ({ ...p, pageIndex: i }));

    const newAnnotations = annotations.map((a) => {
      if (a.pageIndex === pageIdx) return { ...a, pageIndex: targetIdx };
      if (a.pageIndex === targetIdx) return { ...a, pageIndex: pageIdx };
      return a;
    });

    const newExistingTexts = existingTexts.map((t) => {
      if (t.pageIndex === pageIdx) return { ...t, pageIndex: targetIdx };
      if (t.pageIndex === targetIdx) return { ...t, pageIndex: pageIdx };
      return t;
    });

    setPages(reindexed);
    setAnnotations(newAnnotations);
    setExistingTexts(newExistingTexts);

    setThumbnailCache({});
    setThumbnailStatus({});
    thumbnailQueueRef.current = reindexed.map((_, i) => i);
    processThumbnailQueue();
    pushHistory(newAnnotations, reindexed, newExistingTexts);
    setCurrentPage(targetIdx);
    notify.info(`Moved page to position ${targetIdx + 1}`);
  };

  const addBlankPage = () => {
    const lastPage = pages[pages.length - 1] || { width: 595, height: 842 };
    const newPage: PageMeta = {
      pageIndex: pages.length,
      originalPageIndex: -1,
      width: lastPage.width,
      height: lastPage.height,
      rotation: 0,
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    pushHistory(annotations, newPages, existingTexts);
    setCurrentPage(pages.length);
    notify.success("Added new blank page");
  };

  // ── Overlay Click to Add Object ───────────────────────────────────
  const handlePageClick = (pageIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select") {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.annotationItem}`) && !target.closest(`.${styles.existingTextItem}`)) {
        setSelectedId(null);
        setEditingTextId(null);
        setSelectedExistingTextId(null);
      }
      return;
    }

    if (activeTool === "editText") {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.existingTextItem}`)) {
        setSelectedExistingTextId(null);
      }
      return;
    }

    const pageMeta = pages[pageIdx] || { width: 595, height: 842 };
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    if (activeTool === "text") {
      const newId = "text_" + Date.now();
      const newAnnotation: Annotation = {
        id: newId,
        pageIndex: pageIdx,
        type: "text",
        x: Math.round(Math.max(10, Math.min(clickX, pageMeta.width - 160))),
        y: Math.round(Math.max(10, Math.min(clickY, pageMeta.height - 36))),
        width: 160,
        height: 36,
        text: "Type here...",
        fontSize: currentFontSize || 16,
        color: currentColor || "#000000",
        bold: isBold,
        italic: isItalic,
        align: textAlign,
        fontFamily: "Helvetica",
      };
      const next = [...annotations, newAnnotation];
      setAnnotations(next);
      pushHistory(next, pages, existingTexts);
      setSelectedId(newId);
      setEditingTextId(newId);
      setActiveTool("select");
      notify.info("Text inserted. Start typing...");
    } else if (activeTool === "comment") {
      const newId = "comment_" + Date.now();
      const newAnnotation: Annotation = {
        id: newId,
        pageIndex: pageIdx,
        type: "comment",
        x: Math.round(Math.max(10, Math.min(clickX, pageMeta.width - 140))),
        y: Math.round(Math.max(10, Math.min(clickY, pageMeta.height - 60))),
        width: 140,
        height: 60,
        text: "Note: ",
        fontSize: 12,
        color: "#1E293B",
        strokeColor: "#F59E0B",
        fillColor: "#FEF3C7",
      };
      const next = [...annotations, newAnnotation];
      setAnnotations(next);
      pushHistory(next, pages, existingTexts);
      setSelectedId(newId);
      setEditingTextId(newId);
      setActiveTool("select");
      notify.info("Note comment added.");
    }
  };

  // ── Freehand Drawing Handlers ─────────────────────────────────────
  const startDrawing = (pageIdx: number, e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw" && activeTool !== "highlight") return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    drawingPageIdxRef.current = pageIdx;

    const canvas = drawCanvasRefs.current[pageIdx];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    currentDrawPoints.current = [{ x, y }];

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x * zoom, y * zoom);
      const isHl = activeTool === "highlight";
      const strokeW = (isHl ? Math.max(16, currentStrokeWidth) : currentStrokeWidth) * zoom;
      ctx.lineWidth = strokeW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (isHl) {
        if (currentColor && currentColor.startsWith("#") && currentColor !== "#1E293B" && currentColor !== "#000000") {
          const c = hexToRgb(currentColor);
          ctx.strokeStyle = `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 0.5)`;
        } else {
          ctx.strokeStyle = "rgba(254, 240, 138, 0.5)";
        }
      } else {
        ctx.strokeStyle = currentColor;
      }
    }
  };

  const drawMove = (pageIdx: number, e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || drawingPageIdxRef.current !== pageIdx) return;
    if (activeTool !== "draw" && activeTool !== "highlight") return;
    e.preventDefault();
    const canvas = drawCanvasRefs.current[pageIdx];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    currentDrawPoints.current.push({ x, y });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x * zoom, y * zoom);
      ctx.stroke();
    }
  };

  const stopDrawing = (pageIdx: number, e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || drawingPageIdxRef.current !== pageIdx) return;
    isPointerDownRef.current = false;
    drawingPageIdxRef.current = null;
    if (e && activePointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(activePointerIdRef.current);
      } catch (err) {}
    }
    activePointerIdRef.current = null;

    const canvas = drawCanvasRefs.current[pageIdx];
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const pts = currentDrawPoints.current;
    if (pts.length < 2) {
      currentDrawPoints.current = [];
      return;
    }

    const isHl = activeTool === "highlight";
    const strokeW = isHl ? Math.max(16, currentStrokeWidth) : currentStrokeWidth;
    const padding = Math.ceil(strokeW / 2) + 2;

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(maxX - minX + padding * 2, 10);
    const height = Math.max(maxY - minY + padding * 2, 10);

    const relPoints = pts.map((p) => ({
      x: Math.round(p.x - minX + padding),
      y: Math.round(p.y - minY + padding),
    }));

    let strokeCol = currentColor;
    if (isHl) {
      strokeCol =
        currentColor && currentColor.startsWith("#") && currentColor !== "#1E293B" && currentColor !== "#000000"
          ? currentColor
          : "#FEF08A";
    }

    const newId = (isHl ? "hl_" : "draw_") + Date.now();
    const newAnnotation: Annotation = {
      id: newId,
      pageIndex: pageIdx,
      type: activeTool,
      x: Math.round(minX - padding),
      y: Math.round(minY - padding),
      width: Math.round(width),
      height: Math.round(height),
      strokeColor: strokeCol,
      strokeWidth: strokeW,
      points: relPoints,
    };

    const next = [...annotations, newAnnotation];
    setAnnotations(next);
    pushHistory(next, pages, existingTexts);
    currentDrawPoints.current = [];
    // Keep active tool so user can draw multiple strokes continuously!
  };

  // ── Shape Insert Helpers ──────────────────────────────────────────
  const insertShape = (shapeType: "rectangle" | "circle" | "line" | "arrow") => {
    const page = pages[currentPage] || { width: 595, height: 842 };
    const newId = shapeType + "_" + Date.now();
    const newAnnotation: Annotation = {
      id: newId,
      pageIndex: currentPage,
      type: shapeType,
      x: Math.round(page.width / 2 - 80),
      y: Math.round(page.height / 2 - 40),
      width: 160,
      height: shapeType === "line" || shapeType === "arrow" ? 4 : 80,
      strokeColor: currentColor,
      strokeWidth: currentStrokeWidth,
      fillColor: "transparent",
    };
    const next = [...annotations, newAnnotation];
    setAnnotations(next);
    pushHistory(next, pages, existingTexts);
    setSelectedId(newId);
    setActiveTool("select");
    notify.success(`Inserted ${shapeType}`);
  };

  // ── Image Insert Handler ──────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const page = pages[currentPage] || { width: 595, height: 842 };
          const newId = "img_" + Date.now();
          const newAnnotation: Annotation = {
            id: newId,
            pageIndex: currentPage,
            type: "image",
            x: Math.round((page.width - w) / 2),
            y: Math.round((page.height - h) / 2),
            width: w,
            height: h,
            dataUrl,
          };

          const next = [...annotations, newAnnotation];
          setAnnotations(next);
          pushHistory(next, pages, existingTexts);
          setSelectedId(newId);
          setActiveTool("select");
          notify.success("Image placed on document");
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // ── Signature Canvas Handlers ─────────────────────────────────────
  const startSigDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsSigDrawing(true);
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const moveSigDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSigDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSigDraw = () => {
    setIsSigDrawing(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const confirmSignature = () => {
    let dataUrl = "";
    if (sigTab === "draw") {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      dataUrl = canvas.toDataURL("image/png");
    } else if (sigTab === "type") {
      if (!typedSigText.trim()) {
        notify.warning("Please type a name for the signature.");
        return;
      }
      const offscreen = document.createElement("canvas");
      offscreen.width = 400;
      offscreen.height = 120;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.font = "italic 44px cursive, 'Brush Script MT', 'Dancing Script'";
        ctx.fillStyle = "#1E293B";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedSigText, 200, 60);
      }
      dataUrl = offscreen.toDataURL("image/png");
    }

    if (!dataUrl) {
      notify.warning("Please provide a signature first.");
      return;
    }

    const page = pages[currentPage] || { width: 595, height: 842 };
    const newId = "sig_" + Date.now();
    const newAnnotation: Annotation = {
      id: newId,
      pageIndex: currentPage,
      type: "signature",
      x: Math.round(page.width / 2 - 90),
      y: Math.round(page.height / 2 - 35),
      width: 180,
      height: 70,
      dataUrl,
    };

    const next = [...annotations, newAnnotation];
    setAnnotations(next);
    pushHistory(next, pages, existingTexts);
    setSelectedId(newId);
    setIsSigModalOpen(false);
    setActiveTool("select");
    notify.success("Signature inserted");
  };

  // ── Drag & Resize Annotation Objects ──────────────────────────────
  const handleObjectMouseDown = (
    id: string,
    e: React.MouseEvent<HTMLDivElement>,
    handle?: string
  ) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    setSelectedExistingTextId(null);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    resizingHandle.current = handle || null;

    const targetObj = annotations.find((a) => a.id === id);
    if (!targetObj) return;

    const pageMeta = pages[targetObj.pageIndex] || { width: 595, height: 842 };
    const startX = targetObj.x;
    const startY = targetObj.y;
    const startW = targetObj.width;
    const startH = targetObj.height;
    let didMove = false;

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!dragStartPos.current) return;
      moveEv.preventDefault();
      const dx = (moveEv.clientX - dragStartPos.current.x) / zoom;
      const dy = (moveEv.clientY - dragStartPos.current.y) / zoom;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        didMove = true;
      }

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const h = resizingHandle.current;
          if (h === "se") {
            return {
              ...a,
              width: Math.max(20, Math.round(startW + dx)),
              height: Math.max(16, Math.round(startH + dy)),
            };
          } else if (h === "sw") {
            const newW = Math.max(20, Math.round(startW - dx));
            const newX = Math.round(startX + (startW - newW));
            return {
              ...a,
              x: newX,
              width: newW,
              height: Math.max(16, Math.round(startH + dy)),
            };
          } else if (h === "ne") {
            const newH = Math.max(16, Math.round(startH - dy));
            const newY = Math.round(startY + (startH - newH));
            return {
              ...a,
              y: newY,
              width: Math.max(20, Math.round(startW + dx)),
              height: newH,
            };
          } else if (h === "nw") {
            const newW = Math.max(20, Math.round(startW - dx));
            const newH = Math.max(16, Math.round(startH - dy));
            const newX = Math.round(startX + (startW - newW));
            const newY = Math.round(startY + (startH - newH));
            return {
              ...a,
              x: newX,
              y: newY,
              width: newW,
              height: newH,
            };
          } else {
            const clampedX = Math.max(0, Math.min(pageMeta.width - startW, Math.round(startX + dx)));
            const clampedY = Math.max(0, Math.min(pageMeta.height - startH, Math.round(startY + dy)));
            return {
              ...a,
              x: clampedX,
              y: clampedY,
            };
          }
        })
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dragStartPos.current = null;
      resizingHandle.current = null;
      if (didMove) {
        setAnnotations((current) => {
          pushHistory(current, pages, existingTexts);
          return current;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // ── Export / Download Edited PDF with Genuine Native Text Mod ───────
  const exportEditedPdf = async () => {
    // 1. Resolve a valid, non-detached ArrayBuffer snapshot
    let activeBuffer: ArrayBuffer | null = null;
    if (pdfBytes && pdfBytes.byteLength > 0) {
      activeBuffer = pdfBytes.slice(0);
    } else if (file) {
      // Safe fallback if buffer was ever detached or missing: re-read from File
      const freshBuffer = await file.arrayBuffer();
      const canonical = freshBuffer.slice(0);
      setPdfBytes(canonical);
      activeBuffer = freshBuffer.slice(0);
    }

    if (!activeBuffer || activeBuffer.byteLength === 0) {
      notify.error("No valid PDF data available to export. Please re-upload.");
      return;
    }

    setIsExporting(true);
    setExportProgressText("Preparing document structure...");

    try {
      const {
        PDFDocument,
        rgb,
        degrees,
        StandardFonts,
        PDFArray,
        PDFRef,
        decodePDFRawStream,
      } = await import("pdf-lib");

      setExportProgressText("Loading original PDF pages & content streams...");
      const loadedDoc = await PDFDocument.load(activeBuffer, { ignoreEncryption: true });

      // ── Step 1: Genuine Native Content Stream Redaction ────────────
      for (let i = 0; i < pages.length; i++) {
        const pageMeta = pages[i];
        if (pageMeta.originalPageIndex < 0) continue;

        const targetModifiedTexts = existingTexts.filter(
          (t) => t.pageIndex === i && (t.isModified || t.isDeleted) && t.source === "pdf-native"
        );

        if (targetModifiedTexts.length > 0) {
          setExportProgressText(`Modifying native text streams on page ${i + 1}...`);
          const loadedPage = loadedDoc.getPage(pageMeta.originalPageIndex);
          const contents = loadedPage.node.Contents();
          const context = loadedDoc.context;

          const streamRefs: any[] = [];
          if (contents instanceof PDFArray) {
            for (let c = 0; c < contents.size(); c++) streamRefs.push(contents.get(c));
          } else if (contents) {
            streamRefs.push(contents);
          }

          for (const ref of streamRefs) {
            const stream = ref instanceof PDFRef ? context.lookup(ref) : ref;
            if (!stream) continue;

            let streamText = "";
            let isFlate = false;

            try {
              const filterObj = stream.dict?.get(context.obj("Filter"));
              isFlate = filterObj?.toString()?.includes("FlateDecode") || false;

              if (isFlate) {
                const decoded = decodePDFRawStream(stream).decode();
                streamText = new TextDecoder("latin1").decode(decoded);
              } else {
                streamText = new TextDecoder("latin1").decode(stream.getContents());
              }
            } catch (decErr) {
              continue;
            }

            let streamChanged = false;

            for (const item of targetModifiedTexts) {
              const searchStrings: string[] = [item.originalText];
              if (item.subStrings && item.subStrings.length > 0) {
                item.subStrings.forEach((s) => {
                  if (s && s.trim().length > 1) searchStrings.push(s.trim());
                });
              }

              for (const targetStr of searchStrings) {
                if (!targetStr || targetStr.trim().length === 0) continue;

                // 1. Check ASCII hex representation: <HEX...>
                const hexStr = Array.from(new TextEncoder().encode(targetStr))
                  .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                  .join("");

                if (hexStr.length >= 4 && streamText.includes(hexStr)) {
                  const hexRegex = new RegExp("<" + hexStr + ">", "g");
                  streamText = streamText.replace(hexRegex, "<>");
                  streamChanged = true;
                }

                // 2. Check UTF-16BE hex representation (common in Word/Chrome/InDesign PDFs)
                const utf16Hex = Array.from(targetStr)
                  .map((c) => c.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase())
                  .join("");

                if (utf16Hex.length >= 4 && streamText.includes(utf16Hex)) {
                  const utf16Regex = new RegExp("<" + utf16Hex + ">", "g");
                  streamText = streamText.replace(utf16Regex, "<>");
                  streamChanged = true;
                }

                // 3. Check literal string representation: (STRING) - matches standalone and inside TJ arrays
                const escapedLit = targetStr.replace(/([()\\])/g, "\\$1");
                const litPattern = new RegExp("\\(" + escapedLit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\)", "g");
                if (litPattern.test(streamText)) {
                  streamText = streamText.replace(litPattern, "()");
                  streamChanged = true;
                }
              }

              // 4. Fallback coordinate-based stream operator redaction
              if (!streamChanged && item.tx !== undefined && item.ty !== undefined) {
                const txInt = Math.round(item.tx);
                const tyInt = Math.round(item.ty);
                const coordRegex = new RegExp(
                  `1\\s+0\\s+0\\s+1\\s+${txInt}(?:\\.[0-9]+)?\\s+${tyInt}(?:\\.[0-9]+)?\\s+Tm[\\s\\S]*?(?:<[0-9A-Fa-f]+>|\\([^)]*\\)|\\[[^\\]]*\\])\\s*(?:Tj|TJ)`,
                  "g"
                );
                if (coordRegex.test(streamText)) {
                  streamText = streamText.replace(coordRegex, `1 0 0 1 ${txInt} ${tyInt} Tm () Tj`);
                  streamChanged = true;
                }
              }
            }

            if (streamChanged) {
              const newStream = isFlate ? context.flateStream(streamText) : context.stream(streamText);
              if (ref instanceof PDFRef) {
                context.assign(ref, newStream);
              }
            }
          }
        }
      }

      // ── Step 2: Assemble Target Document Pages & Overlays ─────────
      const outDoc = await PDFDocument.create();

      // Standard fonts cache
      const fontHelvetica = await outDoc.embedFont(StandardFonts.Helvetica);
      const fontHelveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
      const fontHelveticaOblique = await outDoc.embedFont(StandardFonts.HelveticaOblique);
      const fontHelveticaBoldOblique = await outDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      const fontTimes = await outDoc.embedFont(StandardFonts.TimesRoman);
      const fontTimesBold = await outDoc.embedFont(StandardFonts.TimesRomanBold);
      const fontTimesItalic = await outDoc.embedFont(StandardFonts.TimesRomanItalic);
      const fontCourier = await outDoc.embedFont(StandardFonts.Courier);
      const fontCourierBold = await outDoc.embedFont(StandardFonts.CourierBold);

      for (let i = 0; i < pages.length; i++) {
        const pageMeta = pages[i];
        setExportProgressText(`Processing page ${i + 1} of ${pages.length}...`);

        let outPage: any;

        if (pageMeta.originalPageIndex >= 0) {
          const [copied] = await outDoc.copyPages(loadedDoc, [pageMeta.originalPageIndex]);
          const currentRotation = copied.getRotation().angle;
          copied.setRotation(degrees((currentRotation + pageMeta.rotation) % 360));
          outPage = outDoc.addPage(copied);
        } else {
          outPage = outDoc.addPage([pageMeta.width, pageMeta.height]);
        }

        const { width: pWidth, height: pHeight } = outPage.getSize();

        // ── Step 3: Draw Modified Existing Text (100% Background-Free Native Text) ──
        const pageExisting = existingTexts.filter((t) => t.pageIndex === i && t.isModified);

        for (const ext of pageExisting) {
          // If deleted, we don't draw any replacement text (it has already been expunged from the stream)
          if (ext.isDeleted || !ext.currentText.trim()) continue;

          // Note: NO outPage.drawRectangle! Preserves all underlying backgrounds, lines, watermarks, and graphics completely!
          const coverWidth = Math.max(ext.originalWidth, ext.width);

          // Select font
          let selectedFont = fontHelvetica;
          if (ext.fontFamily === "TimesRoman") {
            selectedFont = ext.bold ? fontTimesBold : ext.italic ? fontTimesItalic : fontTimes;
          } else if (ext.fontFamily === "Courier") {
            selectedFont = ext.bold ? fontCourierBold : fontCourier;
          } else {
            selectedFont =
              ext.bold && ext.italic
                ? fontHelveticaBoldOblique
                : ext.bold
                ? fontHelveticaBold
                : ext.italic
                ? fontHelveticaOblique
                : fontHelvetica;
          }

          const textColor = hexToRgb(ext.color || "#1E293B");

          // Draw the newly edited native text at the EXACT original baseline (ext.tx, ext.ty)!
          outPage.drawText(ext.currentText, {
            x: ext.tx,
            y: ext.ty, // Exact native PDF stream coordinates!
            size: ext.fontSize,
            font: selectedFont,
            color: rgb(textColor.r, textColor.g, textColor.b),
            rotate: ext.rotation ? degrees(ext.rotation) : undefined,
          });

          if (ext.underline) {
            outPage.drawLine({
              start: { x: ext.tx, y: ext.ty - 2 },
              end: { x: ext.tx + coverWidth, y: ext.ty - 2 },
              color: rgb(textColor.r, textColor.g, textColor.b),
              thickness: 1,
            });
          }
        }

        // ── Step 4: Draw User Overlays & Annotations ──────────────────
        const pageAnnotations = annotations.filter((a) => a.pageIndex === i);

        for (const annot of pageAnnotations) {
          const pdfY = pHeight - annot.y - annot.height;

          if (annot.type === "text" && annot.text) {
            const rgbColor = hexToRgb(annot.color || "#000000");
            let selectedFont = fontHelvetica;
            if (annot.fontFamily === "TimesRoman") {
              selectedFont = annot.bold ? fontTimesBold : annot.italic ? fontTimesItalic : fontTimes;
            } else if (annot.fontFamily === "Courier") {
              selectedFont = annot.bold ? fontCourierBold : fontCourier;
            } else {
              selectedFont =
                annot.bold && annot.italic
                  ? fontHelveticaBoldOblique
                  : annot.bold
                  ? fontHelveticaBold
                  : annot.italic
                  ? fontHelveticaOblique
                  : fontHelvetica;
            }

            let textX = annot.x;
            if (annot.align === "center" || annot.align === "right") {
              const measuredW = calculateTextWidth(
                annot.text,
                annot.fontSize || 16,
                annot.fontFamily || "Helvetica",
                annot.bold,
                annot.italic
              );
              if (annot.align === "center") {
                textX = annot.x + Math.max(0, (annot.width - measuredW) / 2);
              } else if (annot.align === "right") {
                textX = annot.x + Math.max(0, annot.width - measuredW);
              }
            }

            outPage.drawText(annot.text, {
              x: textX,
              y: pdfY + (annot.height - (annot.fontSize || 16)),
              size: annot.fontSize || 16,
              font: selectedFont,
              color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
            });
          } else if (annot.type === "rectangle") {
            const strokeRgb = hexToRgb(annot.strokeColor || "#000000");
            const hasFill = annot.fillColor && annot.fillColor !== "transparent";
            const fillRgb = hasFill ? hexToRgb(annot.fillColor!) : null;
            outPage.drawRectangle({
              x: annot.x,
              y: pdfY,
              width: annot.width,
              height: annot.height,
              borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              borderWidth: annot.strokeWidth || 2,
              color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            });
          } else if (annot.type === "circle") {
            const strokeRgb = hexToRgb(annot.strokeColor || "#000000");
            const hasFill = annot.fillColor && annot.fillColor !== "transparent";
            const fillRgb = hasFill ? hexToRgb(annot.fillColor!) : null;
            outPage.drawEllipse({
              x: annot.x + annot.width / 2,
              y: pdfY + annot.height / 2,
              xScale: annot.width / 2,
              yScale: annot.height / 2,
              borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              borderWidth: annot.strokeWidth || 2,
              color: fillRgb ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            });
          } else if (annot.type === "line" || annot.type === "arrow") {
            const strokeRgb = hexToRgb(annot.strokeColor || "#000000");
            outPage.drawLine({
              start: { x: annot.x, y: pdfY + annot.height / 2 },
              end: { x: annot.x + annot.width, y: pdfY + annot.height / 2 },
              color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              thickness: annot.strokeWidth || 3,
            });
          } else if (annot.type === "image" || annot.type === "signature") {
            if (annot.dataUrl) {
              const base64Data = annot.dataUrl.split(",")[1];
              const binary = atob(base64Data);
              const bytes = new Uint8Array(binary.length);
              for (let b = 0; b < binary.length; b++) {
                bytes[b] = binary.charCodeAt(b);
              }

              let embeddedImg: any;
              if (annot.dataUrl.startsWith("data:image/jpeg") || annot.dataUrl.startsWith("data:image/jpg")) {
                embeddedImg = await outDoc.embedJpg(bytes);
              } else {
                embeddedImg = await outDoc.embedPng(bytes);
              }

              outPage.drawImage(embeddedImg, {
                x: annot.x,
                y: pdfY,
                width: annot.width,
                height: annot.height,
              });
            }
          } else if (annot.type === "draw" || annot.type === "highlight") {
            const offscreen = document.createElement("canvas");
            offscreen.width = Math.max(annot.width, 10);
            offscreen.height = Math.max(annot.height, 10);
            const ctx = offscreen.getContext("2d");
            if (ctx && annot.points && annot.points.length > 0) {
              ctx.beginPath();
              ctx.moveTo(annot.points[0].x, annot.points[0].y);
              for (let p = 1; p < annot.points.length; p++) {
                ctx.lineTo(annot.points[p].x, annot.points[p].y);
              }
              const isHl = annot.type === "highlight";
              if (isHl) {
                if (annot.strokeColor && annot.strokeColor.startsWith("#")) {
                  const hc = hexToRgb(annot.strokeColor);
                  ctx.strokeStyle = `rgba(${hc.r * 255}, ${hc.g * 255}, ${hc.b * 255}, 0.5)`;
                } else {
                  ctx.strokeStyle = "rgba(254, 240, 138, 0.5)";
                }
              } else {
                ctx.strokeStyle = annot.strokeColor || "#000";
              }
              ctx.lineWidth = annot.strokeWidth || (isHl ? 18 : 3);
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.stroke();

              const pngUrl = offscreen.toDataURL("image/png");
              const base64Data = pngUrl.split(",")[1];
              const binary = atob(base64Data);
              const bytes = new Uint8Array(binary.length);
              for (let b = 0; b < binary.length; b++) {
                bytes[b] = binary.charCodeAt(b);
              }
              const embeddedDraw = await outDoc.embedPng(bytes);
              outPage.drawImage(embeddedDraw, {
                x: annot.x,
                y: pdfY,
                width: annot.width,
                height: annot.height,
                opacity: isHl ? 0.6 : 1.0,
              });
            }
          }
        }
      }

      setExportProgressText("Finalizing PDF bytes...");
      const outBytes = await outDoc.save();

      const blob = new Blob([outBytes as any], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName = (file?.name || "document").replace(/\.[^/.]+$/, "");
      a.href = downloadUrl;
      a.download = `${baseName}-edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      notify.success(`Downloaded "${baseName}-edited.pdf" with text changes!`);
    } catch (err: any) {
      console.error("PDF export failed:", err);
      notify.error("Failed to export PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  // Selected existing text helper
  const selectedExistingText = existingTexts.find((t) => t.id === selectedExistingTextId);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  // ── Render Upload View ───────────────────────────────────────────
  if (!file) {
    return (
      <div className={styles.uploadContainer}>
        <div
          className={`${styles.dropZone} ${isDraggingOver ? styles.dropZoneActive : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.getElementById("pdfFileInput") as HTMLInputElement;
            input?.click();
          }}
        >
          <div className={styles.dropIcon}>
            <UploadIcon />
          </div>

          <div>
            <h2 className={styles.dropTitle}>Select PDF document</h2>
            <p className={styles.dropSubtitle}>or drag and drop your PDF here to edit</p>
          </div>

          <button type="button" className={styles.browseBtn}>
            Choose PDF File
          </button>

          <input
            id="pdfFileInput"
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                loadPdfFile(e.target.files[0]);
              }
            }}
          />
        </div>

        {isLoading && (
          <div className={styles.loadingBar}>
            <div className={styles.loadingBarFill} style={{ width: "100%" }} />
          </div>
        )}

        {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

        <div className={styles.privacyBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          100% In-Browser Privacy — Your documents are never uploaded to any server.
        </div>
      </div>
    );
  }

  // ── Render Workspace ─────────────────────────────────────────────
  return (
    <div className={styles.workspace}>
      {/* ── Top Toolbar ──────────────────────────────────────────── */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Link
            href="/tools"
            className={styles.toolBtn}
            title="Back to tools"
            onClick={(e) => {
              if (
                (annotations.length > 0 || existingTexts.some((t) => t.isModified)) &&
                !window.confirm("Leave PDF editor? Unsaved edits will be lost.")
              ) {
                e.preventDefault();
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>

          <span className={styles.toolbarFileName} title={file.name}>
            {file.name}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            ({pages.length} {pages.length === 1 ? "page" : "pages"}, {formatBytes(file.size)})
          </span>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Undo / Redo */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <RedoIcon />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Zoom Controls */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            title="Zoom Out"
          >
            <ZoomOutIcon />
          </button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
            title="Zoom In"
          >
            <ZoomInIcon />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => {
              if (canvasAreaRef.current && pages[0]) {
                const availableWidth = canvasAreaRef.current.clientWidth - 48;
                const fitScale = Number((availableWidth / pages[0].width).toFixed(2));
                setZoom(Math.max(0.4, Math.min(2.0, fitScale)));
              }
            }}
            title="Fit to Width"
          >
            <FitWidthIcon />
          </button>
        </div>

        <div className={styles.toolbarSpacer} />

        {/* Change file / Download */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={() => {
              if (window.confirm("Open another PDF? Current edits will be discarded.")) {
                setFile(null);
                setPdfBytes(null);
                setPdfDocProxy(null);
                setPages([]);
                setAnnotations([]);
                setExistingTexts([]);
              }
            }}
            title="Open different PDF file"
          >
            Replace File
          </button>

          <button
            type="button"
            className={styles.downloadBtn}
            onClick={exportEditedPdf}
            disabled={isExporting}
          >
            <DownloadIcon />
            {isExporting ? "Exporting..." : "Download Edited PDF"}
          </button>
        </div>
      </header>

      {/* ── Main Editor Body ─────────────────────────────────────── */}
      <div className={styles.editorBody}>
        {/* Left Sidebar: Page Thumbnails */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Pages ({pages.length})</span>
            <div className={styles.sidebarActions}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={addBlankPage}
                title="Add blank page"
                style={{ padding: "3px 6px" }}
              >
                <PlusIcon size={14} /> Add
              </button>
            </div>
          </div>

          <div className={styles.sidebarScroll}>
            {pages.map((p, idx) => (
              <div
                key={`thumb_${idx}_${p.originalPageIndex}_${p.rotation}`}
                className={`${styles.thumbWrap} ${currentPage === idx ? styles.thumbActive : ""}`}
                style={{ aspectRatio: `${p.width} / ${p.height}`, minHeight: "90px" }}
                onClick={() => {
                  setCurrentPage(idx);
                  const targetEl = document.getElementById(`page_container_${idx}`);
                  targetEl?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {thumbnailCache[idx] ? (
                  <img
                    src={thumbnailCache[idx]}
                    className={styles.thumbImage}
                    alt={`Page ${idx + 1}`}
                  />
                ) : thumbnailStatus[idx] === "error" ? (
                  <div
                    className={styles.thumbError}
                    onClick={(e) => {
                      e.stopPropagation();
                      retryThumbnail(idx);
                    }}
                    title="Click to retry thumbnail"
                  >
                    <RotateCwIcon size={14} />
                    <span>Retry</span>
                  </div>
                ) : (
                  <div className={styles.thumbSkeleton}>
                    <div className={styles.thumbSkeletonIcon}>📄</div>
                    <div className={styles.thumbSpinner} />
                  </div>
                )}
                <span className={styles.thumbNumber}>{idx + 1}</span>

                <div className={styles.thumbActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.thumbActionBtn}
                    onClick={() => movePage(idx, "up")}
                    disabled={idx === 0}
                    title="Move page up"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    className={styles.thumbActionBtn}
                    onClick={() => movePage(idx, "down")}
                    disabled={idx === pages.length - 1}
                    title="Move page down"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    type="button"
                    className={styles.thumbActionBtn}
                    onClick={() => duplicatePage(idx)}
                    title="Duplicate page"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    type="button"
                    className={styles.thumbActionBtn}
                    onClick={() => rotatePage(idx)}
                    title="Rotate 90°"
                  >
                    <RotateCwIcon size={12} />
                  </button>
                  <button
                    type="button"
                    className={styles.thumbActionBtn}
                    onClick={() => deletePage(idx)}
                    title="Delete page"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Canvas Area: Document Pages */}
        <main ref={canvasAreaRef} className={styles.canvasArea}>
          {pages.map((p, idx) => {
            const pageAnnotations = annotations.filter((a) => a.pageIndex === idx);
            const pageExisting = existingTexts.filter((t) => t.pageIndex === idx);
            const isScanned = scannedPages[idx] === true;
            const w = p.width * zoom;
            const h = p.height * zoom;

            return (
              <React.Fragment key={`page_wrapper_${idx}`}>
                {/* Scanned PDF Notification Banner */}
                {isScanned && (
                  <div className={styles.ocrBanner} style={{ width: `${w}px` }}>
                    <span>
                      📄 Scanned / Image-based Page Detected — Select OCR to make visible text editable.
                    </span>
                    <button
                      type="button"
                      className={styles.ocrBtn}
                      onClick={() => runOcrOnPage(idx)}
                      disabled={isOcrRunning}
                    >
                      {isOcrRunning ? ocrProgressText || "Recognizing..." : "Recognize Text (OCR)"}
                    </button>
                  </div>
                )}

                <div
                  id={`page_container_${idx}`}
                  className={styles.pageContainer}
                  style={{ width: `${w}px`, height: `${h}px` }}
                  onClick={(e) => handlePageClick(idx, e)}
                >
                  {/* PDF Content Canvas */}
                  <canvas
                    ref={(el) => {
                      pageCanvasRefs.current[idx] = el;
                    }}
                    className={styles.pageCanvas}
                  />

                  {/* ── Existing PDF Text Editing Layer (100% Background-Free Native Editing) ── */}
                  {(activeTool === "editText" || pageExisting.some((t) => t.isModified)) && (
                    <div className={styles.textDetectionLayer}>
                      {/* SVG Alphabetic Baseline Layer for Modified Text (Locks to Exact Original Baseline) */}
                      <svg
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                          overflow: "visible",
                          zIndex: 14,
                        }}
                      >
                        {pageExisting
                          .filter((t) => t.isModified && !t.isDeleted && selectedExistingTextId !== t.id)
                          .map((item) => {
                            const bx = (item.baselineX ?? item.x) * zoom;
                            const by = (item.baselineY ?? (item.y + item.fontSize * 0.82)) * zoom;
                            let fam = "Helvetica, Arial, sans-serif";
                            if (item.fontFamily === "TimesRoman") fam = "'Times New Roman', Times, serif";
                            else if (item.fontFamily === "Courier") fam = "'Courier New', Courier, monospace";

                            return (
                              <text
                                key={`svg_mod_${item.id}`}
                                x={bx}
                                y={by}
                                fontSize={`${item.fontSize * zoom}px`}
                                fontFamily={fam}
                                fill={item.color || "#1E293B"}
                                fontWeight={item.bold ? "bold" : "normal"}
                                fontStyle={item.italic ? "italic" : "normal"}
                                textDecoration={item.underline ? "underline" : "none"}
                                dominantBaseline="alphabetic"
                              >
                                {item.currentText}
                              </text>
                            );
                          })}
                      </svg>

                      {pageExisting.map((item) => {
                        const isSelected = selectedExistingTextId === item.id;
                        const vx = item.x * zoom;
                        const vy = item.y * zoom;
                        // Dynamic width: auto-expands to accommodate longer text
                        const dynamicWidth = Math.max(item.originalWidth, item.width);
                        const vw = dynamicWidth * zoom;
                        const vh = item.height * zoom;

                        if (item.isDeleted) {
                          return null;
                        }

                        if (isSelected) {
                          const baseBy = (item.baselineY ?? (item.y + item.fontSize * 0.82)) * zoom;
                          const inputH = Math.max(16, item.fontSize * zoom * 1.15);
                          const inputTop = Math.max(0, baseBy - item.fontSize * zoom * 0.78);

                          return (
                            <div
                              key={item.id}
                              className={`${styles.existingTextItem} ${styles.existingTextSelected}`}
                              style={{
                                left: `${vx}px`,
                                top: `${inputTop}px`,
                                width: `${vw}px`,
                                height: `${inputH}px`,
                                backgroundColor: item.isModified ? "transparent" : (item.bgColor || "#FFFFFF"),
                                boxShadow: "none",
                                zIndex: 25,
                              }}
                            >
                              <input
                                type="text"
                                className={styles.inlineTextEditor}
                                value={item.currentText}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  fontSize: `${item.fontSize * zoom}px`,
                                  fontFamily: item.fontFamily,
                                  color: item.color,
                                  fontWeight: item.bold ? "bold" : "normal",
                                  fontStyle: item.italic ? "italic" : "normal",
                                  textDecoration: item.underline ? "underline" : "none",
                                  textAlign: item.align,
                                  background: item.isModified ? "transparent" : (item.bgColor || "#FFFFFF"),
                                  outline: "none",
                                  border: "none",
                                  padding: "0 2px",
                                  margin: "0",
                                  boxShadow: "none",
                                  lineHeight: 1,
                                }}
                                onChange={(e) => updateExistingText(item.id, e.target.value)}
                                onBlur={(e) => {
                                  const related = e.relatedTarget as HTMLElement | null;
                                  if (
                                    related &&
                                    (related.closest(`.${styles.propsSection}`) ||
                                      related.closest(`.${styles.toolbar}`) ||
                                      related.closest(`.${styles.toolbox}`))
                                  ) {
                                    return;
                                  }
                                  if (item.currentText !== item.originalText) {
                                    applyExistingTextEdit(item.id, false);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    applyExistingTextEdit(item.id, true);
                                  } else if (e.key === "Escape") {
                                    cancelExistingTextEdit(item.id);
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          );
                        }

                        const isEditable = activeTool === "editText";

                        return (
                          <div
                            key={item.id}
                            className={`${styles.existingTextItem} ${isEditable ? styles.existingTextItemEditable : ""} ${item.isModified ? styles.existingTextModified : ""}`}
                            style={{
                              left: `${vx}px`,
                              top: `${vy}px`,
                              width: `${vw}px`,
                              height: `${vh}px`,
                              backgroundColor: "transparent",
                              boxShadow: "none",
                              border: "none",
                            }}
                            onClick={(e) => {
                              if (!isEditable) return;
                              e.stopPropagation();
                              setSelectedExistingTextId(item.id);
                              setSelectedId(null);
                            }}
                            title={
                              isEditable
                                ? item.isModified
                                  ? `Modified: "${item.currentText}" (click to edit)`
                                  : `Original: "${item.originalText}" (click to edit)`
                                : undefined
                            }
                          >
                            <div style={{ width: "100%", height: "100%" }} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Freehand Draw Overlay Canvas */}
                  {(activeTool === "draw" || activeTool === "highlight") && (
                    <canvas
                      ref={(el) => {
                        drawCanvasRefs.current[idx] = el;
                      }}
                      className={styles.drawCanvas}
                      width={w}
                      height={h}
                      onPointerDown={(e) => startDrawing(idx, e)}
                      onPointerMove={(e) => drawMove(idx, e)}
                      onPointerUp={(e) => stopDrawing(idx, e)}
                      onPointerCancel={(e) => stopDrawing(idx, e)}
                    />
                  )}

                  {/* Annotation Layer */}
                  <div
                    className={`${styles.annotationLayer} ${
                      activeTool === "text" ? styles.annotationLayerText : ""
                    }`}
                  >
                    {pageAnnotations.map((annot) => {
                      const isSelected = selectedId === annot.id;
                      const isEditing = editingTextId === annot.id;
                      const annotX = annot.x * zoom;
                      const annotY = annot.y * zoom;
                      const annotW = annot.width * zoom;
                      const annotH = annot.height * zoom;

                      return (
                        <div
                          key={annot.id}
                          className={`${styles.annotationItem} ${isSelected ? styles.annotationSelected : ""} ${
                            activeTool === "select" ? styles.annotationItemInteractive : styles.annotationItemDisabled
                          }`}
                          style={{
                            left: `${annotX}px`,
                            top: `${annotY}px`,
                            width: `${annotW}px`,
                            height: `${annotH}px`,
                          }}
                          onMouseDown={(e) => {
                            if (activeTool === "select") {
                              handleObjectMouseDown(annot.id, e);
                            }
                          }}
                          onDoubleClick={() => {
                            if (annot.type === "text" || annot.type === "comment") {
                              setEditingTextId(annot.id);
                            }
                          }}
                        >
                          {/* Text Annotation */}
                          {annot.type === "text" && (
                            <div
                              id={`annot-text-${annot.id}`}
                              contentEditable={isEditing}
                              suppressContentEditableWarning
                              className={`${styles.textAnnotation} ${isEditing ? styles.textAnnotationEditing : ""}`}
                              style={{
                                fontSize: `${(annot.fontSize || 16) * zoom}px`,
                                color: annot.color || "#000",
                                fontWeight: annot.bold ? "bold" : "normal",
                                fontStyle: annot.italic ? "italic" : "normal",
                                textAlign: annot.align || "left",
                                fontFamily: annot.fontFamily || "Helvetica, sans-serif",
                                width: "100%",
                                height: "100%",
                              }}
                              onBlur={(e) => {
                                const newText = e.currentTarget.innerText;
                                setAnnotations((prev) =>
                                  prev.map((a) => (a.id === annot.id ? { ...a, text: newText } : a))
                                );
                                setEditingTextId(null);
                                pushHistory(annotations, pages, existingTexts);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  setEditingTextId(null);
                                }
                              }}
                            >
                              {annot.text}
                            </div>
                          )}

                          {/* Shape Annotations */}
                          {annot.type === "rectangle" && (
                            <div
                              className={styles.shapeAnnotation}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderColor: annot.strokeColor || "#000",
                                borderWidth: `${(annot.strokeWidth || 2) * zoom}px`,
                                background: annot.fillColor || "transparent",
                              }}
                            />
                          )}

                          {annot.type === "circle" && (
                            <div
                              className={styles.shapeAnnotation}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                borderColor: annot.strokeColor || "#000",
                                borderWidth: `${(annot.strokeWidth || 2) * zoom}px`,
                                background: annot.fillColor || "transparent",
                              }}
                            />
                          )}

                          {(annot.type === "line" || annot.type === "arrow") && (
                            <div
                              style={{
                                width: "100%",
                                height: `${Math.max(2, (annot.strokeWidth || 3) * zoom)}px`,
                                background: annot.strokeColor || "#000",
                                marginTop: `${annotH / 2 - 1}px`,
                              }}
                            />
                          )}

                          {/* Image & Signature Annotations */}
                          {(annot.type === "image" || annot.type === "signature") && annot.dataUrl && (
                            <div className={styles.imageAnnotation} style={{ width: "100%", height: "100%" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={annot.dataUrl} alt="Inserted object" draggable={false} />
                            </div>
                          )}

                          {/* Freehand Draw & Highlight */}
                          {(annot.type === "draw" || annot.type === "highlight") && annot.points && (
                            <svg
                              width="100%"
                              height="100%"
                              style={{
                                overflow: "visible",
                                opacity: annot.type === "highlight" ? 0.45 : 1,
                                mixBlendMode: annot.type === "highlight" ? "multiply" : "normal",
                              }}
                            >
                              <polyline
                                points={annot.points
                                  .map((p) => `${p.x * zoom},${p.y * zoom}`)
                                  .join(" ")}
                                fill="none"
                                stroke={annot.strokeColor || (annot.type === "highlight" ? "#FEF08A" : "#000")}
                                strokeWidth={(annot.strokeWidth || (annot.type === "highlight" ? 18 : 3)) * zoom}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}

                          {/* Comment sticky note */}
                          {annot.type === "comment" && (
                            <div
                              contentEditable={isEditing}
                              suppressContentEditableWarning
                              style={{
                                width: "100%",
                                height: "100%",
                                background: annot.fillColor || "#FEF3C7",
                                border: `1px solid ${annot.strokeColor || "#F59E0B"}`,
                                borderRadius: "6px",
                                padding: "6px",
                                fontSize: "11px",
                                color: "#1E293B",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                              }}
                              onBlur={(e) => {
                                const newText = e.currentTarget.innerText;
                                setAnnotations((prev) =>
                                  prev.map((a) => (a.id === annot.id ? { ...a, text: newText } : a))
                                );
                                setEditingTextId(null);
                                pushHistory(annotations, pages, existingTexts);
                              }}
                            >
                              {annot.text}
                            </div>
                          )}

                          {/* 4 Corner Resize Handles */}
                          {isSelected && activeTool === "select" && (
                            <>
                              <div
                                className={`${styles.resizeHandle} ${styles.resizeHandleNw}`}
                                onMouseDown={(e) => handleObjectMouseDown(annot.id, e, "nw")}
                              />
                              <div
                                className={`${styles.resizeHandle} ${styles.resizeHandleNe}`}
                                onMouseDown={(e) => handleObjectMouseDown(annot.id, e, "ne")}
                              />
                              <div
                                className={`${styles.resizeHandle} ${styles.resizeHandleSe}`}
                                onMouseDown={(e) => handleObjectMouseDown(annot.id, e, "se")}
                              />
                              <div
                                className={`${styles.resizeHandle} ${styles.resizeHandleSw}`}
                                onMouseDown={(e) => handleObjectMouseDown(annot.id, e, "sw")}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.pageLabel}>Page {idx + 1}</div>
              </React.Fragment>
            );
          })}
        </main>

        {/* Right Sidebar: Tool Palette & Object Properties */}
        <aside className={styles.rightPanel}>
          <div className={styles.rightPanelHeader}>Editing Tools</div>

          <div className={styles.rightPanelScroll}>
            {/* Tool Palette */}
            <div className={styles.toolPalette}>
              {/* Select / Move */}
              <button
                type="button"
                className={`${styles.paletteBtn} ${activeTool === "select" ? styles.paletteBtnActive : ""}`}
                onClick={() => {
                  setActiveTool("select");
                  setSelectedExistingTextId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 7 18 3-7 7-3L3 3z" />
                  <path d="m13 13 6 6" />
                </svg>
                Select / Move
              </button>

              {/* Edit Existing Text */}
              <button
                type="button"
                className={`${styles.paletteBtn} ${activeTool === "editText" ? styles.paletteBtnActive : ""}`}
                onClick={() => {
                  setActiveTool("editText");
                  setSelectedId(null);
                  notify.info("Click any original text on the document to edit or replace it.");
                }}
              >
                <EditExistingTextIcon />
                Edit Existing Text
              </button>

              {/* Add Text */}
              <button
                type="button"
                className={`${styles.paletteBtn} ${activeTool === "text" ? styles.paletteBtnActive : ""}`}
                onClick={() => {
                  setActiveTool("text");
                  setSelectedExistingTextId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                Add Text
              </button>

              {/* Draw */}
              <button
                type="button"
                className={`${styles.paletteBtn} ${activeTool === "draw" ? styles.paletteBtnActive : ""}`}
                onClick={() => {
                  setActiveTool("draw");
                  setSelectedExistingTextId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                </svg>
                Draw
              </button>

              {/* Highlight */}
              <button
                type="button"
                className={`${styles.paletteBtn} ${activeTool === "highlight" ? styles.paletteBtnActive : ""}`}
                onClick={() => {
                  setActiveTool("highlight");
                  setSelectedExistingTextId(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 11-6 6v3h3l6-6" />
                  <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
                </svg>
                Highlight
              </button>

              {/* Add Image */}
              <button
                type="button"
                className={styles.paletteBtn}
                onClick={() => {
                  const input = document.getElementById("imgUploadInput") as HTMLInputElement;
                  input?.click();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Add Image
              </button>
              <input
                id="imgUploadInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />

              {/* Signature */}
              <button
                type="button"
                className={styles.paletteBtn}
                onClick={() => setIsSigModalOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 11.5V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
                  <path d="M14 2 22 10" />
                  <path d="M22 2 14 10" />
                </svg>
                Signature
              </button>
            </div>

            {/* Quick Shape Buttons */}
            <div className={styles.propsSection}>
              <div className={styles.propsTitle}>Insert Shapes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => insertShape("rectangle")}
                >
                  Rectangle
                </button>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => insertShape("circle")}
                >
                  Circle
                </button>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => insertShape("line")}
                >
                  Line
                </button>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => insertShape("arrow")}
                >
                  Arrow
                </button>
              </div>
            </div>

            {/* ── Properties for Selected Existing PDF Text ────────── */}
            {selectedExistingText ? (
              <div className={styles.propsSection}>
                <div className={styles.propsTitle}>Edit Original PDF Text</div>

                {/* Engine Mode Badge */}
                {selectedExistingText.source === "ocr" ? (
                  <div className={styles.statusBadgeVisual}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Visual Replace (OCR Recognized)
                  </div>
                ) : selectedExistingText.canNativeEdit ? (
                  <div className={styles.statusBadgeNative}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Native Content Stream Edit Verified
                  </div>
                ) : (
                  <div className={styles.statusBadgeVisual}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Visual Replace Mode (Subset Font / Overlay)
                  </div>
                )}

                {/* Overlap & Intelligent Auto-Fit Warning */}
                {selectedExistingText.width > getLineAvailableSpace(selectedExistingText) && (
                  <div className={styles.overlapAlert}>
                    <span>⚠️ Replacement text is longer than available line space.</span>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      style={{ marginTop: "4px", alignSelf: "flex-start" }}
                      onClick={() => autoFitFontSize(selectedExistingText.id)}
                    >
                      Auto-fit Font Size
                    </button>
                  </div>
                )}

                {/* Text Content Field */}
                <div style={{ marginBottom: "10px" }}>
                  <span className={styles.propsLabel}>Text Content:</span>
                  <textarea
                    rows={2}
                    className={styles.propsInput}
                    style={{ width: "100%", marginTop: "4px", resize: "vertical" }}
                    value={selectedExistingText.currentText}
                    onChange={(e) => updateExistingText(selectedExistingText.id, e.target.value)}
                  />
                </div>

                {/* Font Family */}
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Font:</span>
                  <select
                    className={styles.propsInput}
                    value={selectedExistingText.fontFamily}
                    onChange={(e) => {
                      const fam = e.target.value as "Helvetica" | "TimesRoman" | "Courier";
                      setExistingTexts((prev) =>
                        prev.map((t) => {
                          if (t.id !== selectedExistingText.id) return t;
                          const newWidth = calculateTextWidth(t.currentText, t.fontSize, fam, t.bold, t.italic);
                          return { ...t, fontFamily: fam, width: Math.max(t.originalWidth, newWidth), isModified: true };
                        })
                      );
                    }}
                  >
                    <option value="Helvetica">Helvetica (Sans)</option>
                    <option value="TimesRoman">Times New Roman</option>
                    <option value="Courier">Courier (Mono)</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Size:</span>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    className={styles.propsInput}
                    value={selectedExistingText.fontSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value, 10) || 14;
                      setExistingTexts((prev) =>
                        prev.map((t) => {
                          if (t.id !== selectedExistingText.id) return t;
                          const newWidth = calculateTextWidth(t.currentText, size, t.fontFamily, t.bold, t.italic);
                          return { ...t, fontSize: size, width: Math.max(t.originalWidth, newWidth), isModified: true };
                        })
                      );
                    }}
                  />
                </div>

                {/* Bold, Italic, Underline */}
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Style:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      className={`${styles.smallBtn} ${selectedExistingText.bold ? styles.smallBtnActive : ""}`}
                      onClick={() => {
                        const b = !selectedExistingText.bold;
                        setExistingTexts((prev) =>
                          prev.map((t) => {
                            if (t.id !== selectedExistingText.id) return t;
                            const newWidth = calculateTextWidth(t.currentText, t.fontSize, t.fontFamily, b, t.italic);
                            return { ...t, bold: b, width: Math.max(t.originalWidth, newWidth), isModified: true };
                          })
                        );
                      }}
                      style={{ fontWeight: "bold" }}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className={`${styles.smallBtn} ${selectedExistingText.italic ? styles.smallBtnActive : ""}`}
                      onClick={() => {
                        const it = !selectedExistingText.italic;
                        setExistingTexts((prev) =>
                          prev.map((t) => {
                            if (t.id !== selectedExistingText.id) return t;
                            const newWidth = calculateTextWidth(t.currentText, t.fontSize, t.fontFamily, t.bold, it);
                            return { ...t, italic: it, width: Math.max(t.originalWidth, newWidth), isModified: true };
                          })
                        );
                      }}
                      style={{ fontStyle: "italic" }}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className={`${styles.smallBtn} ${selectedExistingText.underline ? styles.smallBtnActive : ""}`}
                      onClick={() => {
                        const un = !selectedExistingText.underline;
                        setExistingTexts((prev) =>
                          prev.map((t) => (t.id === selectedExistingText.id ? { ...t, underline: un, isModified: true } : t))
                        );
                      }}
                      style={{ textDecoration: "underline" }}
                    >
                      U
                    </button>
                  </div>
                </div>

                {/* Color */}
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Color:</span>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={selectedExistingText.color}
                    onChange={(e) => {
                      const color = e.target.value;
                      setExistingTexts((prev) =>
                        prev.map((t) => (t.id === selectedExistingText.id ? { ...t, color, isModified: true } : t))
                      );
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {selectedExistingText.color}
                  </span>
                </div>

                {/* Alignment */}
                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Align:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(["left", "center", "right"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        className={`${styles.smallBtn} ${selectedExistingText.align === pos ? styles.smallBtnActive : ""}`}
                        onClick={() => {
                          setExistingTexts((prev) =>
                            prev.map((t) => (t.id === selectedExistingText.id ? { ...t, align: pos, isModified: true } : t))
                          );
                        }}
                      >
                        {pos.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Apply, Cancel, Delete, Restore */}
                <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                  <button
                    type="button"
                    className={styles.browseBtn}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem" }}
                    onClick={() => applyExistingTextEdit(selectedExistingText.id)}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => cancelExistingTextEdit(selectedExistingText.id)}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    style={{ flex: 1, marginTop: 0 }}
                    onClick={() => deleteExistingText(selectedExistingText.id)}
                  >
                    <TrashIcon size={14} /> Delete Text
                  </button>
                  {selectedExistingText.isModified && (
                    <button
                      type="button"
                      className={styles.smallBtn}
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => restoreExistingText(selectedExistingText.id)}
                      title="Reset back to original PDF text"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ) : selectedAnnotation ? (
              /* ── Properties for User Inserted Overlay Object ──────── */
              <div className={styles.propsSection}>
                <div className={styles.propsTitle}>Object Properties</div>

                <div className={styles.propsRow}>
                  <span className={styles.propsLabel}>Color:</span>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={selectedAnnotation.color || selectedAnnotation.strokeColor || currentColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setCurrentColor(color);
                      setAnnotations((prev) =>
                        prev.map((a) =>
                          a.id === selectedAnnotation.id
                            ? { ...a, color, strokeColor: color }
                            : a
                        )
                      );
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {selectedAnnotation.color || selectedAnnotation.strokeColor || currentColor}
                  </span>
                </div>

                {selectedAnnotation.type === "text" && (
                  <>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Font:</span>
                      <select
                        className={styles.propsInput}
                        value={selectedAnnotation.fontFamily || "Helvetica"}
                        onChange={(e) => {
                          const fam = e.target.value as "Helvetica" | "TimesRoman" | "Courier";
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedAnnotation.id ? { ...a, fontFamily: fam } : a
                            )
                          );
                        }}
                      >
                        <option value="Helvetica">Helvetica (Sans)</option>
                        <option value="TimesRoman">Times New Roman</option>
                        <option value="Courier">Courier (Mono)</option>
                      </select>
                    </div>

                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Size:</span>
                      <input
                        type="number"
                        min="8"
                        max="72"
                        className={styles.propsInput}
                        value={selectedAnnotation.fontSize || 16}
                        onChange={(e) => {
                          const size = parseInt(e.target.value, 10) || 16;
                          setCurrentFontSize(size);
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedAnnotation.id ? { ...a, fontSize: size } : a
                            )
                          );
                        }}
                      />
                    </div>

                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Style:</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          className={`${styles.smallBtn} ${selectedAnnotation.bold ? styles.smallBtnActive : ""}`}
                          onClick={() => {
                            const b = !selectedAnnotation.bold;
                            setIsBold(b);
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a.id === selectedAnnotation.id ? { ...a, bold: b } : a
                              )
                            );
                          }}
                          style={{ fontWeight: "bold" }}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className={`${styles.smallBtn} ${selectedAnnotation.italic ? styles.smallBtnActive : ""}`}
                          onClick={() => {
                            const it = !selectedAnnotation.italic;
                            setIsItalic(it);
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a.id === selectedAnnotation.id ? { ...a, italic: it } : a
                              )
                            );
                          }}
                          style={{ fontStyle: "italic" }}
                        >
                          I
                        </button>
                      </div>
                    </div>

                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Align:</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {(["left", "center", "right"] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            className={`${styles.smallBtn} ${selectedAnnotation.align === pos ? styles.smallBtnActive : ""}`}
                            onClick={() => {
                              setTextAlign(pos);
                              setAnnotations((prev) =>
                                prev.map((a) =>
                                  a.id === selectedAnnotation.id ? { ...a, align: pos } : a
                                )
                              );
                            }}
                          >
                            {pos.charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(selectedAnnotation.type === "rectangle" || selectedAnnotation.type === "circle") && (
                  <div className={styles.propsRow}>
                    <span className={styles.propsLabel}>Fill:</span>
                    <select
                      className={styles.propsInput}
                      value={selectedAnnotation.fillColor || "transparent"}
                      onChange={(e) => {
                        const fill = e.target.value;
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedAnnotation.id ? { ...a, fillColor: fill } : a
                          )
                        );
                      }}
                    >
                      <option value="transparent">Transparent (None)</option>
                      <option value="#FFFFFF">White</option>
                      <option value="#F1F5F9">Light Gray</option>
                      <option value="#FEF08A">Light Yellow</option>
                      <option value="#FEE2E2">Light Red</option>
                      <option value="#DBEAFE">Light Blue</option>
                    </select>
                  </div>
                )}

                {(selectedAnnotation.type === "rectangle" ||
                  selectedAnnotation.type === "circle" ||
                  selectedAnnotation.type === "line" ||
                  selectedAnnotation.type === "arrow" ||
                  selectedAnnotation.type === "draw" ||
                  selectedAnnotation.type === "highlight") && (
                  <div className={styles.propsRow}>
                    <span className={styles.propsLabel}>Width:</span>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      className={styles.propsInput}
                      value={
                        selectedAnnotation.strokeWidth ||
                        (selectedAnnotation.type === "highlight" ? 18 : 3)
                      }
                      onChange={(e) => {
                        const w = parseInt(e.target.value, 10) || 3;
                        setCurrentStrokeWidth(w);
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedAnnotation.id ? { ...a, strokeWidth: w } : a
                          )
                        );
                      }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => {
                    const next = annotations.filter((a) => a.id !== selectedAnnotation.id);
                    setAnnotations(next);
                    pushHistory(next, pages, existingTexts);
                    setSelectedId(null);
                    notify.info("Object deleted");
                  }}
                >
                  <TrashIcon size={14} /> Delete Object
                </button>
              </div>
            ) : (
              <div className={styles.propsSection}>
                <div className={styles.propsTitle}>Tool Options</div>
                {activeTool === "draw" && (
                  <>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.4 }}>
                      Draw mode active. Click and drag across the page to sketch freehand.
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Color:</span>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                      />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{currentColor}</span>
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Width:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className={styles.propsInput}
                        value={currentStrokeWidth}
                        onChange={(e) => setCurrentStrokeWidth(parseInt(e.target.value, 10) || 3)}
                      />
                    </div>
                  </>
                )}
                {activeTool === "highlight" && (
                  <>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.4 }}>
                      Highlighter active. Click and drag across text to apply a translucent tint.
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Color:</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {[
                          { name: "Yellow", hex: "#FEF08A" },
                          { name: "Green", hex: "#BBF7D0" },
                          { name: "Blue", hex: "#BAE6FD" },
                          { name: "Pink", hex: "#FBCFE8" },
                          { name: "Orange", hex: "#FED7AA" },
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              backgroundColor: swatch.hex,
                              border: currentColor === swatch.hex ? "2px solid #2563EB" : "1px solid rgba(0,0,0,0.15)",
                              cursor: "pointer",
                            }}
                            onClick={() => setCurrentColor(swatch.hex)}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Width:</span>
                      <input
                        type="number"
                        min="8"
                        max="48"
                        className={styles.propsInput}
                        value={currentStrokeWidth >= 12 ? currentStrokeWidth : 18}
                        onChange={(e) => setCurrentStrokeWidth(parseInt(e.target.value, 10) || 18)}
                      />
                    </div>
                  </>
                )}
                {activeTool === "text" && (
                  <>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.4 }}>
                      Add Text active. Click anywhere on the document to place a text box.
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Color:</span>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                      />
                    </div>
                    <div className={styles.propsRow}>
                      <span className={styles.propsLabel}>Size:</span>
                      <input
                        type="number"
                        min="8"
                        max="72"
                        className={styles.propsInput}
                        value={currentFontSize}
                        onChange={(e) => setCurrentFontSize(parseInt(e.target.value, 10) || 16)}
                      />
                    </div>
                  </>
                )}
                {activeTool === "editText" && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Click on any text line in the PDF document to edit its wording, font, size, or color.
                  </div>
                )}
                {activeTool === "select" && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Select / Move active. Click any inserted object to move, resize, or delete it (or use Delete/Arrow keys).
                  </div>
                )}
                {activeTool !== "draw" && activeTool !== "highlight" && activeTool !== "text" && activeTool !== "editText" && activeTool !== "select" && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Select an object on the canvas or switch tools above.
                  </div>
                )}

                {/* Scanned document OCR panel (Optional action only) */}
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color, rgba(0,0,0,0.08))" }}>
                  <div className={styles.propsTitle}>Optional OCR for Scanned Pages</div>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <select
                      className={styles.propsInput}
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value as any)}
                      style={{ fontSize: "0.78rem" }}
                    >
                      <option value="eng">English</option>
                      <option value="ben">Bangla (বাংলা)</option>
                      <option value="eng+ben">English + Bangla</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className={styles.ocrBtn}
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => runOcrOnPage(currentPage)}
                    disabled={isOcrRunning}
                  >
                    {isOcrRunning ? ocrProgressText || "Recognizing..." : "Recognize Current Page (OCR)"}
                  </button>

                  {/* Dismissible single OCR error card (No duplicates!) */}
                  {ocrError && (
                    <div className={styles.ocrErrorCard}>
                      <span>{ocrError}</span>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => runOcrOnPage(currentPage)}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => setOcrError(null)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile Bottom Toolbar ─────────────────────────────────── */}
      <div className={styles.mobileToolbar}>
        <button
          type="button"
          className={`${styles.mobileToolBtn} ${activeTool === "select" ? styles.mobileToolBtnActive : ""}`}
          onClick={() => {
            setActiveTool("select");
            setSelectedExistingTextId(null);
          }}
        >
          Select
        </button>
        <button
          type="button"
          className={`${styles.mobileToolBtn} ${activeTool === "editText" ? styles.mobileToolBtnActive : ""}`}
          onClick={() => {
            setActiveTool("editText");
            setSelectedId(null);
          }}
        >
          Edit Text
        </button>
        <button
          type="button"
          className={`${styles.mobileToolBtn} ${activeTool === "text" ? styles.mobileToolBtnActive : ""}`}
          onClick={() => {
            setActiveTool("text");
            setSelectedExistingTextId(null);
          }}
        >
          Add Text
        </button>
        <button
          type="button"
          className={`${styles.mobileToolBtn} ${activeTool === "draw" ? styles.mobileToolBtnActive : ""}`}
          onClick={() => {
            setActiveTool("draw");
            setSelectedExistingTextId(null);
          }}
        >
          Draw
        </button>
        <button
          type="button"
          className={`${styles.mobileToolBtn} ${activeTool === "highlight" ? styles.mobileToolBtnActive : ""}`}
          onClick={() => {
            setActiveTool("highlight");
            setSelectedExistingTextId(null);
          }}
        >
          Highlight
        </button>
        <button
          type="button"
          className={styles.mobileToolBtn}
          onClick={() => {
            const input = document.getElementById("imgUploadInput") as HTMLInputElement;
            input?.click();
          }}
        >
          Image
        </button>
        <button
          type="button"
          className={styles.mobileToolBtn}
          onClick={() => setIsSigModalOpen(true)}
        >
          Signature
        </button>
      </div>

      {/* ── Signature Modal ───────────────────────────────────────── */}
      {isSigModalOpen && (
        <div className={styles.signatureModal} onClick={() => setIsSigModalOpen(false)}>
          <div className={styles.signatureContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.signatureTitle}>Create Signature</h3>

            <div className={styles.signatureTabs}>
              <button
                type="button"
                className={`${styles.signatureTab} ${sigTab === "draw" ? styles.signatureTabActive : ""}`}
                onClick={() => setSigTab("draw")}
              >
                Draw
              </button>
              <button
                type="button"
                className={`${styles.signatureTab} ${sigTab === "type" ? styles.signatureTabActive : ""}`}
                onClick={() => setSigTab("type")}
              >
                Type
              </button>
            </div>

            {sigTab === "draw" && (
              <div>
                <canvas
                  ref={sigCanvasRef}
                  className={styles.signatureCanvas}
                  width={440}
                  height={180}
                  onMouseDown={startSigDraw}
                  onMouseMove={moveSigDraw}
                  onMouseUp={stopSigDraw}
                  onMouseLeave={stopSigDraw}
                  onTouchStart={startSigDraw}
                  onTouchMove={moveSigDraw}
                  onTouchEnd={stopSigDraw}
                />
                <button type="button" className={styles.sigClearBtn} onClick={clearSigCanvas}>
                  Clear Signature
                </button>
              </div>
            )}

            {sigTab === "type" && (
              <div>
                <input
                  type="text"
                  placeholder="Type your name..."
                  className={styles.signatureInput}
                  value={typedSigText}
                  onChange={(e) => setTypedSigText(e.target.value)}
                  autoFocus
                />
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                  A realistic cursive digital signature will be generated.
                </div>
              </div>
            )}

            <div className={styles.signatureActions}>
              <button
                type="button"
                className={styles.sigCancelBtn}
                onClick={() => setIsSigModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className={styles.sigConfirmBtn} onClick={confirmSignature}>
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Spinner Overlay ────────────────────────────────── */}
      {isExporting && (
        <div className={styles.exportOverlay}>
          <div className={styles.exportSpinner} />
          <div className={styles.exportText}>{exportProgressText}</div>
        </div>
      )}
    </div>
  );
}
