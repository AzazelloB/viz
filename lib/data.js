import { mkdir, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { validateTree } from './tree.js';

export const dataDirectory = fileURLToPath(new URL('../data/', import.meta.url));
export const isDatasetFilename = name => /^[a-zA-Z0-9][a-zA-Z0-9_-]*\.json$/.test(name);
await mkdir(dataDirectory, { recursive: true });
const countNodes = node => 1 + node.children.reduce((total, child) => total + countNodes(child), 0);

/** Discover agent-written JSON. Invalid files stay selectable for error reporting. */
export async function listDatasets(directory = dataDirectory) {
  const files = (await readdir(directory)).filter(isDatasetFilename).sort();
  return Promise.all(files.map(async file => {
    try {
      const contents = await readFile(join(directory, file), 'utf8');
      const revision = createHash('sha256').update(contents).digest('hex');
      try {
        const tree = validateTree(JSON.parse(contents));
        return { file, title: tree.title, revision, nodeCount: countNodes(tree.root) };
      } catch (error) { return { file, title: file, revision, error: error.message }; }
    } catch (error) { return { file, title: file, error: error.message }; }
  }));
}
