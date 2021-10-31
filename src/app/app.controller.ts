import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ChessStateDto } from './interfaces/chess-state.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('check-mate')
  checkMate(@Body() chessStateDto: ChessStateDto): void {
    const { fen, history } = chessStateDto;

    this.appService.checkMate(fen, history);
  }

  @Post('step')
  step(@Body() chessStateDto: ChessStateDto): string {
    const { fen, history } = chessStateDto;

    return this.appService.step(fen, history);
  }
}
