import React from "react";
import styles from "./Downloads.module.css";
import type { SoftwareDownloadItem } from "@/data/software-downloads";

interface SoftwareIconTileProps {
  item?: Partial<SoftwareDownloadItem>;
  variant?: SoftwareDownloadItem["variant"];
  image?: string | null;
  title?: string;
  badgeLabel?: string;
  size?: "sm" | "md";
}

const VARIANT_THEME: Record<
  SoftwareDownloadItem["variant"],
  { bg: string; shadow: string; tag: string }
> = {
  "office-2024": {
    bg: "linear-gradient(145deg, #ff6b35 0%, #ea2c14 52%, #9f1239 100%)",
    shadow: "rgba(234, 44, 20, 0.35)",
    tag: "2024",
  },
  "office-365": {
    bg: "linear-gradient(145deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
    shadow: "rgba(168, 85, 247, 0.38)",
    tag: "365",
  },
  "win-11": {
    bg: "linear-gradient(145deg, #38bdf8 0%, #0284c7 52%, #1e3a8a 100%)",
    shadow: "rgba(2, 132, 199, 0.38)",
    tag: "WIN 11",
  },
  "win-10": {
    bg: "linear-gradient(145deg, #22d3ee 0%, #0284c7 52%, #0f172a 100%)",
    shadow: "rgba(14, 165, 233, 0.35)",
    tag: "WIN 10",
  },
  "office-2021": {
    bg: "linear-gradient(145deg, #fb923c 0%, #ea580c 55%, #9a3412 100%)",
    shadow: "rgba(234, 88, 12, 0.35)",
    tag: "2021",
  },
  "office-multi": {
    bg: "linear-gradient(145deg, #8b5cf6 0%, #6d28d9 55%, #3b0764 100%)",
    shadow: "rgba(109, 40, 217, 0.38)",
    tag: "2019",
  },
  "office-2016": {
    bg: "linear-gradient(145deg, #f97316 0%, #dc2626 58%, #7f1d1d 100%)",
    shadow: "rgba(220, 38, 38, 0.35)",
    tag: "2016",
  },
  "office-2010": {
    bg: "linear-gradient(145deg, #fbbf24 0%, #d97706 55%, #78350f 100%)",
    shadow: "rgba(217, 119, 6, 0.35)",
    tag: "2010",
  },
  visio: {
    bg: "linear-gradient(145deg, #60a5fa 0%, #2563eb 52%, #1e3a8a 100%)",
    shadow: "rgba(37, 99, 235, 0.38)",
    tag: "VISIO",
  },
  project: {
    bg: "linear-gradient(145deg, #34d399 0%, #059669 52%, #064e3b 100%)",
    shadow: "rgba(5, 150, 105, 0.38)",
    tag: "PROJECT",
  },
  custom: {
    bg: "linear-gradient(145deg, #38bdf8 0%, #6366f1 55%, #312e81 100%)",
    shadow: "rgba(99, 102, 241, 0.35)",
    tag: "PRO",
  },
};

export function SoftwareIconTile(props: SoftwareIconTileProps) {
  const variant = props.variant ?? props.item?.variant ?? "custom";
  const image = props.image !== undefined ? props.image : props.item?.image;
  const title = props.title ?? props.item?.title ?? "";
  const size = props.size ?? "md";
  const theme = VARIANT_THEME[variant] ?? VARIANT_THEME.custom;

  const isSmall = size === "sm";

  return (
    <div
      className={`${styles.iconTile} ${isSmall ? styles.iconTileSm : ""}`}
      style={{
        background: theme.bg,
        boxShadow: isSmall
          ? `0 4px 12px ${theme.shadow}, inset 0 1px 1px rgba(255, 255, 255, 0.45)`
          : `0 12px 28px ${theme.shadow}, inset 0 1.5px 2px rgba(255, 255, 255, 0.5)`,
      }}
    >
      {/* Top glossy glass reflection */}
      <span className={styles.tileGlassSheen} aria-hidden="true" />

      {/* Center Software Emblem or Uploaded Picture */}
      <div className={styles.tileCenterGlyph}>
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={title}
            className={styles.tileCustomImg}
          />
        ) : (
          renderEmblem(variant, isSmall ? 26 : 42)
        )}
      </div>

      {/* Clean Modern Bottom Tag Pill (hidden on small table icons if custom image) */}
      {!image && (
        <span className={`${styles.tileSubLabel} ${isSmall ? styles.tileSubLabelSm : ""}`}>
          {theme.tag}
        </span>
      )}
    </div>
  );
}

