import { FileNode } from './filesystem.service';

const randomName = () => Math.random().toString(36).substring(2, 7);

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateRandomStructure(depth = 3, maxChildren = 4): FileNode {
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
