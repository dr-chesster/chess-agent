import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  checkMate(fen: string, history: string[]): void {
    Logger.log(`Check-Mate! FEN: ${fen} ; History: ${history}`);
  }

  step(fen: string, history: string[]): string {
    const step = 'a1';
    Logger.log(`Step: FEN: ${fen} ; Step: ${step}`);

    return step;
  }
}
