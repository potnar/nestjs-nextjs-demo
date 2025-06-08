import { Module } from '@nestjs/common';
import { FilesystemController } from './filesystem.controller';
import { FilesystemService } from './filesystem.service';

@Module({
  controllers: [FilesystemController],
  providers: [FilesystemService]
})
export class FilesystemModule {}
