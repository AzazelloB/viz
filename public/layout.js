export const CARD_WIDTH = 248;
export const CARD_HEIGHT = 80;
export const ROW_HEIGHT = 148;
const SIBLING_GAP = 28;
const BRANCH_GAP = 120;

// Merge subtree contours so neighboring branches share unused space while
// retaining node order. Each parent is centered over its outermost children.
export function layoutTree(root, collapsed = new Set()) {
  function arrange(node, depth, parent) {
    const current = { ...node, depth, parent, x: 0, y: depth * ROW_HEIGHT };
    const children = collapsed.has(node.id) ? [] : (node.children || []);
    if (!children.length) return { nodes: [current], left: [0], right: [0] };
    const groups = [];
    let left = [], right = [];
    children.forEach(child => {
      const group = arrange(child, depth + 1, node.id);
      let offset = 0;
      for (let d = 0; d < group.left.length; d++) {
        // Children of one parent stay close; descendants of different parents
        // need a wider boundary so their groups remain visually distinct. More
        // distant common ancestors get more space between their subtrees.
        const gap = d === 0 ? SIBLING_GAP : BRANCH_GAP + (d - 1) * 48;
        if (right[d] !== undefined) offset = Math.max(offset, right[d] - group.left[d] + CARD_WIDTH + gap);
      }
      for (const item of group.nodes) item.x += offset;
      for (let d = 0; d < group.left.length; d++) {
        left[d] = Math.min(left[d] ?? Infinity, group.left[d] + offset);
        right[d] = Math.max(right[d] ?? -Infinity, group.right[d] + offset);
      }
      groups.push(group);
    });
    const center = (groups[0].nodes[0].x + groups.at(-1).nodes[0].x) / 2;
    const descendants = groups.flatMap(group => group.nodes);
    for (const item of descendants) item.x -= center;
    return { nodes: [current, ...descendants], left: [0, ...left.map(x => x - center)], right: [0, ...right.map(x => x - center)] };
  }
  const { nodes } = arrange(root, 0, null);
  const minX = Math.min(...nodes.map(node => node.x));
  for (const node of nodes) node.x -= minX;
  return { nodes, width: Math.max(...nodes.map(node => node.x)) + CARD_WIDTH, height: Math.max(...nodes.map(node => node.y)) + CARD_HEIGHT };
}
