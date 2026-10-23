"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import type { AdminLanguage } from "@/lib/admin-translations";
import styles from "@/app/admin/admin.module.css";

interface LanguageOption {
  code: AdminLanguage;
  name: string;
  sub: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    sub: "English (Default)",
    flag: "🇺🇸",
  },
  {
    code: "bn",
    name: "বাংলা",
    sub: "বাংলা (Bangla)",
    flag: "🇧🇩",
  },
];

export function AdminLanguageDropdown() {
  const { lang, setLang, t } = useAdminLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentOption = languageOptions.find((opt) => opt.code === lang) ?? languageOptions[0];

  const handleSelect = (code: AdminLanguage) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className={styles.langDropdownWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.langDropdownTrigger} ${
          isOpen ? styles.langDropdownTriggerOpen : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={t.lang_dropdown_title}
      >
        <Globe size={14} style={{ opacity: 0.8 }} />
        <span className={styles.langFlag}>{currentOption.flag}</span>
        <span className={styles.langText}>{currentOption.name}</span>
        <ChevronDown
          size={13}
          className={`${styles.langChevron} ${isOpen ? styles.langChevronOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.langMenu} role="menu" aria-orientation="vertical">
          <div className={styles.langMenuHeader}>{t.select_language}</div>
          {languageOptions.map((opt) => {
            const isActive = opt.code === lang;
            return (
              <button
                key={opt.code}
                type="button"
                role="menuitem"
                className={`${styles.langMenuItem} ${
                  isActive ? styles.langMenuItemActive : ""
                }`}
                onClick={() => handleSelect(opt.code)}
              >
                <div className={styles.langItemLeft}>
                  <span className={styles.langFlag}>{opt.flag}</span>
                  <div className={styles.langItemNames}>
                    <span className={styles.langItemTitle}>{opt.name}</span>
                    <span className={styles.langItemSub}>{opt.sub}</span>
                  </div>
                </div>
                {isActive && <Check size={14} className={styles.langItemCheck} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
