import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Staff } from '../../database/model/staff.model.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { Department } from '../../database/model/department.model.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffPasswordDto } from './dto/password-update.dto.js';
import { compareWord, hashWord } from '../../common/security/HashWord.js';
import { StaffType } from '../../common/enum/Staff.enum.js';
import type {
  IStaffCreateResponse,
  IStaffMessageResponse,
  IStaffRemoveResponse,
  IStaffUpdateResponse,
} from '../../common/interface/staff.interface.js';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<Staff>,

    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,

    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  // ---------- helpers ----------

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    );
  }

  private assertId(id: string, label: string): void {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  // ---------- public API ----------

  async create(dto: CreateStaffDto): Promise<IStaffCreateResponse> {
    const { name, phone, type, hospital, department, password } = dto;
    const email = dto.email.toLowerCase();

    this.assertId(String(hospital), 'hospital');
    if (department !== undefined) {
      this.assertId(department, 'department');
    }

    if (await this.staffModel.exists({ email })) {
      throw new ConflictException('Email is already taken');
    }

    if (
      !(await this.hospitalModel.exists({ _id: hospital, deletedAt: null }))
    ) {
      throw new NotFoundException('Hospital is not found');
    }

    if (department !== undefined) {
      const departmentExists = await this.departmentModel.exists({
        _id: department,
        hospital: new Types.ObjectId(String(hospital)),
        deletedAt: null,
      });
      if (!departmentExists) {
        throw new NotFoundException('Department is not found in this hospital');
      }
    }

    try {
      const createAccount = await this.staffModel.create({
        name,
        email,
        password: await hashWord(password),
        phone,
        type,
        hospital,
        department,
      });
      createAccount.set('password', undefined);

      return { message: 'done', createAccount };
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email is already taken');
      }
      throw error;
    }
  }

  async findAllStaff(): Promise<Staff[]> {
    return this.staffModel.find({ deletedAt: null }).select('-password');
  }

  async findStaffById(id: string): Promise<Staff> {
    this.assertId(id, 'staff');

    const found = await this.staffModel
      .findOne({ _id: id, deletedAt: null })
      .select('-password');
    if (!found) throw new NotFoundException('Staff is not found');

    return found;
  }

  async findDoctor(): Promise<Staff[]> {
    return this.staffModel
      .find({ type: StaffType.DOCTOR, deletedAt: null })
      .select('name image type hospital department');
  }

  async findDoctorById(id: string): Promise<Staff> {
    this.assertId(id, 'doctor');

    const found = await this.staffModel
      .findOne({ _id: id, type: StaffType.DOCTOR, deletedAt: null })
      .select('name image type hospital department')
    if (!found) throw new NotFoundException('Doctor is not found');

    return found;
  }

  async remove(id: string): Promise<IStaffRemoveResponse> {
    this.assertId(id, 'staff');

    const removed = await this.staffModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!removed) throw new NotFoundException('Staff is not found');

    return {
      message: 'Staff removed successfully',
      removedStaff: {
        _id: removed._id,
        name: removed.name,
        email: removed.email,
      },
    };
  }

  async updateData(
    id: string,
    dto: UpdateStaffDto,
  ): Promise<IStaffUpdateResponse> {
    this.assertId(id, 'staff');

    const update: Partial<Pick<Staff, 'name' | 'phone' | 'email'>> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.phone !== undefined) update.phone = dto.phone;
    if (dto.email !== undefined) update.email = dto.email.toLowerCase();

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    if (update.email !== undefined) {
      const taken = await this.staffModel.exists({
        email: update.email,
        _id: { $ne: id },
      });
      if (taken) throw new ConflictException('Email is already taken');
    }

    try {
      const updatedStaff = await this.staffModel
        .findOneAndUpdate(
          { _id: id, deletedAt: null },
          { $set: update },
          { new: true, runValidators: true },
        )
        .select('-password');
      if (!updatedStaff) throw new NotFoundException('Staff is not found');

      return { message: 'Staff updated successfully', updatedStaff };
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email is already taken');
      }
      throw error;
    }
  }

  async updatePassword(
    staffId: Types.ObjectId,
    dto: UpdateStaffPasswordDto,
  ): Promise<IStaffMessageResponse> {
    const staff = await this.staffModel
      .findOne({ _id: staffId, deletedAt: null })
      .select('+password');
    if (!staff) throw new UnauthorizedException('Staff not found');

    // compareWord(plain, hash) — نفس ترتيب AuthService.login
    const matches = await compareWord(dto.oldPassword, staff.password);
    if (!matches) throw new UnauthorizedException('Old password is incorrect');

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different');
    }

    staff.password = await hashWord(dto.newPassword);
    await staff.save();

    return { message: 'Password updated successfully' };
  }
}
