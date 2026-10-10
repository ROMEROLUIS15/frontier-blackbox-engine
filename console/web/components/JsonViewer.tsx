import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface JsonViewerProps {
  value: unknown;
}

type TokenKind = "key" | "string" | "number" | "boolean" | "null" | "plain";

interface Token {
  kind: TokenKind;
  text: string;
}

const TOKEN_STYLE: Record<TokenKind, string> = {
  key: "text-accent",
  string: "text-success",
  number: "text-warning",
  boolean: "text-danger",
  null: "text-text-muted",
  plain: "text-text",
};

const TOKEN_PATTERN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function tokenKindOf(match: RegExpMatchArray): TokenKind {
  if (match[1] !== undefined) return match[2] !== undefined ? "key" : "string";
  if (match[3] !== undefined) return "boolean";
  return match[0] === "null" ? "null" : "number";
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    if (match.index > cursor) tokens.push({ kind: "plain", text: text.slice(cursor, match.index) });
    const kind = tokenKindOf(match);
    if (kind === "key") {
      tokens.push({ kind, text: match[1] ?? "" });
      tokens.push({ kind: "plain", text: match[2] ?? "" });
    } else {
      tokens.push({ kind, text: match[0] });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ kind: "plain", text: text.slice(cursor) });
  return tokens;
}

/**
 * Read-only pretty JSON. Strings are rendered raw (the BFF returns raw text when the body is not JSON).
 */
export function JsonViewer({ value }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const isRawText = typeof value === "string";
  const text = isRawText ? value : (JSON.stringify(value, null, 2) ?? "");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => setCopied(false),
    );
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copyToClipboard}
        aria-label={copied ? "Copiado" : "Copiar contenido"}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] text-text-muted opacity-70 transition hover:text-text hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check aria-hidden="true" size={12} /> : <Copy aria-hidden="true" size={12} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
      <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-canvas/70 p-3 pr-20 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-text">
        {isRawText
          ? text
          : tokenize(text).map((token, index) => (
              <span key={index} className={TOKEN_STYLE[token.kind]}>
                {token.text}
              </span>
            ))}
      </pre>
    </div>
  );
}
