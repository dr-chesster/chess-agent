import { Reference } from '@ethersphere/bee-js';
import { SepaTreeNode } from 'sepatree';

export function referenceToHex(reference: Reference | Uint8Array): string {
  return Buffer.from(reference).toString('hex');
}

export function stringToUint8Array(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function uint8ArrayToString(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

export const PATH_SEPARATOR = '/';

/**
 *  Loads a specific branch of the given node from storage
 *
 * @param node Root node to be loaded
 * @param path desired path
 * @returns remaining path that couldn't be loaded
 */
export async function loadUntilPath(
  node: SepaTreeNode,
  path: string,
): Promise<string> {
  if (!node.forks) return path;

  const pathIndices = path.split(PATH_SEPARATOR);

  const fork = node.forks[pathIndices[0]];

  console.log(
    `Index: ${pathIndices[0]} ; fork ${fork} ; node keys: ${Object.keys(
      node.forks,
    )}`,
  );

  if (!fork) return path;

  const prefixString = uint8ArrayToString(fork.prefix);

  const rest = path.slice(prefixString.length);

  // load fork's node
  const entry = fork.node.getEntry;
  if (!entry) return rest;

  await node.load(this.getBytesAtReference.bind(this), entry);

  if (rest.length === 0) return '';

  return loadUntilPath(fork.node, rest);
}
