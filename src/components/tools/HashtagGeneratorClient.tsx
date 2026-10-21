"use client";
import { useState, useMemo } from "react";
import { notify } from "@/lib/toast";

// Simple keyword-to-hashtag mapping to simulate generation without external AI APIs
const HASHTAG_DATABASE: Record<string, string[]> = {
  tech: ["#technology", "#tech", "#innovation", "#digital", "#future", "#gadgets", "#software", "#hardware", "#coding", "#developer"],
  business: ["#business", "#entrepreneur", "#startup", "#marketing", "#success", "#motivation", "#finance", "#money", "#investing", "#economy"],
  travel: ["#travel", "#wanderlust", "#adventure", "#explore", "#vacation", "#holiday", "#nature", "#photography", "#trip", "#destination"],
  food: ["#food", "#foodie", "#instafood", "#delicious", "#yummy", "#cooking", "#recipe", "#dinner", "#lunch", "#breakfast"],
  fitness: ["#fitness", "#gym", "#workout", "#health", "#training", "#exercise", "#muscle", "#fitfam", "#wellness", "#lifestyle"],
  fashion: ["#fashion", "#style", "#ootd", "#instafashion", "#model", "#shopping", "#beauty", "#design", "#outfit", "#trendy"],
  art: ["#art", "#artist", "#creative", "#drawing", "#painting", "#illustration", "#design", "#sketch", "#gallery", "#masterpiece"],
  music: ["#music", "#musician", "#song", "#concert", "#hiphop", "#pop", "#rock", "#newmusic", "#singer", "#band"],
  love: ["#love", "#happy", "#beautiful", "#cute", "#instagood", "#photooftheday", "#life", "#smile", "#friends", "#family"],
  education: ["#education", "#learning", "#study", "#school", "#knowledge", "#student", "#teacher", "#university", "#onlinelearning", "#skills"],
};

const GENERIC_TAGS = [
  "#viral", "#trending", "#explorepage", "#instadaily", "#picoftheday", 
  "#bestoftheday", "#follow", "#like4like", "#contentcreator", "#socialmedia"
];

export function HashtagGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(15);
  const [copied, setCopied] = useState(false);

  const handleClear = () => {
    setTopic("");
    setCopied(false);
  };

  const generatedTags = useMemo(() => {
    if (!topic.trim()) return [];
    
    const keywords = topic.toLowerCase().split(/\s+/);
    const tagSet = new Set<string>();
    
    // Find matching categories
    keywords.forEach(kw => {
      Object.entries(HASHTAG_DATABASE).forEach(([category, tags]) => {
        if (category.includes(kw) || kw.includes(category)) {
          tags.forEach(t => tagSet.add(t));
        }
      });
    });

    // Add keyword-based tags directly
    keywords.forEach(kw => {
      if (kw.length > 2) {
        tagSet.add(`#${kw}`);
        tagSet.add(`#${kw}life`);
        tagSet.add(`#${kw}lover`);
      }
    });

    // Fill remaining slots with generic popular tags
    if (tagSet.size < count) {
      GENERIC_TAGS.forEach(t => tagSet.add(t));
    }

    return Array.from(tagSet).slice(0, count);
  }, [topic, count]);

  const handleCopy = async () => {
    if (generatedTags.length === 0) return;
    try {
      await navigator.clipboard.writeText(generatedTags.join(" "));
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: `${generatedTags.length} hashtags copied to clipboard.`,
        id: "hashtag-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy hashtags to clipboard.",
        id: "hashtag-copy-error",
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(0, 0, 0, 0.3)",
    color: "#f8fafc",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  const accentColor = "#0284C7";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Input Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label htmlFor="hash-topic" style={labelStyle}>
            Topic or Keywords
          </label>
          <input
            id="hash-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., tech startup, travel photography, vegan food..."
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = `${accentColor}80`)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <label htmlFor="hash-count" style={{ ...labelStyle, marginBottom: 0 }}>
              Number of Hashtags
            </label>
            <span style={{ color: "#f8fafc", fontWeight: 600, fontSize: "0.9rem" }}>{count}</span>
          </div>
          <input
            id="hash-count"
            type="range"
            min={5}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: "100%", accentColor, cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Results Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span id="hash-results-label" style={labelStyle}>Generated Hashtags</span>
          {generatedTags.length > 0 && (
             <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
               {generatedTags.length} tags
             </span>
          )}
        </div>

        <div
          aria-live="polite"
          aria-labelledby="hash-results-label"
          role="region"
          style={{
            minHeight: "120px",
            padding: "20px",
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignContent: "flex-start",
          }}
        >
          {generatedTags.length > 0 ? (
            generatedTags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: "6px 14px",
                  borderRadius: "99px",
                  background: `${accentColor}1A`,
                  border: `1px solid ${accentColor}4D`,
                  color: accentColor,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--text-muted)", alignSelf: "center", margin: "auto" }}>
              Enter a topic to generate hashtags
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          disabled={generatedTags.length === 0}
          aria-label="Copy generated hashtags to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: copied ? "#22c55e" : accentColor,
            color: "#fff",
            cursor: generatedTags.length > 0 ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: generatedTags.length > 0 ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          {copied ? "Copied!" : "Copy Hashtags"}
        </button>
        <button
          onClick={handleClear}
          disabled={!topic}
          aria-label="Clear topic and reset"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: topic ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: topic ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}