import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BeeModule } from 'src/bee/bee.module';
import { SepatreeModule } from '../sepatree/sepatree.module';
import { ChessTreeController } from './chess-tree.controller';
import { ChessTreeService } from './chess-tree.service';

@Module({
  imports: [SepatreeModule, ConfigModule, BeeModule],
  controllers: [ChessTreeController],
  providers: [ChessTreeService],
  exports: [ChessTreeService],
})
export class ChessTreeModule {}
