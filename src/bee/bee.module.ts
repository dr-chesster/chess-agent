import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BeeService } from './bee.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [BeeService],
  exports: [BeeService],
})
export class BeeModule {}
