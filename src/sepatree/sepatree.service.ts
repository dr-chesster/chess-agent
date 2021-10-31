import { Injectable } from '@nestjs/common';
import { SepaTreeNode } from 'sepatree';
import { BeeService } from 'src/bee/bee.service';

const PATH_SEPARATOR = '/'

interface NodeSearchResult {
  node: SepaTreeNode;
  prefix: string;
}

@Injectable()
export class SepatreeService {
  public constructor(private beeService: BeeService) {}

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
    
    const pathIndices = path.split(PATH_SEPARATOR)

    const fork = node.forks[pathIndices[0]];

    if (!fork) return path;

    const prefixIndex = findIndexOfArray(bytePath, fork.prefix);

    if (prefixIndex === -1) return path;

    const rest = path.slice(fork.prefix.length);

    // load fork's node
    const entry = fork.node.getEntry;
    if (!entry) return rest;

    await node.load(this.getBytesAtReference.bind(this), entry);

    if (rest.length === 0) return '';

    return this.loadUntilPath(fork.node, rest);
  }

  public getFork(path: string); SepaTreeFork {

  }

  /**
   * loadFunction
   */
  private getBytesAtReference(reference: string): Promise<Uint8Array> {
    return this.beeService.loadData(reference);
  }
}
