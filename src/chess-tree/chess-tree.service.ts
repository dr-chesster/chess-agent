import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SepaTreeNode } from 'sepatree';
import { SepatreeService } from '../sepatree/sepatree.service';

const PATH_SEPARATOR = '/';

@Injectable()
export class ChessTreeService {
  private treeRootHash: string;

  public constructor(
    private sepatreeService: SepatreeService,
    private configService: ConfigService,
  ) {
    this.treeRootHash = this.configService.get<string>('TREE_ROOT_HASH');
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

  public async getNodeByHistory(history: string[]) {
    const rootNode = await this.initRootNode();

    const { restPath, foundPath } = await this.initNodeByHistory(
      rootNode,
      history,
    );

    if (restPath.includes('/')) {
      // call AI
    } else {
      // const fork = this.mantarayService.getForkWhenRestPathExclude(
      //   rootNode,
      //   foundPath,
      //   PATH_SEPARATOR,
      // );
    }

    // return result.node;
  }

  // when updating the tree topup until it could be loaded, then postage stamp

  public async updateTree(fen: string, history: string[]) {
    const rootNode = await this.initRootNode();

    const { restPath, foundPath } = await this.initNodeByHistory(
      rootNode,
      history,
    );

    // the branch is already in the storage
    if (restPath === '') return;

    const restPathIndices = restPath.split(PATH_SEPARATOR);
    // calculate the fen and create feed for that if it does not exist OR
    // CAC for metadata that is an array of other similar fen Sepatree nodes,
    // which is secondary metadata, it is not needed always.
    const fork = this.sepatreeService.getForkWhenRestPathExclude;
    // const fork = this.mantarayService.getForkWhenRestPathExclude(
    //   rootNode,
    //   foundPath,
    //   PATH_SEPARATOR,
    // );

    //TODO aggregate with web3 service
  }

  private updateTreeRootHash(hash: string) {
    this.treeRootHash = hash;
  }

  private getNodePathFromHistory(history: string[]): string {
    return history.join(PATH_SEPARATOR);
  }

  private async initRootNode(): Promise<SepaTreeNode> {
    return this.sepatreeService.getNodeAtReference(this.treeRootHash);
  }
}
