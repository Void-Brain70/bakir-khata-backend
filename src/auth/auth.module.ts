import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import { ResetToken, ResetTokenSchema } from './entities/reset-token.schema';
import { MailService } from '../mail/mail.service';
import { UserCreatedListener } from './listeners/user-created.listner';
import { AuthEmailProcessor } from './auth-email.processor';
import { AuthEmailQueueEvents } from './auth-email.events';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ResetToken.name, schema: ResetTokenSchema },
    ]),
    BullModule.registerQueue({
      name: 'bakir-khata-auth-email',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    UserCreatedListener,
    AuthEmailProcessor,
    AuthEmailQueueEvents,
  ],
})
export class AuthModule {}