function renderEmblem(variant: SoftwareDownloadItem["variant"], svgSize: number) {
  switch (variant) {
    case "office-2024":
    case "office-2021":
    case "office-2016":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Modern Fluent 3D Ribbon */}
          <path
            d="M8 9.8C8 8.7 8.65 7.7 9.65 7.25L20.5 2.4C22.3 1.6 24.3 2.92 24.3 4.9V31.1C24.3 33.08 22.3 34.4 20.5 33.6L9.65 28.75C8.65 28.3 8 27.3 8 26.2V9.8Z"
            fill="white"
            fillOpacity="0.22"
          />
          <path
            d="M21.2 3.2L10.2 8.2C9.45 8.55 9 9.3 9 10.12V22.8L15.2 19.6V11.2L22.5 8.1V32.8L27.2 30.6C28.3 30.1 29 29 29 27.8V8.2C29 7 28.3 5.9 27.2 5.4L21.2 3.2Z"
            fill="white"
          />
          <path
            d="M9 22.8L15.2 26.2L22.5 32.8L10.3 27.6C9.5 27.25 9 26.45 9 25.58V22.8Z"
            fill="white"
            fillOpacity="0.78"
          />
        </svg>
      );

    case "office-365":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Modern M365 Copilot / Hex Infinity Ribbon */}
          <path
            d="M18 4L29.5 10.6V25.4L18 32L6.5 25.4V10.6L18 4Z"
            stroke="white"
            strokeOpacity="0.28"
            strokeWidth="2.5"
          />
          <path
            d="M18 6.5L27 11.7V24.3L18 29.5L9 24.3V11.7L18 6.5Z"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="18" r="4.2" fill="white" />
        </svg>
      );

    case "win-11":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Crisp 4-Pane Windows 11 Glass Grid */}
          <rect x="5" y="5" width="11.8" height="11.8" rx="2.6" fill="white" />
          <rect x="19.2" y="5" width="11.8" height="11.8" rx="2.6" fill="white" fillOpacity="0.88" />
          <rect x="5" y="19.2" width="11.8" height="11.8" rx="2.6" fill="white" fillOpacity="0.88" />
          <rect x="19.2" y="19.2" width="11.8" height="11.8" rx="2.6" fill="white" fillOpacity="0.75" />
        </svg>
      );

    case "win-10":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Perspective Windows 10 Emblem */}
          <path d="M5 8.6L16.2 6.9V17.1H5V8.6Z" fill="white" fillOpacity="0.92" />
          <path d="M18.2 6.6L31 4.6V17.1H18.2V6.6Z" fill="white" />
          <path d="M5 19H16.2V29.1L5 27.4V19Z" fill="white" fillOpacity="0.85" />
          <path d="M18.2 19H31V31.4L18.2 29.4V19Z" fill="white" fillOpacity="0.95" />
        </svg>
      );

    case "office-multi":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Modern Layered Suite Stack */}
          <rect x="6" y="7" width="17" height="22" rx="4" fill="white" fillOpacity="0.28" />
          <rect x="10" y="5" width="19" height="24" rx="4.5" fill="white" />
          <rect x="14.5" y="11" width="10" height="2.6" rx="1.3" fill="#6d28d9" />
          <rect x="14.5" y="16" width="10" height="2.6" rx="1.3" fill="#6d28d9" fillOpacity="0.7" />
          <rect x="14.5" y="21" width="6.5" height="2.6" rx="1.3" fill="#6d28d9" fillOpacity="0.5" />
        </svg>
      );

    case "office-2010":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* 4-Quad Modernized Classic Office */}
          <rect x="5.5" y="5.5" width="11.2" height="11.2" rx="3.2" fill="white" />
          <rect x="19.3" y="5.5" width="11.2" height="11.2" rx="3.2" fill="white" fillOpacity="0.82" />
          <rect x="5.5" y="19.3" width="11.2" height="11.2" rx="3.2" fill="white" fillOpacity="0.82" />
          <rect x="19.3" y="19.3" width="11.2" height="11.2" rx="3.2" fill="white" fillOpacity="0.65" />
        </svg>
      );

    case "visio":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Modern Visio Diagram + V Badge */}
          <rect x="5" y="6" width="19" height="22" rx="4.5" fill="white" />
          <path
            d="M10.8 12L14.5 22L18.2 12"
            stroke="#1d4ed8"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="29" cy="11" r="3.5" fill="white" fillOpacity="0.9" />
          <rect x="25.5" y="20" width="7" height="7" rx="2" fill="white" fillOpacity="0.85" />
          <path d="M24 14H26.5M24 23.5H25.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "project":
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          {/* Modern Project Gantt Bars */}
          <rect x="5" y="6" width="26" height="22" rx="5" fill="white" fillOpacity="0.2" />
          <rect x="8" y="10" width="13" height="4" rx="2" fill="white" />
          <rect x="12" y="16" width="15" height="4" rx="2" fill="white" fillOpacity="0.9" />
          <rect x="9" y="22" width="10" height="4" rx="2" fill="white" fillOpacity="0.78" />
        </svg>
      );

    default:
      return (
        <svg width={svgSize} height={svgSize} viewBox="0 0 36 36" fill="none">
          <path
            d="M18 4L30 10.8V25.2L18 32L6 25.2V10.8L18 4Z"
            fill="white"
            fillOpacity="0.22"
          />
          <path
            d="M18 10V23M18 23L13 18M18 23L23 18"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
