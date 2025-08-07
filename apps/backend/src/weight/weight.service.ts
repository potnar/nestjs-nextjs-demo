import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeightEntry } from '@prisma/client';

@Injectable()
export class WeightService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<WeightEntry[]> {
    return this.prisma.weightEntry.findMany({ orderBy: { date: 'asc' } });
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{
    data: WeightEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await Promise.all([
      this.prisma.weightEntry.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.weightEntry.count(),
    ]);

    return { data, total, page, limit };
  }

  create(id: string, date: string, weight: number): Promise<WeightEntry> {
    return this.prisma.weightEntry.create({
      data: {
        id,
        date: new Date(date),
        weight,
      },
    });
  }

  remove(id: string): Promise<WeightEntry> {
    return this.prisma.weightEntry.delete({
      where: { id },
    });
  }
}
