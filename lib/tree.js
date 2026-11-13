/** Validate and normalize a nested tree without mutating the input. */
export function validateTree(input) {
  const ids = new Set();
  let count = 0, generated = 0;
  function text(value, name, max, required = false) {
    if (value === undefined && !required) return undefined;
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
      throw new TypeError(`${name} must be ${required ? 'a non-empty' : 'a'} string of at most ${max} characters.`);
    }
    return value.trim();
  }
  function object(value, name, fields) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object.`);
    const unknown = Object.keys(value).find(key => !fields.includes(key));
    if (unknown) throw new TypeError(`Unknown field: ${name}.${unknown}`);
  }
  object(input, 'tree', ['title', 'root']);
  function reserve(node, depth) {
    if (depth > 40) throw new TypeError('Trees may have at most 40 levels.');
    if (++count > 2000) throw new TypeError('Trees may have at most 2000 nodes.');
    object(node, 'node', ['id', 'label', 'children']);
    if (node.id !== undefined) {
      const id = text(node.id, 'node.id', 100, true);
      if (ids.has(id)) throw new TypeError(`Duplicate node ID: ${id}`);
      ids.add(id);
    }
    if (node.children !== undefined && !Array.isArray(node.children)) throw new TypeError('node.children must be an array.');
    for (const child of node.children || []) reserve(child, depth + 1);
  }
  reserve(input.root, 1);
  function normalize(node) {
    let id = node.id?.trim();
    if (!id) {
      do { id = `n${++generated}`; } while (ids.has(id));
      ids.add(id);
    }
    return {
      id,
      label: text(node.label, 'node.label', 160, true),
      children: (node.children || []).map(normalize),
    };
  }
  return { title: text(input.title, 'title', 120, true), root: normalize(input.root) };
}
