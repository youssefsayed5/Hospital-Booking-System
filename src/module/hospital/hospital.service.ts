// modules/hospital/hospital.service.ts
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
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { uploadDir } from '../../common/utils/multer/multer.js';
import type {
  IHospitalListResponse,
  IHospitalResponse,
} from '../../common/interface/hospital.interface.js';

interface IMongoDuplicateError {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

@Injectable()
export class HospitalService {
  private readonly logger = new Logger(HospitalService.name);

  constructor(
    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,
  ) {}

  // ---------- helpers ----------

  private async removeFile(path?: string): Promise<void> {
    if (!path) return;
    try {
      await unlink(path);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete file ${path}: ${String(error)}`);
      }
    }
  }

  private toConflict(error: unknown): ConflictException | null {
    const err = error as IMongoDuplicateError | null;
    if (err?.code !== 11000) return null;
    return new ConflictException(
      err.keyPattern?.email
        ? 'Hospital email is already taken'
        : 'Hospital name is already taken',
    );
  }

  // ---------- public API ----------

  async create(
    dto: CreateHospitalDto,
    _userId: Types.ObjectId,
    file: Express.Multer.File,
  ): Promise<Hospital> {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();

    try {
      const exists = await this.hospitalModel.exists({ name, deletedAt: null });
      if (exists) {
        throw new ConflictException('Hospital name is already taken');
      }

      return await this.hospitalModel.create({
        name,
        email,
        image: file.filename,
      });
    } catch (error: unknown) {
      await this.removeFile(file.path);
      throw this.toConflict(error) ?? error;
    }
  }

  async update(
    id: string,
    dto: UpdateHospitalDto,
    file?: Express.Multer.File,
  ): Promise<IHospitalResponse> {
    if (!isValidObjectId(id)) {
      await this.removeFile(file?.path);
      throw new BadRequestException('Invalid Hospital id');
    }

    const update: Partial<Pick<Hospital, 'name' | 'email' | 'image'>> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.email !== undefined) update.email = dto.email.trim().toLowerCase();
    if (file) update.image = file.filename;

    if (Object.keys(update).length === 0) {
      await this.removeFile(file?.path);
      throw new BadRequestException('Nothing to update');
    }

    try {
      if (update.name !== undefined) {
        const exists = await this.hospitalModel.exists({
          _id: { $ne: id },
          name: update.name,
          deletedAt: null,
        });
        if (exists) {
          throw new ConflictException('Hospital name is already taken');
        }
      }

      if (update.email !== undefined) {
        const exists = await this.hospitalModel.exists({
          _id: { $ne: id },
          email: update.email,
          deletedAt: null,
        });
        if (exists) {
          throw new ConflictException('Hospital email is already taken');
        }
      }

      // new: false يرجّع النسخة القديمة، فنعرف الصورة القديمة من غير استعلام تاني
      const previous = await this.hospitalModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: update },
        { new: false, runValidators: true },
      );
      if (!previous) {
        throw new NotFoundException('Hospital not found');
      }

      if (file && previous.image && previous.image !== file.filename) {
        await this.removeFile(join(uploadDir, previous.image));
      }

      const hospital = { ...previous.toObject(), ...update } as Hospital;
      return { message: 'Hospital updated successfully', hospital };
    } catch (error: unknown) {
      await this.removeFile(file?.path);
      throw this.toConflict(error) ?? error;
    }
  }

  async remove(id: string): Promise<IHospitalResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Hospital id');
    }

    const hospital = await this.hospitalModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return { message: 'Hospital deleted successfully', hospital };
  }

  async findAll(): Promise<IHospitalListResponse> {
    const hospitals = await this.hospitalModel.find({ deletedAt: null });
    return { message: 'Done', hospitals };
  }

  async findById(id: string): Promise<IHospitalResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Hospital id');
    }

    const hospital = await this.hospitalModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return { message: 'Done', hospital };
  }
}
