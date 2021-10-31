import { Injectable, Logger } from '@nestjs/common';
import {
  Reference as ByteReference,
  SepaTreeFork,
  SepaTreeNode
} from 'sepatree';
import { BeeService } from 'src/bee/bee.service';

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
    const data = await this.getBytesAtReference(reference);
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
    node: SepaTreeNode,
    path: string,
  ): Promise<string> {
    if (!node.forks) return path;

    const pathIndices = path.split(PATH_SEPARATOR);

    const fork = node.forks[pathIndices[0]];

    Logger.debug(
      `Index: ${pathIndices[0]} ; fork ${fork} ; node keys: ${Object.keys(
        node.forks,
      )}`,
    );

    if (!fork) return path;

    const rest = path.slice(fork.prefix.length);

    // load fork's node
    const entry = fork.node.getEntry;
    if (!entry) return rest;

    await node.load(this.getBytesAtReference.bind(this), entry);

    if (rest.length === 0) return '';

    return this.loadUntilPath(fork.node, rest);
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
    Logger.log('VMASF0');
    const ref = await node.save(
      this.beeService.saveDataByteReference.bind(this.beeService),
    );
    Logger.log('VMASF1');

    return ref;
  }

  /**
   * loadFunction
   */
  private async getBytesAtReference(reference: string): Promise<Uint8Array> {
    return this.beeService.loadData(reference);
  }
}
