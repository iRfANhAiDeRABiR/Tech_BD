import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "hr",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const EMOJI_PREFIX_REGEX =
  /^\s*(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2000-\u3300])/u;

export function sanitizeProductHtml(value: string): string {
  const sanitized = sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      li: ["class"],
      table: ["class"],
      th: ["style"],
      td: ["style"],
    },
    allowedSchemes: [],
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  });

  return sanitized.replace(/<li>([\s\S]*?)<\/li>/gi, (match, inner) => {
    const rawText = inner.replace(/<[^>]+>/g, "").trim();
    if (EMOJI_PREFIX_REGEX.test(rawText)) {
      return `<li class="emoji-item">${inner}</li>`;
    }
    return match;
  });
}
