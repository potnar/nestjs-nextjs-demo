import { Test, TestingModule } from '@nestjs/testing';
import { FilesystemController } from './filesystem.controller';

describe('FilesystemController', () => {
  let controller: FilesystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesystemController],
    }).compile();

    controller = module.get<FilesystemController>(FilesystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
