// Short, human-friendly code generation.
// Avoids ambiguous characters (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DIGITS = "0123456789";

function pick(set: string, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += set[Math.floor(Math.random() * set.length)];
  }
  return out;
}

// Tag code embedded in the NFC URL, e.g. "AB12CD" or a custom label.
export function generateTagCode(length = 6): string {
  return pick(ALPHABET, length);
}

// Session join code shown to students, e.g. "TAGID-4821".
export function generateSessionCode(): string {
  return `TAGID-${pick(DIGITS, 4)}`;
}

// Absolute URL written onto a physical NFC tag.
export function tagUrl(baseUrl: string, tagCode: string): string {
  return `${baseUrl.replace(/\/$/, "")}/t/${tagCode}`;
}

// A palette for auto-coloring groups.
export const GROUP_COLORS = [
  "#0ea5b7",
  "#f97316",
  "#22c55e",
  "#6366f1",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#ef4444",
];
