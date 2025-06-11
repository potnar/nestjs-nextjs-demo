// utils/sample-tree.ts
import { FileNode } from "@/components/FolderTree";

export function generateSampleTree(): FileNode {
  return {
    name: "root",
    type: "directory",
    children: [
      { name: "file1.txt", type: "file" },
      {
        name: "src",
        type: "directory",
        children: [
          { name: "index.ts", type: "file" },
          {
            name: "components",
            type: "directory",
            children: [
              { name: "Button.tsx", type: "file" },
              { name: "Modal.tsx", type: "file" },
            ],
          },
        ],
      },
    ],
  };
}
