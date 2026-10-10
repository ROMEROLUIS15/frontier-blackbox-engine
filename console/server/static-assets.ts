import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

export interface StaticAsset {
  contentType: string;
  content: Buffer;
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function decodePath(urlPath: string): string | null {
  try {
    const decoded = decodeURIComponent(urlPath);
    return decoded.includes(String.fromCharCode(0)) ? null : decoded;
  } catch {
    return null;
  }
}

async function tryRead(file: string): Promise<Buffer | null> {
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

function contentTypeOf(file: string): string {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Resolves `urlPath` inside `distDir`. Anything that would escape it is rejected (null);
 * unknown paths fall back to index.html for SPA routing.
 */
export async function loadStaticAsset(distDir: string, urlPath: string): Promise<StaticAsset | null> {
  const root = resolve(distDir);
  const decoded = decodePath(urlPath);
  if (decoded === null) return null;

  const candidate = resolve(join(root, decoded));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  const direct = candidate === root ? null : await tryRead(candidate);
  if (direct !== null) return { contentType: contentTypeOf(candidate), content: direct };

  const indexFile = join(root, "index.html");
  const index = await tryRead(indexFile);
  return index === null ? null : { contentType: contentTypeOf(indexFile), content: index };
}
