import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ChessTreeService } from './chess-tree.service';
import {
  ChessStateDto,
  ChessStep,
  ChessStepDto,
} from './interfaces/chess-state.dto';

@Controller()
export class ChessTreeController {
  constructor(private readonly chessTreeService: ChessTreeService) {}

  @Post('game-end')
  async gameEnd(@Body() chessStateDto: ChessStateDto): Promise<void> {
    const { history } = chessStateDto;

    await this.chessTreeService.updateTree(history);
  }

  @Post('step')
  @ApiResponse({ status: 201, type: ChessStep })
  async step(@Body() chessStateDto: ChessStepDto): Promise<ChessStep> {
    Logger.log(`chess dto ${Object.keys(chessStateDto)}`);
    const { fen, history } = chessStateDto;
    Logger.log(`Step Request: incoming fen ${fen} ; history: ${history}`);

    return this.chessTreeService.step(fen, history);
  }
}
