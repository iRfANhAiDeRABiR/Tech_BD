"use client";

import { useState, useMemo } from "react";
import { Search, Sparkles } from "lucide-react";
import { TOOLS, type ToolCategory } from "@/data/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import styles from "./tools.module.css";

const CATEGORIES: Array<"All" | ToolCategory> = [
  "All",
  "Security",
  "Text",
  "Calculator",
  "Developer",
  "Generator",
  "Marketing",
  "Image",
];

export function ToolsHubClient() {
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === "All" || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <span className={styles.badge}>
          <Sparkles size={14} /> 100% Free & In-Browser
        </span>
        <h1 className={styles.title}>Free Web Utilities & Tools</h1>
        <p className={styles.subtitle}>
          Fast, privacy-focused online tools for developers, designers, and marketers.
          No sign-up required, processing happens securely directly in your browser.
        </p>
      </header>

      <section className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search 16+ free utilities (e.g. QR code, image, password)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const count =
              cat === "All"
                ? TOOLS.length
                : TOOLS.filter((t) => t.category === cat).length;
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryBtn} ${
                  isActive ? styles.categoryBtnActive : ""
                }`}
              >
                <span>{cat}</span>
                <span className={styles.countBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filteredTools.length > 0 ? (
        <div className={styles.grid}>
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No tools match your search</p>
          <p className={styles.emptySubtext}>
            Try adjusting your search terms or filter category.
          </p>
        </div>
      )}
    </div>
  );
}
