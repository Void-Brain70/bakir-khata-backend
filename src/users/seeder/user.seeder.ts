import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder implements Seeder {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async seed(): Promise<any> {
    const existingAdmin = await this.userModel.findOne({
      email: 'admin@example.com',
    });
    if (!existingAdmin) {
      const superAdmin = new this.userModel({
        name: 'Super Admin',
        email: 'admin@example.com',
        phone: '01500000000',
        password: await bcrypt.hash('123456', 10),
        isSuperAdmin: true,
        type: 'super_admin',
      });
      await superAdmin.save();
    }
    const users = Array.from({ length: 50 }).map((_, i) => ({
      name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `01500000${String(100 + i).slice(-3)}`,
      password: bcrypt.hashSync('123456', 10),
      type: 'user',
    }));

    return this.userModel.insertMany(users);
  }

  async drop(): Promise<any> {
    return this.userModel.deleteMany({});
  }
}
