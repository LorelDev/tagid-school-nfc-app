// Short, human-friendly code generation for tags and session join codes.
// Avoids ambiguous characters (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Build the absolute URL that gets written onto a physical NFC tag.
export function tagUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, "")}/t/${code}`;
}
