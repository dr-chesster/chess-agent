import { Utils } from '@ethersphere/bee-js';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SepaTreeFork, SepaTreeNode } from 'sepatree';
import { stringToUint8Array, uint8ArrayToString } from 'src/utils';
import { SepatreeService } from '../sepatree/sepatree.service';

const PATH_SEPARATOR = '/';
const { bytesToHex } = Utils;

interface NodeMetadata {
  whiteWins: number;
  blackWins: number;
}

@Injectable()
export class ChessTreeService {
  private treeRootHash?: string;

  public constructor(
    private sepatreeService: SepatreeService,
    private configService: ConfigService,
  ) {
    this.treeRootHash = this.configService.get<string | undefined>(
      'TREE_ROOT_HASH',
    );
  }

  public async initNodeByHistory(
    node: SepaTreeNode,
    history: string[],
  ): Promise<{ restPath: string; foundPath: string }> {
    const path = this.getNodePathFromHistory(history);
    Logger.log(`init path0 ${path}, ${Object.keys(node.forks)}`);
    const restPath = await this.sepatreeService.loadUntilPath(node, path);

    const foundPath = path.substr(0, path.length - restPath.length);
    Logger.log(`init path1 ${path}, ${Object.keys(node.forks)}`);

    return { restPath, foundPath };
  }

  /**
   * Called when a step is needed to advised on a party.
   */
  public async step(fen: string, history: string[]): Promise<string> {
    const rootNode = await this.initRootNode();
    Logger.log(`-hallo1.5, ${Object.keys(rootNode.forks)}`);

    const { restPath, foundPath } = await this.initNodeByHistory(
      rootNode,
      history,
    );
    Logger.log(`-hallo1, ${Object.keys(rootNode.forks)}`);
    Logger.log(`step: restpath, ${restPath}`);
    Logger.log(`step: foundPath, ${foundPath}`);

    if (restPath.length > 0) {
      // call AI
      return 'not implemented';
    } else {
      const foundIndices = foundPath.split(PATH_SEPARATOR);
      Logger.log(`hallo1, ${foundIndices}`);
      Logger.log(`hallo1.5, ${Object.keys(rootNode.forks)}`);

      const { node: lastNode, prefix } = this.sepatreeService.getForkAtPath(
        rootNode,
        foundPath,
      );
      Logger.log(`hallo1.6, ${Object.keys(lastNode.forks)}`);
      // choose the best fork
      const bestFork = lastNode.forks[Object.keys(lastNode.forks)[0]];
      Logger.log(`hallo2, ${uint8ArrayToString(bestFork.prefix)}`);

      return uint8ArrayToString(bestFork.prefix);
    }
  }

  // when updating the tree topup until it could be loaded, then postage stamp

  /**
   * Called on checkmate
   */
  public async updateTree(fen: string, history: string[]) {
    const winner = this.calculateWinner(history);
    const rootNode = await this.initRootNode();

    const { restPath, foundPath } = await this.initNodeByHistory(
      rootNode,
      history,
    );

    for (const fork of this.sepatreeService.iterateForksOnPath(
      rootNode,
      foundPath,
    )) {
      this.aggreateForkMetadata(fork, winner);
    }

    // the branch is not in the storage
    if (restPath !== '') {
      let lastNode = rootNode;
      if (foundPath !== '') {
        // calculate the fen and create feed for that if it does not exist OR
        // CAC for metadata that is an array of other similar fen Sepatree nodes,
        // which is secondary metadata, it is not needed always.
        const lastStoredFork = this.sepatreeService.getForkAtPath(
          rootNode,
          foundPath,
        );

        lastNode = lastStoredFork.node;
      }

      const restPathIndices = restPath.split(PATH_SEPARATOR);

      let iterateNode: SepaTreeNode = lastNode;
      for (const pathIndex of restPathIndices) {
        const childNode = new SepaTreeNode();
        childNode.forks = {};
        childNode.setMetadata = this.initForkMetadata(winner);
        iterateNode.forks[pathIndex] = new SepaTreeFork(
          stringToUint8Array(pathIndex),
          childNode,
        );
        iterateNode = childNode;
      }
    }

    const rootHash = await this.sepatreeService.saveNode(rootNode);
    Logger.debug(`new node first levels keys: ${Object.keys(rootNode.forks)}`);
    this.updateTreeRootHash(bytesToHex(rootHash));

    //TODO aggregate with web3 service
  }

  private updateTreeRootHash(hash: string) {
    Logger.log(`Updated Sepatree Root Hash: ${hash}`);
    this.treeRootHash = hash;
  }

  private getNodePathFromHistory(history: string[]): string {
    return history.join(PATH_SEPARATOR);
  }

  private async initRootNode(): Promise<SepaTreeNode> {
    if (this.treeRootHash) {
      Logger.debug(`init manifest from root hash ${this.treeRootHash}`);

      return this.sepatreeService.getNodeAtReference(this.treeRootHash);
    }
    Logger.log(`init manifest from zero value`);
    const rootNode = new SepaTreeNode();
    rootNode.forks = {};

    return rootNode;
  }

  private aggreateForkMetadata(fork: SepaTreeFork, winner: 'w' | 'b'): void {
    const aggregatedMetadata: Partial<NodeMetadata> = {};
    if (winner === 'w') {
      aggregatedMetadata.whiteWins =
        1 + (Number(fork.node.getMetadata.whiteWins) || 0);
    } else {
      aggregatedMetadata.blackWins =
        1 + (Number(fork.node.getMetadata.blackWins) || 0);
    }

    fork.node.setMetadata = {
      ...fork.node.getMetadata,
      aggregatedMetadata,
    };
  }

  private initForkMetadata(winner: 'w' | 'b'): Partial<NodeMetadata> {
    const metadata: Partial<NodeMetadata> = {};
    metadata[winner ? 'whiteWins' : 'blackWins'] = 1;

    return metadata;
  }

  private calculateWinner(history: string[]): 'w' | 'b' {
    return history.length % 2 === 0 ? 'b' : 'w';
  }
}
