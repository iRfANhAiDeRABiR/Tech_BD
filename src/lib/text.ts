export function toPlainText(value: string): string {
  return value
    .replace(/<\/li>\s*<li[^>]*>/gi, ". ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

