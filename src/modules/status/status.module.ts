import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { WorkerModule } from '../worker/worker.module';

@Module({
  imports: [WorkerModule],
  controllers: [StatusController],
})
export class StatusModule {}