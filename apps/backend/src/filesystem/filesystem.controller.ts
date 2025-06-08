import { Controller, Get, Query } from '@nestjs/common';
import { FilesystemService } from './filesystem.service';

@Controller('filesystem')
export class FilesystemController {
  constructor(private readonly fsService: FilesystemService) {}

  @Get()
  getStructure(@Query('path') path: string = 'src') {
    return this.fsService.getStructure(path);
  }
}
