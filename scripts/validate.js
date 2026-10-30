import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { dataDirectory, isDatasetFilename } from '../lib/data.js';
import { validateTree } from '../lib/tree.js';

const requested = process.argv.slice(2);
const files = requested.length ? requested : (await readdir(dataDirectory))
  .filter(name => name.endsWith('.json')).sort().map(name => join(dataDirectory, name));

if (!files.length) console.log('No JSON datasets in data/.');
for (const file of files) {
  try {
    if (!isDatasetFilename(basename(file))) throw new Error('Use a .json filename containing letters, numbers, hyphens, or underscores, starting with a letter or number.');
    const tree = validateTree(JSON.parse(await readFile(file, 'utf8')));
    const count = node => 1 + node.children.reduce((sum, child) => sum + count(child), 0);
    console.log(`${file}: valid (${count(tree.root)} nodes)`);
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    process.exitCode = 1;
  }
}
