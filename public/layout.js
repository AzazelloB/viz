const ROOT_WIDTH = 360;
const ROOT_HEIGHT = 104;

// Use the complete tree so collapsing a branch never changes anyone's size.
// Crowding can tighten the usual 76% step, but never below 65% of the parent.
// The lower bound keeps deep trees usable with zoom.
export function measureTree(root) {
  const counts = [], depths = new Map();
  function visit(node, depth) {
    depths.set(node.id, depth);
    counts[depth] = (counts[depth] || 0) + 1;
    (node.children || []).forEach(child => visit(child, depth + 1));
  }
  visit(root, 0);
  let relative = 1;
  const sizes = counts.map((count, depth) => {
    if (depth) relative = Math.max(relative * .65, Math.min(relative * .76, count ** -.35));
    return .02 + .98 * relative;
  });
  return new Map([...depths].map(([id, depth]) => {
    const size = sizes[depth];
    return [id, { depth, size, width: ROOT_WIDTH * size, height: ROOT_HEIGHT * size }];
  }));
}

// Merge subtree contours so neighboring branches share unused space while
// retaining node order. Each parent is centered over its outermost children.
export function layoutTree(root, collapsed = new Set(), metrics = measureTree(root)) {
  const levelSizes = [];
  for (const metric of metrics.values()) levelSizes[metric.depth] = metric.size;
  const rootDepth = metrics.get(root.id).depth;
  function arrange(node, depth, parent, y) {
    const current = { ...node, ...metrics.get(node.id), depth, parent, x: 0, y };
    const children = collapsed.has(node.id) ? [] : (node.children || []);
    if (!children.length) return { nodes: [current], left: [-current.width / 2], right: [current.width / 2] };
    const groups = [];
    let left = [], right = [];
    children.forEach(child => {
      const group = arrange(child, depth + 1, node.id, y + current.height + 96 * Math.sqrt(current.size));
      let offset = 0;
      for (let d = 0; d < group.left.length; d++) {
        // Children of one parent stay close; descendants of different parents
        // need a wider boundary so their groups remain visually distinct. More
        // distant common ancestors get more space between their subtrees.
        const gap = (d === 0 ? 40 : 140 + (d - 1) * 56) * levelSizes[rootDepth + depth + 1 + d];
        if (right[d] !== undefined) offset = Math.max(offset, right[d] - group.left[d] + gap);
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
    return { nodes: [current, ...descendants], left: [-current.width / 2, ...left.map(x => x - center)], right: [current.width / 2, ...right.map(x => x - center)] };
  }
  const { nodes } = arrange(root, 0, null, 0);
  const minX = Math.min(...nodes.map(node => node.x - node.width / 2));
  for (const node of nodes) node.x -= minX + node.width / 2;
  return { nodes, width: Math.max(...nodes.map(node => node.x + node.width)), height: Math.max(...nodes.map(node => node.y + node.height)) };
}
