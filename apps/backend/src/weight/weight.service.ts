import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeightEntry } from '@prisma/client';

@Injectable()
export class WeightService {
  constructor(private prisma: PrismaService) {}

  findAll(): Promise<WeightEntry[]> {
    return this.prisma.weightEntry.findMany({ orderBy: { date: 'asc' } });
  }

  create(date: string, weight: number): Promise<WeightEntry> {
    return this.prisma.weightEntry.create({
      data: {
        date: new Date(date),
        weight,
      },
    });
  }
}
