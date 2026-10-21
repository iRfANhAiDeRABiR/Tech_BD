import Link from "next/link";
import type { ToolConfig } from "@/data/tools";
import { ToolIcon, ArrowRightIcon } from "./ToolIcons";
import styles from "./ToolCard.module.css";

interface ToolCardProps {
  tool: ToolConfig;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      className={styles.card}
      style={{
        border: `1.5px solid ${tool.borderColor}`,
        boxShadow: `0 4px 16px -4px ${tool.backgroundColor}`,
      }}
      aria-label={`Use ${tool.name}`}
    >
      <div className={styles.header}>
        <div
          className={styles.iconContainer}
          style={{
            backgroundColor: tool.backgroundColor,
            border: `1px solid ${tool.borderColor}`,
          }}
        >
          <ToolIcon name={tool.icon} size={28} color={tool.accentColor} />
        </div>
        {tool.badge && (
          <span
            className={styles.badge}
            style={{
              backgroundColor: tool.backgroundColor,
              color: tool.accentColor,
              border: `1px solid ${tool.borderColor}`,
            }}
          >
            {tool.badge}
          </span>
        )}
      </div>

      <h3 className={styles.title}>{tool.name}</h3>
      <p className={styles.description}>{tool.description}</p>

      <span className={styles.cta} style={{ color: tool.accentColor }}>
        Use Tool <ArrowRightIcon size={16} color="currentColor" />
      </span>
    </Link>
  );
}