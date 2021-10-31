import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BeeModule } from '../bee/bee.module';
import { SepatreeService } from './sepatree.service';

@Module({
  imports: [BeeModule, ConfigModule],
  controllers: [],
  providers: [SepatreeService],
  exports: [SepatreeService],
})
export class SepatreeModule {}
