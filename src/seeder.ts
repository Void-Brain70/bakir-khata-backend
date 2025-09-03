import { seeder } from 'nestjs-seeder';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from './users/entities/user.entity';
import { UserSeeder } from './users/seeder/user.seeder';

dotenv.config();
seeder({
  imports: [
    MongooseModule.forRoot(
      process.env.DB_URI ?? 'mongodb://localhost:27017/bakir-Khata',
    ),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
}).run([UserSeeder]);
