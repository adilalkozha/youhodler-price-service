import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitmqModule],
  controllers: [StatusController],
})
export class StatusModule {}