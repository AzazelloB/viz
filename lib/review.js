import { validateTree } from './tree.js';

const labelKey = label => label.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();

/** Observable review prompts, not a judgment of conceptual correctness. No I/O or mutation. */
export function reviewTree(input) {
  const tree = validateTree(input);
  const entries = [], branches = new Map(), signatures = new Map();
  const findings = [];
  let maxDepth = 0, maxChildren = 0;

  const reference = entry => ({ id: entry.node.id, path: entry.path });
  const add = (code, observation, question, occurrences) => findings.push({
    code, observation, question, occurrences: occurrences.map(reference),
  });

  function visit(node, ancestors) {
    const entry = { node, key: labelKey(node.label), ancestors,
      path: [...ancestors.map(parent => parent.node.label), node.label].join(' > ') };
    entries.push(entry);
    maxDepth = Math.max(maxDepth, ancestors.length + 1);
    maxChildren = Math.max(maxChildren, node.children.length);
    const repeatedAncestor = ancestors.findLast(parent => parent.key === entry.key);
    if (repeatedAncestor) add('ancestor-label', 'A label repeats along its own ancestor path.',
      'Does this express useful membership or context, or has the relationship reversed or changed scope?',
      [repeatedAncestor, entry]);

    const children = node.children.map(child => visit(child, [...ancestors, entry]));
    const siblingLabels = new Map();
    for (const child of children) {
      const group = siblingLabels.get(child.key) || [];
      group.push(child); siblingLabels.set(child.key, group);
    }
    for (const group of siblingLabels.values()) if (group.length > 1) {
      add('sibling-label', 'Sibling labels match after case, Unicode, and whitespace normalization.',
        'Are these intentional distinct instances, or do their labels conceal a distinction or repeat one concept?', group);
    }

    // Intern child signatures as integers: recursive string escaping would grow exponentially.
    const shape = JSON.stringify([entry.key, children.map(child => child.signature)]);
    if (!signatures.has(shape)) signatures.set(shape, signatures.size);
    entry.signature = signatures.get(shape);
    entry.size = 1 + children.reduce((total, child) => total + child.size, 0);
    if (entry.size >= 3) {
      const group = branches.get(entry.signature) || [];
      group.push(entry); branches.set(entry.signature, group);
    }
    return entry;
  }
  visit(tree.root, []);

  const covered = new Set();
  const repeated = [...branches.values()].filter(group => group.length > 1)
    .sort((a, b) => b[0].size - a[0].size || a[0].path.localeCompare(b[0].path));
  for (const group of repeated) {
    const uncovered = group.filter(entry => !entry.ancestors.some(parent => covered.has(parent.node.id)));
    if (!uncovered.length) continue;
    add('matching-branch', `Branches repeat the same ordered normalized labels and structure (${group[0].size} nodes each).`,
      'Is this useful shared structure in distinct contexts, or duplicate inventories that should be understood together?', group);
    for (const entry of group) covered.add(entry.node.id);
  }

  return {
    stats: { nodes: entries.length, levels: maxDepth, maxChildren },
    findings,
  };
}
