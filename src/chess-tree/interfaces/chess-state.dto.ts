import { ApiProperty } from '@nestjs/swagger';

export class ChessStateDto {
  @ApiProperty({ example: ['e4', 'a5', 'Bc4', 'b6', 'Qf3', 'Na6', 'Qxf7#'] })
  history: string[];
}

export class ChessStepDto extends ChessStateDto {
  @ApiProperty({
    example: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1',
  })
  fen: string;

  @ApiProperty({ example: ['e4', 'a5', 'Bc4', 'b6', 'Qf3', 'Na6', 'Qxf7#'] })
  history: string[];
}

export type Perpetrator = 'ai' | 'agent';

export class ChessStep {
  @ApiProperty({ example: 'a5' })
  step: string;

  @ApiProperty({ example: 'agent', enum: ['ai', 'agent'] })
  perpetrator: Perpetrator;
}
