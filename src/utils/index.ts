import { Reference } from '@ethersphere/bee-js';

export function referenceToHex(reference: Reference | Uint8Array): string {
  return Buffer.from(reference).toString('hex');
}

export function stringToUint8Array(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function uint8ArrayToString(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}
