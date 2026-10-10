/**
 * Control digit of a message payload (everything before the last `;`).
 *
 * N = concatenation, over the upper-cased payload, of: the digit itself for 0-9,
 * the alphabet position without padding for A-Z (A=1 ... Z=26); everything else is dropped.
 * control = 98 - ((N * 100) mod 97).
 */
export function controlDigit(payload: string): number {
  let remainder = 0;
  const feed = (digits: string): void => {
    for (const ch of digits) remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  };
  for (const ch of payload.toUpperCase()) {
    if (ch >= "0" && ch <= "9") {
      feed(ch);
    } else if (ch >= "A" && ch <= "Z") {
      feed(String(ch.charCodeAt(0) - 64));
    }
    // ASSUMPTION: non-ASCII letters (a-acute, n-tilde...) are dropped like any other symbol.
  }
  // Multiply by 100 by feeding two zero digits.
  feed("00");
  return 98 - remainder;
}
