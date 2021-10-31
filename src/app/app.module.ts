import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChessTreeModule } from '../chess-tree/chess-tree.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ChessTreeModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
