import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RefreshSessionDocument = RefreshSession & Document;

@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true, type: Date, index: { expires: 0 } })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
