import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

@Injectable()
export class FilesystemService {
  getStructure(basePath: string): FileNode {
    const stats = fs.statSync(basePath);
    const info: FileNode = {
      name: path.basename(basePath),
      type: stats.isDirectory() ? 'directory' : 'file',
    };

    if (stats.isDirectory()) {
      info.children = fs
        .readdirSync(basePath)
        .map((child) => this.getStructure(path.join(basePath, child)));
    }

    return info;
  }

  saveStructureToFile(basePath: string, outputPath: string): void {
    const structure = this.getStructure(basePath);
    fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2), 'utf-8');
  }
}
