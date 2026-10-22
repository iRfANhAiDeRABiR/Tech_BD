"use client";

import React, { useState } from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Official bKash Logo loaded with vector graphic and local fallback
 */
export function BkashLogo({ className = "w-7 h-7", size = 32 }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <Image
        src="/img_content/bkash.png"
        alt="bKash"
        width={size}
        height={size}
        className={`${className} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg className={className} width={size} height={size} viewBox="11.2 10.7 458 209.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M327.99 110.75l12.99 58.4 85.01-43.04z" fill="#d12053" />
      <path d="M352.16 23.48L328 110.76l98.01 15.35z" fill="#e2136e" />
      <path d="M248.31 10.7l101.38 12.11-23.97 86.76z" fill="#d12053" />
      <path d="M247.52 27.76h11.29l31.67 40.5z" fill="#9e1638" />
      <path d="M428.69 125.55l-29.46-40.77 47.66-8.53z" fill="#d12053" />
      <path d="M423.77 137.5l3.04-9.07-74.39 37.74z" fill="#e2136e" />
      <path d="M325.91 113.05l15.52 69.77-46.06 37.46z" fill="#9e1638" />
      <path d="M442.25 96.97l27.05-.46-19.55-19.89z" fill="#e2136e" />
    </svg>
  );
}

/**
 * Official Nagad Logo loaded with local asset and vector fallback
 */
export function NagadLogo({ className = "w-7 h-7", size = 32 }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <Image
        src="/img_content/nagad.png"
        alt="Nagad"
        width={size}
        height={size}
        className={`${className} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#F7941D" />
      <path
        d="M20 5C11.716 5 5 11.716 5 20C5 28.284 11.716 35 20 35C28.284 35 35 28.284 35 20"
        stroke="#ED1C24"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M20 12C15.582 12 12 15.582 12 20C12 24.418 15.582 28 20 28"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="23" cy="18" r="2.8" fill="#FFFFFF" />
      <path d="M20 20L27 27" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Official Rocket Logo loaded with local asset and vector fallback
 */
export function RocketLogo({ className = "w-7 h-7", size = 32 }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <Image
        src="/img_content/rocket.png"
        alt="Rocket"
        width={size}
        height={size}
        className={`${className} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 28L23 8L36 5L32 17L12 36L15 25L4 28Z" fill="#8C3494" />
      <path d="M23 8L18 22L32 17L23 8Z" fill="#6A1B7B" />
      <path d="M18 22L12 36L15 25L18 22Z" fill="#AB47BC" />
      <circle cx="28" cy="12" r="2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Upay Logo
 */
export function UpayLogo({ className = "w-7 h-7", size = 32 }: LogoProps) {
  return (
    <Image
      src="/img_content/upay.png"
      alt="Upay"
      width={size}
      height={size}
      className={`${className} object-contain`}
    />
  );
}

