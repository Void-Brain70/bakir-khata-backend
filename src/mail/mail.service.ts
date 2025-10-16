import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import configuration from '../config/configuration';
import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    const transportOptions: SMTPTransport.Options = {
      host: this.configService.get<string>('mail.host') ?? 'smtp.example.com',
      port: parseInt(this.configService.get<string>('mail.port') ?? '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }
  async sendMail(to: string, subject: string, html: string) {
    const mailOptions = {
      from: configuration().app.name,
      to: to,
      subject: subject,
      html: html,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendOtpMail(
    name: any,
    to: string,
    otp: { otp: string; validTill: Date },
  ) {
    const fs = await import('fs/promises');
    // Load and parse the template
    const templatePath = 'src/mail/templates/otp-mail.html';
    const template = await fs.readFile(templatePath, 'utf-8');
    const parsedTemplate = template
      .replace('{{otp}}', otp.otp)
      .replace('{{validTill}}', otp.validTill.toLocaleString());
    // Mail options
    const mailOptions = {
      from: configuration().app.name,
      to: to,
      subject: `Welcome ${name}, Your Verification Code is Here!`,
      html: parsedTemplate,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${configuration().app.frontendUrl}/reset-password?token=${token}`;
    const fs = await import('fs/promises');
    // Load and parse the template
    const templatePath = 'src/mail/templates/reset-mail.html';
    const template = await fs.readFile(templatePath, 'utf-8');
    const parsedTemplate = template.replace('{{resetLink}}', resetLink);
    const mailOptions = {
      from: configuration().app.name,
      to: to,
      subject: 'Password Reset Request',
      html: parsedTemplate,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendCustomEmail(
    to: string,
    subject: string,
    actionBtnText: string,
    actionBtnLink: string,
    body: string,
  ): Promise<void> {
    const fs = await import('fs/promises');
    const templatePath = 'src/mail/templates/custom-mail.html';
    const template = await fs.readFile(templatePath, 'utf-8');
    const parsedTemplate = template
      .replace(/\{\{subject\}\}/g, subject)
      .replace(/\{\{actionBtnText\}\}/g, actionBtnText)
      .replace(/\{\{actionBtnLink\}\}/g, actionBtnLink)
      .replace(/\{\{body\}\}/g, body);

    const mailOptions = {
      from: configuration().app.name,
      to,
      subject,
      html: parsedTemplate,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
