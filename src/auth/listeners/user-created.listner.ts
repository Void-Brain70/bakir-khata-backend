import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MailService } from '../../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../users/entities/user.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../events/user-created';
import { generateOTP } from '../../utils/helper';
import configuration from '../../config/configuration';

@Injectable()
export class UserCreatedListener {
  constructor(
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @OnEvent('user.created')
  async handleOrderCreatedEvent(event: UserCreatedEvent) {
    const user = await this.userModel.findById(event.userId);
    if (!user) {
      console.error('User not found for user created event', event);
      return;
    }
    console.log('user created event', event);
    await this.sendDefaultWelcomeEmail(event);
  }

  private async sendDefaultWelcomeEmail(event: UserCreatedEvent) {
    const otp = generateOTP() as { otp: string; validTill: Date };

    await this.cacheManager.set(`otp:${event.email}`, otp, 3 * 60 * 1000); // Store OTP in cache for 5 minutes

    const subject = 'Welcome to Bakir Khata! Your New Account Details';
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Welcome to Bakir Khata!</h2>

            <p>Hello ${event.name},</p>

            <p>Welcome aboard! Your account with Bakir Khata has been successfully created.</p>

            <p>Please verify your email using the OTP below:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email (Username):</strong> ${event.email}</p>
              <p><strong>OTP:</strong> ${otp.otp}</p>
              <p><strong>Valid Till:</strong> ${otp.validTill.toLocaleString()}</p>
              <p><strong>Web Address:</strong> ${configuration().app.frontendUrl}</p>
            </div>
            
            <p>You can now log in using the details below:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email (Username):</strong> ${event.email}</p>
              <p><strong>Password:</strong> ${event.password}</p>
              <p><strong>Web Address:</strong> ${configuration().app.frontendUrl}</p>
            </div>

            <p>If you have any questions or face any issues, our support team is here to help you.</p>
            <p>Write to us at: <a href="mailto:info@bakirkhata.com"></a></p>

            <p>Thank you for joining Bakir Khata!</p>
            <p><strong>Best Regards,</strong><br>Bakir Khata Team</p>
          </div>
        </body>
      </html>
    `;

    await this.mailService.sendMail(event.email, subject, htmlBody);
    console.log('Default welcome mail sent to:', event.email);
  }
}
