import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { dataDirectory, isDatasetFilename } from '../lib/data.js';
import { reviewTree } from '../lib/review.js';

const args = process.argv.slice(2), json = args.includes('--json');
const unknown = args.find(arg => arg.startsWith('--') && arg !== '--json');
if (unknown) {
  console.error(`Unknown option: ${unknown}. Use npm run review -- [--json] [data/name.json ...]`);
  process.exitCode = 1;
} else {
  const requested = args.filter(arg => arg !== '--json');
  const files = requested.length ? requested : (await readdir(dataDirectory))
    .filter(isDatasetFilename).sort().map(name => join(dataDirectory, name));
  const reports = [];
  for (const file of files) {
    try {
      if (!isDatasetFilename(basename(file))) throw new Error('Use a valid dataset filename ending in .json.');
      reports.push({ file, ...reviewTree(JSON.parse(await readFile(file, 'utf8'))) });
    } catch (error) {
      reports.push({ file, error: error.message });
      process.exitCode = 1;
    }
  }
  if (json) console.log(JSON.stringify(reports, null, 2));
  else if (!reports.length) console.log('No JSON datasets in data/.');
  else for (const report of reports) {
    if (report.error) { console.error(`${report.file}: ${report.error}`); continue; }
    const { nodes, levels, maxChildren } = report.stats;
    console.log(`${report.file}: ${nodes} nodes, ${levels} levels, largest sibling set ${maxChildren}`);
    console.log('Review hints are observations, not errors or a quality score.');
    for (const finding of report.findings.slice(0, 8)) {
      console.log(`\n[${finding.code}] ${finding.observation}`);
      for (const occurrence of finding.occurrences.slice(0, 4)) console.log(`  ${occurrence.path} [${occurrence.id}]`);
      if (finding.occurrences.length > 4) console.log(`  ${finding.occurrences.length - 4} additional occurrences; use --json for all paths.`);
      console.log(`  ${finding.question}`);
    }
    if (!report.findings.length) console.log('No hints from these checks. Ownership still requires source-backed review.');
    else if (report.findings.length > 8) console.log(`\n${report.findings.length - 8} additional hints; use --json for the full report.`);
  }
}
