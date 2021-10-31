import { ApiProperty } from '@nestjs/swagger';

export class ChessStateDto {
  @ApiProperty({
    example: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1',
  })
  fen: string;

  @ApiProperty({ example: ['e5', 'f4'] })
  history: string[];
}
