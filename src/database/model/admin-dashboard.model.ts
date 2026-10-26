import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDashboardDocument = HydratedDocument<AdminDashboard>;

@Schema({
  timestamps: true,
  collection: 'admin_dashboards',
})
export class AdminDashboard {
  @Prop({ required: true, default: 0, min: 0 })
  totalUsers: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalHospitals: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalDoctors: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalAppointments: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalRevenue: number;
}

export const AdminDashboardSchema = SchemaFactory.createForClass(AdminDashboard);
