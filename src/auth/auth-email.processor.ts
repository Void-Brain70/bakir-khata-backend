import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

interface ResetPasswordJobData {
  email: string;
  resetToken: string;
}

@Processor('bakir-khata-auth-email', { concurrency: 10 })
export class AuthEmailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  private readonly logger = new Logger(AuthEmailProcessor.name);

  async process(job: Job) {
    // Log job details
    this.logger.log(`Processing job ${job.id} in queue ${job.queueName}`);
    switch (job.name) {
      case 'send-otp-email': {
        const { name, email, otp } = job.data as {
          name: string;
          email: string;
          otp: { otp: string; validTill: Date };
        };
        try {
          await this.mailService.sendOtpMail(name, email, otp);
          console.log(`OTP email sent to ${email}`);
        } catch (error) {
          console.error(`Failed to send OTP email to ${email}:`, error);
          throw error; // Re-throw the error to mark the job as failed
        }
        break;
      }
      case 'send-reset-email': {
        const { email, resetToken } = job.data as ResetPasswordJobData;
        try {
          await this.mailService.sendPasswordResetEmail(email, resetToken);
          console.log(`Reset password email sent to ${email}`);
        } catch (error) {
          console.error(
            `Failed to send reset password email to ${email}:`,
            error,
          );
          throw error; // Re-throw the error to mark the job as failed
        }
        break;
      }
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Job ${job.id} is active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} is completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.log(`Job ${job.id} has failed with ${error.message}`);
  }
}
