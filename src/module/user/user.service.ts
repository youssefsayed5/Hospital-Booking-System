
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../database/model/user.model.js';
import type { IProfile, IProfileResponse } from '../../common/interface/user-get.interface.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getProfile(id: Types.ObjectId): Promise<IProfileResponse> {
    const user = await this.userModel
      .findById(id)
      .select('-password -phone -__v')
      .lean<IProfile>();

    if (!user) throw new NotFoundException('User not found');

    return { message: 'Done', results: user };
  }
}
