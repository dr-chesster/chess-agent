import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChessTreeModule } from '../chess-tree/chess-tree.module';
import { AppService } from './app.service';

@Module({
  imports: [ChessTreeModule, ConfigModule.forRoot()],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
