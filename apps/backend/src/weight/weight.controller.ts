import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WeightService } from './weight.service';
import { WeightEntry } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Define WeightPaginatedResult type
type WeightPaginatedResult = {
  data: WeightEntry[];
  total: number;
  page: number;
  limit: number;
};

@Controller('weight')
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<WeightPaginatedResult> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    return this.weightService.findAllPaginated(pageNum, limitNum);
  }

  @Get('all')
  findAllNoPagination(): Promise<WeightEntry[]> {
    return this.weightService.findAll(); // metoda, którą już masz
  }

  @Post()
  async create(
    @Body() body: { date: string; weight: number },
  ): Promise<WeightEntry> {
    const id = `waga-${uuidv4()}`;
    return this.weightService.create(id, body.date, body.weight);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weightService.remove(id);
  }
}
