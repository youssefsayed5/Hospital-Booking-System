export interface IDashboardSummary {
  totalUsers: number;
  totalHospitals: number;
  totalDoctors: number;
  totalAppointments: number;
}

export interface IDashboardAppointmentsQuery {
  from: string;
  to: string;
  status?: string;
}

export interface IDashboardAppointment {
  _id: string;
  user: string;
  hospital: string;
  staff: string;
  date: Date;
  status: string;
}

export interface IDashboardAppointmentsReport {
  totalAppointments: number;
  appointments: IDashboardAppointment[];
}

export interface IDashboardRevenueQuery {
  from: string;
  to: string;
}

export interface IDashboardRevenueReport {
  totalRevenue: number;
  totalPayments: number;
  currency: string;
}
