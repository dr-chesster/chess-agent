/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SepaTreeFork, SepaTreeNode } from 'sepatree';
import { stringToUint8Array, uint8ArrayToString } from 'src/utils';
import { SepatreeService } from '../sepatree/sepatree.service';

const PATH_SEPARATOR = '/';

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
    Logger.log(`init path ${path}`);
    const restPath = await this.sepatreeService.loadUntilPath(node, path);

    const foundPath = path.substr(0, path.length - restPath.length);

    return { restPath, foundPath };
  }

  public async getAIMove(fen:string){
    const response = await  fetch('http://localhost:6969', {
    method: 'POST',
    body: JSON.stringify({
      "FenString": fen
    })
  })
  const jsonResponse = await response.json( )
  Logger.log(`json response ${JSON.stringify(jsonResponse)}`)

  return jsonResponse['AI Move']

}
  /**
   * Called when a step is needed to advised on a party.
   */
  public async step(fen: string, history: string[]): Promise<string> {
    const rootNode = await this.initRootNode();

    // const { restPath, foundPath } = await this.initNodeByHistory(
    //   rootNode,
    //   history,
    // );
    // Logger.log(`step: restpath, ${restPath}`);
    // Logger.log(`step: foundPath, ${foundPath}`);

    if (true){ //(restPath.length > 0) {
      // call AI
      const AIMove = await this.getAIMove(fen)
      
      //CHECKMATE
      if (AIMove.includes("#") || AIMove.includes("++") || AIMove.includes("=")) {
        return AIMove+"|  --== ALL HAIL H.A.L. ==--  "
      }

      //STALEMENT
      if (AIMove.includes("stalemate")){
        return AIMove+"|  --== ALL HAIL H.A.L. ==--  "
      }
      
      return AIMove;
    } else {
      // const foundIndices = restPath.split(PATH_SEPARATOR);
      // Logger.log(`hallo1, ${foundIndices}`);

      // const { node } = this.sepatreeService.getForkAtPath(rootNode, foundPath);
      // const stepFork = node.forks[foundIndices[foundIndices.length - 1]];
      // // if (!stepFork) {
      // //   //call AI
      // //   return 'not implemented';
      // // }
      
      // // san step 
      // return uint8ArrayToString(stepFork.prefix);
    }
  }

  // when updating the tree topup until it could be loaded, then postage stamp

  /**
   * Called on checkmate
   */
  public async updateTree(fen: string, history: string[], winner: 'w' | 'b' | 'd' | ' ') {
    //const winner = this.calculateWinner(history);

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
    this.updateTreeRootHash(uint8ArrayToString(rootHash));

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

  private aggreateForkMetadata(fork: SepaTreeFork, winner: 'w' | 'b' | 'd' | ' '): void {
    const aggregatedMetadata: Partial<NodeMetadata> = {};
    if (winner === 'w') {
      aggregatedMetadata.whiteWins =
        1 + (Number(fork.node.getMetadata.whiteWins) || 0);
    }else if (winner === 'b') {
      aggregatedMetadata.blackWins =
        1 + (Number(fork.node.getMetadata.blackWins) || 0);
    }else{
      Logger.log("TODO")
    }

    fork.node.setMetadata = {
      ...fork.node.getMetadata,
      aggregatedMetadata,
    };
  }

  private initForkMetadata(winner: 'w' | 'b' | 'd' | ' '): Partial<NodeMetadata> {
    const metadata: Partial<NodeMetadata> = {};
    if (winner === 'w') {
      metadata['whiteWins'] = 1;}
    if (winner === 'b') {
      metadata['blackWins'] = 1;}
    // if (winner === 'd') {
    //   metadata['draws'] = 1;}
    
    

    return metadata;
  }

  private calculateWinner(history: string[]):  'w' | 'b' | 'd' | ' ' {
    // HÁT ÖÖÖÖ
    return history.length % 2 === 0 ? 'b' : 'w';
  }
}
