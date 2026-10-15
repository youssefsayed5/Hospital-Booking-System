import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { Ihospital } from '../../common/interface/hospital.interface.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Hospital implements Ihospital {
  @Prop({
    type: String,
    required: [true, 'hospital name is required'],
    minlength: [3, 'hospital name must be at least 3 characters'],
    maxlength: [50, 'hospital name must be at most 50 characters'],
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  })
  email!: string;

  @Prop({
    type: String,
    required: [true, 'hospital image is required'],
    trim: true,
  })
  image!: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type HospitalDocument = HydratedDocument<Hospital>;
export const HospitalModel = SchemaFactory.createForClass(Hospital);

// unique بين المستشفيات غير المحذوفة بس
HospitalModel.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
HospitalModel.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
