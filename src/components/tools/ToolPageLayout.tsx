import Link from "next/link";
import { TOOLS, type ToolConfig } from "@/data/tools";
import { ToolIcon, ArrowLeftIcon } from "./ToolIcons";
import styles from "./ToolPageLayout.module.css";

interface ToolPageLayoutProps {
  toolId: string;
  children: React.ReactNode;
}

export function ToolPageLayout({ toolId, children }: ToolPageLayoutProps) {
  const tool = TOOLS.find((t) => t.id === toolId);

  if (!tool) {
    return (
      <div className={styles.container}>
        <Link href="/tools" className={styles.backLink}>
          <ArrowLeftIcon size={18} />
          Back to Tools
        </Link>
        <div className={styles.content}>
          <p style={{ color: "var(--text-secondary)" }}>Tool not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/tools" className={styles.backLink}>
        <ArrowLeftIcon size={18} />
        Back to Tools
      </Link>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div
            className={styles.iconContainer}
            style={{
              backgroundColor: tool.backgroundColor,
              border: `1px solid ${tool.borderColor}`,
            }}
          >
            <ToolIcon name={tool.icon} size={32} color={tool.accentColor} />
          </div>
          
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{tool.name}</h1>
            <p className={styles.description}>{tool.description}</p>
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
      </header>

      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}