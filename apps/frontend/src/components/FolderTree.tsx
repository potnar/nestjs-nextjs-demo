export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

export function FolderTree({ node }: { node: FileNode }) {
    return (
        <ul className="pl-4 list-disc">
            <li>
                {node.type === 'directory' ? '📁' : '📄'} {node.name}
                {node.children && node.children.length > 0 && (
                    <ul className="pl-4">
                        {node.children.map((child, idx) => (
                            <FolderTree key={idx} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        </ul>
    );
}
