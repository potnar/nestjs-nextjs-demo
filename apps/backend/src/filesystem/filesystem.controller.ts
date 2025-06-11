import { Controller, Get } from '@nestjs/common';
import { FileNode, FilesystemService } from './filesystem.service';
import { generateRandomStructure } from './structure.generator';
import * as path from 'path';
import * as fs from 'fs';

@Controller('filesystem')
export class FilesystemController {
  constructor(private readonly fsService: FilesystemService) {}

  @Get('save')
  saveStructure(): string {
    const outputPath = path.join(process.cwd(), 'structure.json');
    const structure = this.generateRandomStructure(4, 5);
    fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2), 'utf-8');

    return `Zapisano losową strukturę folderów do pliku: ${outputPath}`;
  }

  @Get('random')
  getRandomStructure(): FileNode {
    return generateRandomStructure(4, 5);
  }

  private generateRandomStructure(depth = 3, maxChildren = 4): FileNode {
    const randomName = () => Math.random().toString(36).substring(2, 7);
    const getRandomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const createNode = (level: number): FileNode => {
      const isDirectory = level < depth && Math.random() > 0.3;

      const node: FileNode = {
        name: (isDirectory ? 'folder-' : 'file-') + randomName(),
        type: isDirectory ? 'directory' : 'file',
      };

      if (isDirectory) {
        const childrenCount = getRandomInt(1, maxChildren);
        node.children = Array.from({ length: childrenCount }).map(() =>
          createNode(level + 1),
        );
      }

      return node;
    };

    return createNode(0);
  }
}
