import { Body, Controller, Post } from '@nestjs/common';
import { ChessTreeService } from './chess-tree.service';
import { ChessStateDto } from './interfaces/chess-state.dto';

@Controller()
export class ChessTreeController {
  constructor(private readonly chessTreeService: ChessTreeService) {}

  @Post('check-mate')
  async checkMate(@Body() chessStateDto: ChessStateDto): Promise<void> {
    const { fen, history } = chessStateDto;

    await this.chessTreeService.updateTree(fen, history);
  }

  @Post('step')
  async step(@Body() chessStateDto: ChessStateDto): Promise<string> {
    const { fen, history } = chessStateDto;

    return this.chessTreeService.step(fen, history);
  }
}
