"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Briefcase,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Cloud,
  LayoutGrid,
  MonitorSmartphone,
  Palette,
  Shield,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import styles from "@/app/products/products-page.module.css";

export interface CategoryNavItem {
  slug: string;
  name: string;
  accent: string;
  count: number;
}

interface CategoryNavProps {
  groups: CategoryNavItem[];
  totalCount: number;
}

const ICON_MATCHERS: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /win/i, icon: MonitorSmartphone },
  { test: /(office|365)/i, icon: Briefcase },
  { test: /project/i, icon: CalendarRange },
  { test: /visio/i, icon: Workflow },
  { test: /vpn/i, icon: Shield },
  { test: /(antivirus|anti-virus|security)/i, icon: ShieldCheck },
  { test: /(cloud|storage|drive)/i, icon: Cloud },
  { test: /(autodesk|engineer|engineering)/i, icon: Box },
  { test: /(adobe|creative)/i, icon: Palette },
];

function getCategoryIcon(slug: string, name: string): LucideIcon {
  const key = `${slug} ${name}`;
  return ICON_MATCHERS.find((matcher) => matcher.test.test(key))?.icon ?? LayoutGrid;
}

export function CategoryNav({ groups, totalCount }: CategoryNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState(groups[0]?.slug ?? "");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setHasOverflow(maxScroll > 4);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  // Highlight the active chip based on which category section is in view.
  useEffect(() => {
    const sections = groups
      .map((group) => document.getElementById(group.slug))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groups]);

  // Keep the active chip visible inside the horizontal scroller.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !activeSlug) return;

    const chip = el.querySelector<HTMLElement>(`[data-slug="${activeSlug}"]`);
    if (!chip) return;

    const target =
      chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSlug]);

  function scrollByAmount(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(260, el.clientWidth * 0.7),
      behavior: "smooth",
    });
  }

  function handleChipClick(event: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    event.preventDefault();
    setActiveSlug(slug);
    document
      .getElementById(slug)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.categoryNavWrap}>
      
      <div className={styles.navPanel}>
        <button
          type="button"
          className={`${styles.arrowButton} ${styles.arrowButtonLeft} ${
            hasOverflow && canScrollLeft ? styles.arrowButtonVisible : ""
          }`}
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll categories left"
          tabIndex={hasOverflow && canScrollLeft ? 0 : -1}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <span
          className={`${styles.navFade} ${styles.navFadeLeft} ${
            canScrollLeft ? styles.navFadeVisible : ""
          }`}
          aria-hidden="true"
        />

        <nav
          ref={scrollerRef}
          className={styles.categoryNav}
          aria-label="Jump to category"
          onScroll={updateScrollState}
        >
          <a
            href="/home?category=all#products"
            className={styles.categoryChip}
            data-slug="all"
            style={{ "--category-accent": "#6C63FF" } as React.CSSProperties}
          >
            <LayoutGrid size={15} aria-hidden="true" />
            All
            <span className={styles.categoryChipCount}>{totalCount}</span>
          </a>

          {groups.map((group) => {
            const Icon = getCategoryIcon(group.slug, group.name);
            const isActive = group.slug === activeSlug;

            return (
              <a
                key={group.slug}
                href={`#${group.slug}`}
                data-slug={group.slug}
                aria-current={isActive ? "true" : undefined}
                className={`${styles.categoryChip} ${
                  isActive ? styles.categoryChipActive : ""
                }`}
                style={
                  { "--category-accent": group.accent } as React.CSSProperties
                }
                onClick={(event) => handleChipClick(event, group.slug)}
              >
                <Icon size={15} aria-hidden="true" />
                {group.name}
                <span className={styles.categoryChipCount}>{group.count}</span>
              </a>
            );
          })}
        </nav>

        <span
          className={`${styles.navFade} ${styles.navFadeRight} ${
            canScrollRight ? styles.navFadeVisible : ""
          }`}
          aria-hidden="true"
        />

        <button
          type="button"
          className={`${styles.arrowButton} ${styles.arrowButtonRight} ${
            hasOverflow && canScrollRight ? styles.arrowButtonVisible : ""
          }`}
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll categories right"
          tabIndex={hasOverflow && canScrollRight ? 0 : -1}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}