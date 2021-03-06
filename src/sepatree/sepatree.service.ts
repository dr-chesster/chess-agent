import { Utils } from '@ethersphere/bee-js';
import { Injectable, Logger } from '@nestjs/common';
import {
  Reference as ByteReference,
  Reference,
  SepaTreeFork,
  SepaTreeNode
} from 'sepatree';
import { BeeService } from 'src/bee/bee.service';

const { bytesToHex, hexToBytes } = Utils;

const PATH_SEPARATOR = '/';

interface NodeSearchResult {
  node: SepaTreeNode;
  prefix: string;
}

@Injectable()
export class SepatreeService {
  public constructor(private beeService: BeeService) {
    Logger.log(
      `Sepatree service is inited. Bee API URL: ${this.beeService.getApiUrl()}`,
    );
  }

  public async getNodeAtReference(reference: string): Promise<SepaTreeNode> {
    const node = new SepaTreeNode();
    const data = await this.getBytesAtReference(hexToBytes(reference));
    node.deserialize(data);

    return node;
  }

  /**
   *  Loads a specific branch of the given node from storage
   *
   * @param node Root node to be loaded
   * @param path desired path
   * @returns remaining path that couldn't be loaded
   */
  public async loadUntilPath(
    rootNode: SepaTreeNode,
    path: string,
  ): Promise<string> {
    if (!rootNode.forks) return path;

    const pathIndices = path.split(PATH_SEPARATOR);
    let node: SepaTreeNode = rootNode;
    for (let i = 0; pathIndices.length; i++) {
      const fork = node.forks[pathIndices[i]];

      if (!fork) return pathIndices.slice(i).join('/');

      // load fork's node
      const entry = fork.node.getEntry;
      if (!entry) return pathIndices.slice(i).join('/');

      await fork.node.load(
        this.getBytesAtReference.bind(this),
        fork.node.getEntry,
      );

      node = fork.node;
    }
  }

  public getForkAtPath(node: SepaTreeNode, path: string): SepaTreeFork {
    return node.getForkAtPath(path);
  }

  public *iterateForksOnPath(
    node: SepaTreeNode,
    path: string,
  ): Iterable<SepaTreeFork> {
    if (path === '') return;

    const pathIndices = path.split(PATH_SEPARATOR);

    const fork = node.forks[pathIndices[0]];

    if (!fork)
      throw Error(`Fork "${pathIndices[0]}" is not found on path "${path}"`);

    yield fork;

    this.iterateForksOnPath(
      fork.node,
      pathIndices.slice(1).join(PATH_SEPARATOR),
    );
  }

  public async saveNode(node: SepaTreeNode): Promise<ByteReference> {
    const ref = await node.save(
      this.beeService.saveDataByteReference.bind(this.beeService),
    );

    return ref;
  }

  /**
   * loadFunction
   */
  private async getBytesAtReference(reference: Reference): Promise<Uint8Array> {
    return this.beeService.loadData(bytesToHex(reference));
  }
}
