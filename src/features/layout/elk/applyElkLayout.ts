import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode } from "elkjs/lib/elk-api";

const elk = new ELK();

export async function applyElkLayout(graph: ElkNode): Promise<ElkNode> {
  return elk.layout(graph);
}

export function collectElkNodePositions(root: ElkNode): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();

  function walk(node: ElkNode): void {
    if (node.id && node.id !== "root" && node.x != null && node.y != null) {
      map.set(node.id, { x: node.x, y: node.y });
    }
    for (const child of node.children ?? []) {
      walk(child);
    }
  }

  walk(root);
  return map;
}
