import { Injectable, Logger } from '@nestjs/common';
import { ChessTreeService } from 'src/chess-tree/chess-tree.service';

@Injectable()
export class AppService {
  constructor(private chessTreeService: ChessTreeService) {}

  checkMate(fen: string, history: string[]): void {
    Logger.log(`Check-Mate! FEN: ${fen} ; History: ${history}`);
  }

  step(fen: string, history: string[]): string {
    const step = 'a1';
    Logger.log(`Step: FEN: ${fen} ; Step: ${step}`);

    return step;
  }
}
