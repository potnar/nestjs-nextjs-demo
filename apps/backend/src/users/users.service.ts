import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    if (!id) {
      throw new NotFoundException('User ID is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(id: string, dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        id,
        name: dto.name,
        email: dto.email,
      },
    }) as Promise<User>;
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
