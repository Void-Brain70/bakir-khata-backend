import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@QueueEventsListener('bakir-khata-auth-email')
export class AuthEmailQueueEvents extends QueueEventsHost {
  private readonly logger = new Logger(AuthEmailQueueEvents.name);

  @OnQueueEvent('added')
  onAdded(job: { jobId: string; name: string }) {
    this.logger.log(
      `Job ${job.jobId} has been added to the queue from ${job.name}`,
    );
  }

  @OnQueueEvent('completed')
  onCompleted(event: { jobId: string; returnvalue: any }) {
    this.logger.log(`email sent successfully for job ${event.jobId}`);
  }

  @OnQueueEvent('failed')
  onFailed(event: { jobId: string; failedReason: string }) {
    this.logger.error(
      `Failed to send reset password email for job ${event.jobId}: ${event.failedReason}`,
    );
  }
}
