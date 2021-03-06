import { Utils } from '@ethersphere/bee-js';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChessInstance } from 'chess-types';
import { Chess } from 'chess.js';
import { SepaTreeFork, SepaTreeNode } from 'sepatree';
import { stringToUint8Array, uint8ArrayToString } from 'src/utils';
import { SepatreeService } from '../sepatree/sepatree.service';
import { ChessStep } from './interfaces/chess-state.dto';

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
    const restPath = await this.sepatreeService.loadUntilPath(node, path);

    const foundPath = path.substr(0, path.length - restPath.length);

    return { restPath, foundPath };
  }

  public async getAIMove(fen: string): Promise<string> {
    const response = await fetch('http://localhost:6969', {
      method: 'POST',
      body: JSON.stringify({
        FenString: fen,
      }),
    });
    const jsonResponse = await response.json();
    Logger.log(`json response ${JSON.stringify(jsonResponse)}`);

    return jsonResponse['AI Move'];
  }
  /**
   * Called when a step is needed to advised on a party.
   */
  public async step(fen: string, history: string[]): Promise<ChessStep> {
    const rootNode = await this.initRootNode();

    const { restPath, foundPath } = await this.initNodeByHistory(
      rootNode,
      history,
    );

    const lastStep = history[history.length - 1];
    if (lastStep.includes('#')) {
      await this.updateTree(history);

      return;
    }

    if (restPath.length > 0) {
      // call AI
      const AIMove = await this.getAIMove(fen);

      //CHECKMATE
      // if (
      //   AIMove.includes('#') ||
      //   AIMove.includes('++') ||
      //   AIMove.includes('=')
      // ) {
      //   return AIMove + '|  --== ALL HAIL H.A.L. ==--  ';
      // }

      // //STALEMENT
      // if (AIMove.includes('stalemate')) {
      //   return AIMove + '|  --== ALL HAIL H.A.L. ==--  ';
      // }

      return { step: AIMove, perpetrator: 'ai' };
    } else {
      const { node: lastNode } = this.sepatreeService.getForkAtPath(
        rootNode,
        foundPath,
      );
      // choose the best fork
      const agentIsWhite = (history.length + 1) % 2 === 1;
      let bestFork: SepaTreeFork | undefined;
      let maxWins = 0;
      for (const forkIndex of Object.keys(lastNode.forks)) {
        const fork = lastNode.forks[forkIndex];
        const metadata: NodeMetadata = fork.node.getMetadata as any;
        const whiteWins = metadata.whiteWins || 0;
        const blackWins = metadata.blackWins || 0;
        if (agentIsWhite && whiteWins > maxWins) {
          maxWins = whiteWins;
          bestFork = fork;
        } else if (!agentIsWhite && blackWins > maxWins) {
          maxWins = blackWins;
          bestFork = fork;
        }
      }

      if (!bestFork) {
        // call AI
        const AIMove = await this.getAIMove(fen);
        return { step: AIMove, perpetrator: 'ai' };
      }

      const step = uint8ArrayToString(bestFork.prefix);
      return {
        step,
        perpetrator: 'agent',
      };
    }
  }

  // when updating the tree topup until it could be loaded, then postage stamp

  /**
   * Called on checkmate
   */
  public async updateTree(history: string[]) {
    //const winner = this.calculateWinner(history);
    const game: ChessInstance = new Chess();
    for (const el of history) {
      game.move(el);
    }
    let winner: 'w' | 'b' | 'd' | ' ' = ' ';
    if (game.in_checkmate()) {
      winner = game.history.length % 2 === 1 ? 'w' : 'b';
    } else if (game.in_draw() || game.in_stalemate()) {
      winner = 'd';
    }
    if (winner === ' ') {
      throw new BadRequestException('The game is not finished yet.');
    }

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

  private aggreateForkMetadata(
    fork: SepaTreeFork,
    winner: 'w' | 'b' | 'd' | ' ',
  ): void {
    const aggregatedMetadata: Partial<NodeMetadata> = {};
    if (winner === 'w') {
      aggregatedMetadata.whiteWins =
        1 + (Number(fork.node.getMetadata.whiteWins) || 0);
    } else if (winner === 'b') {
      aggregatedMetadata.blackWins =
        1 + (Number(fork.node.getMetadata.blackWins) || 0);
    } else {
      Logger.log('TODO');
    }

    fork.node.setMetadata = {
      ...fork.node.getMetadata,
      aggregatedMetadata,
    };
  }

  private initForkMetadata(
    winner: 'w' | 'b' | 'd' | ' ',
  ): Partial<NodeMetadata> {
    const metadata: Partial<NodeMetadata> = {};
    if (winner === 'w') {
      metadata['whiteWins'] = 1;
    }
    if (winner === 'b') {
      metadata['blackWins'] = 1;
    }
    // if (winner === 'd') {
    //   metadata['draws'] = 1;}

    return metadata;
  }
}
