import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import type { IDepartment } from '../../common/interface/Department.interface.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Department implements IDepartment {
  @Prop({
    type: String,
    required: [true, 'Department name is required'],
    minlength: [3, 'Department name must be at least 3 characters'],
    maxlength: [50, 'Department name must be at most 50 characters'],
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: [true, 'Department image is required'],
    trim: true,
  })
  image!: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Hospital' }],
    required: [true, 'Hospital is required'],
    validate: {
      validator: (value: Types.ObjectId[]) =>
        Array.isArray(value) && value.length > 0,
      message: 'Department must belong to at least one hospital',
    },
  })
  hospital!: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type DepartmentDocument = HydratedDocument<Department>;
export const DepartmentModel = SchemaFactory.createForClass(Department);

DepartmentModel.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $type: 'null' } },
  },
);


DepartmentModel.index({ hospital: 1, deletedAt: 1 });
