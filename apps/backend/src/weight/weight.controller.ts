import { Body, Controller, Get, Post } from '@nestjs/common';
import { WeightService } from './weight.service';
import { WeightEntry } from '@prisma/client';

@Controller('weight')
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Get()
  findAll(): Promise<WeightEntry[]> {
    return this.weightService.findAll();
  }

  @Post()
  create(@Body() body: { date: string; weight: number }): Promise<WeightEntry> {
    return this.weightService.create(body.date, body.weight);
  }
}
