// modules/department/department.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { Department } from '../../database/model/department.model.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { uploadDir } from '../../common/utils/multer/multer.js';
import type {
  IDepartmentListResponse,
  IDepartmentResponse,
} from '../../common/interface/Department.interface.js';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(
    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,

    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  // ---------- helpers ----------

  private async removeFile(path?: string): Promise<void> {
    if (!path) return;
    try {
      await unlink(path);
    } catch (error: unknown) {
      this.logger.warn(`Failed to delete file ${path}: ${String(error)}`);
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    );
  }

  // ---------- public API ----------

  async create(
    dto: CreateDepartmentDto,
    _userId: Types.ObjectId,
    file: Express.Multer.File,
  ): Promise<Department> {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const { name, hospital } = dto;

    try {
      if (!isValidObjectId(hospital)) {
        throw new BadRequestException('Invalid hospital id');
      }

      const exists = await this.departmentModel.exists({
        name,
        deletedAt: null,
      });
      if (exists) {
        throw new ConflictException('Department name is already taken');
      }

      const hospitalExists = await this.hospitalModel.exists({
        _id: hospital,
        deletedAt: null,
      });
      if (!hospitalExists) {
        throw new NotFoundException('Hospital not found');
      }

      return await this.departmentModel.create({
        name,
        image: file.filename,
        hospital: [new Types.ObjectId(hospital)],
      });
    } catch (error: unknown) {
      await this.removeFile(file.path);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Department name is already taken');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateDepartmentDto,
    file?: Express.Multer.File,
  ): Promise<Department> {
    if (!isValidObjectId(id)) {
      await this.removeFile(file?.path);
      throw new BadRequestException('Invalid Department id');
    }

    const update: Partial<Pick<Department, 'name' | 'image'>> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (file) update.image = file.filename;

    if (Object.keys(update).length === 0) {
      await this.removeFile(file?.path);
      throw new BadRequestException('Nothing to update');
    }

    try {
      if (dto.name !== undefined) {
        const exists = await this.departmentModel.exists({
          _id: { $ne: id },
          name: dto.name,
          deletedAt: null,
        });
        if (exists) {
          throw new ConflictException('Department name is already taken');
        }
      }

      // new: false يرجّع النسخة القديمة، فنعرف الصورة القديمة من غير استعلام تاني
      const previous = await this.departmentModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: update },
        { new: false, runValidators: true },
      );
      if (!previous) {
        throw new NotFoundException('Department not found');
      }

      if (file && previous.image) {
        await this.removeFile(join(uploadDir, previous.image));
      }

      return { ...previous.toObject(), ...update } as Department;
    } catch (error: unknown) {
      await this.removeFile(file?.path);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Department name is already taken');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<IDepartmentResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Department id');
    }

    const department = await this.departmentModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return { message: 'Done', department };
  }

  async findAll(): Promise<IDepartmentListResponse> {
    const departments = await this.departmentModel.find({ deletedAt: null });
    return { message: 'Done', departments };
  }

  async findById(id: string): Promise<IDepartmentResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Department id');
    }

    const department = await this.departmentModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return { message: 'Done', department };
  }
}
