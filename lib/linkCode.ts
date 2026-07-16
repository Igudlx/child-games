import { randomInt } from 'crypto';

const CODE_LENGTH = 8;
// Excludes 0/O and 1/I/L to avoid player confusion when reading the code off a VR headset.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generates a cryptographically random, human-friendly link code like "K7P2XQ9M". */
export function generateLinkCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

export const LINK_CODE_TTL_MINUTES = 10;
