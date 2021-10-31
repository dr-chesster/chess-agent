import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SepatreeModule } from '../sepatree/sepatree.module';
import { ChessTreeService } from './chess-tree.service';

@Module({
  imports: [SepatreeModule, ConfigModule],
  controllers: [],
  providers: [ChessTreeService],
  exports: [ChessTreeService],
})
export class ChessTreeModule {}
