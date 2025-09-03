import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: null })
  phone?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false, default: null })
  emailVerifiedAt?: Date;

  @Prop({ required: false, default: null })
  phoneVerifiedAt?: Date;

  @Prop({ required: false, default: null })
  avatar?: string;

  @Prop({ required: false, default: null })
  address?: string;

  @Prop({ required: false, default: false })
  isSuperAdmin?: boolean;

  @Prop({ required: false, default: null })
  fcmToken?: string;

  @Prop({ required: false, default: null })
  lastLogin?: Date;

  @Prop({ required: true, default: 'user' })
  type: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(aggregatePaginate);
