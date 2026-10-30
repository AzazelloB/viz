import { createTreeViewer } from './tree-viewer.js';
import { icon } from './icons.js';

const $ = selector => document.querySelector(selector);
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
const viewer = createTreeViewer($('#viewer'), {
  onChange({ zoom, collapsedCount, canCollapse, focusRootId }) {
    $('#zoom-level').textContent = `${Math.round(zoom * 100)}%`;
    $('#expand').disabled = collapsedCount === 0;
    $('#collapse').disabled = !canCollapse;
    $('#full-tree').hidden = !focusRootId;
  },
});
let catalog = [], currentFile, displayedFile, revision, loadVersion = 0;
let refreshing = false, refreshQueued = false, fileError = false;

function updatePicker() {
  const entry = catalog.find(item => item.file === currentFile);
  $('#tree-title').textContent = entry?.title || 'Choose a tree';
  $('#tree-file').textContent = entry?.file || '';
  $('#tree-select').disabled = !catalog.length;
  $('#tree-options').querySelectorAll('[role="option"]').forEach(option => {
    option.setAttribute('aria-selected', String(option.dataset.file === currentFile));
  });
}
function picker(open, focus = false) {
  $('#tree-options').hidden = !open;
  $('#tree-select').setAttribute('aria-expanded', String(open));
  if (open && focus) {
    const options = [...$('#tree-options').querySelectorAll('[role="option"]')];
    (options.find(option => option.dataset.file === currentFile) || options[0])?.focus();
  }
}
function renderPicker() {
  const focused = document.activeElement?.dataset.file;
  $('#tree-options').replaceChildren(...catalog.map(entry => {
    const option = document.createElement('button');
    option.setAttribute('role', 'option'); option.tabIndex = -1; option.dataset.file = entry.file;
    const title = document.createElement('span'); title.textContent = entry.title;
    const file = document.createElement('small'); file.textContent = entry.file;
    option.append(title, file);
    return option;
  }));
  updatePicker();
  if (focused && !$('#tree-options').hidden) {
    [...$('#tree-options').children].find(option => option.dataset.file === focused)?.focus();
  }
}
function error(message = '') {
  $('#error').textContent = message;
  $('#error').hidden = !message;
}
async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not read ${path} (${response.status}).`);
  return response.json();
}
async function openFile(entry, preserveView = false) {
  const version = ++loadVersion;
  preserveView &&= displayedFile === entry.file;
  currentFile = entry.file;
  updatePicker();
  try {
    if (entry.error) throw new Error(entry.error);
    const data = await readJson(`/data/${entry.file}`);
    if (version !== loadVersion) return;
    const tree = viewer.setTree(data, { preserveView });
    displayedFile = entry.file;
    fileError = false;
    if (!preserveView) { $('#search').value = ''; $('#search-results').hidden = true; }
    else if (!$('#search-results').hidden) search();
    document.title = tree.title;
    history.replaceState(null, '', `/?file=${encodeURIComponent(entry.file)}`);
    error();
  } catch (cause) {
    if (version !== loadVersion) return;
    fileError = true;
    const retained = displayedFile === entry.file;
    if (!retained) { viewer.clear(`Could not load ${entry.file}.`); displayedFile = undefined; }
    error(`${entry.file}: ${cause.message}${retained ? ' Showing the last valid version.' : ''}`);
  }
  if (version === loadVersion) revision = entry.revision;
}
async function refresh() {
  if (refreshing) { refreshQueued = true; return; }
  refreshing = true;
  try {
    const next = await readJson('/data.json');
    if (JSON.stringify(next) !== JSON.stringify(catalog)) {
      catalog = next.map(entry => entry.error
        ? { ...entry, title: catalog.find(previous => previous.file === entry.file)?.title || entry.title }
        : entry);
      renderPicker();
    }
    if (!catalog.length) {
      ++loadVersion; currentFile = undefined; displayedFile = undefined; revision = undefined;
      updatePicker(); picker(false);
      viewer.clear('Add a tree JSON file to data/.');
      error();
      return;
    }
    const requested = currentFile || new URLSearchParams(location.search).get('file');
    const entry = catalog.find(item => item.file === requested) || catalog[0];
    if (entry.file !== currentFile || entry.revision !== revision) await openFile(entry, entry.file === currentFile);
    else { updatePicker(); if (!fileError) error(); }
  } catch (cause) { error(cause.message); }
  finally {
    refreshing = false;
    if (refreshQueued) { refreshQueued = false; refresh(); }
  }
}

$('#tree-select').addEventListener('click', () => {
  const open = $('#tree-options').hidden;
  picker(open, open);
});
$('#tree-select').addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    picker(true, true); event.preventDefault();
  }
});
$('#tree-options').addEventListener('click', event => {
  const option = event.target.closest('[role="option"]');
  if (!option) return;
  const entry = catalog.find(item => item.file === option.dataset.file);
  picker(false); $('#tree-select').focus();
  if (entry && entry.file !== currentFile) openFile(entry);
});
$('.file-picker').addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#tree-options').hidden) {
    picker(false); $('#tree-select').focus(); event.preventDefault(); event.stopPropagation();
  }
  if (event.key === 'Tab') picker(false);
  if (event.target.getAttribute('role') !== 'option') return;
  const options = [...$('#tree-options').children], at = options.indexOf(document.activeElement);
  const key = event.key;
  if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
    const next = key === 'Home' ? 0 : key === 'End' ? options.length - 1 : (at + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next]?.focus(); event.preventDefault();
  }
});
$('#zoom-out').onclick = viewer.zoomOut;
$('#zoom-in').onclick = viewer.zoomIn;
$('#zoom-level').onclick = viewer.resetZoom;
$('#fit').onclick = () => viewer.fit();
$('#expand').onclick = viewer.expandAll;
$('#collapse').onclick = viewer.collapseAll;
$('#full-tree').onclick = () => { viewer.showFullTree(); $('#viewer .tree-canvas').focus(); };

function search() {
  const found = viewer.search($('#search').value), results = $('#search-results');
  results.hidden = !$('#search').value.trim();
  results.replaceChildren();
  if (!found.length) {
    const empty = document.createElement('div'); empty.className = 'no-results'; empty.textContent = 'No matching nodes'; results.append(empty);
  }
  for (const node of found.slice(0, 30)) {
    const button = document.createElement('button'); button.dataset.id = node.id;
    button.textContent = node.label;
    if (node.source || node.subtitle) {
      const context = document.createElement('small'); context.textContent = node.source || node.subtitle; button.append(context);
    }
    results.append(button);
  }
}
function focusResult(id) {
  viewer.focus(id);
  $('#search-results').hidden = true;
  $('#search').blur();
  $('#viewer .tree-canvas').focus();
}
$('#search').addEventListener('input', search);
$('#search').addEventListener('focus', search);
$('#search').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const first = viewer.find($('#search').value)[0];
    if (first) focusResult(first.id);
    event.preventDefault();
  }
  if (event.key === 'ArrowDown') { $('#search-results button')?.focus(); event.preventDefault(); }
});
$('#search-results').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) focusResult(button.dataset.id);
});
$('#search-results').addEventListener('keydown', event => {
  const buttons = [...$('#search-results').querySelectorAll('button')], at = buttons.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') { buttons[(at + 1) % buttons.length]?.focus(); event.preventDefault(); }
  if (event.key === 'ArrowUp') { (at === 0 ? $('#search') : buttons[at - 1])?.focus(); event.preventDefault(); }
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.search-wrap')) $('#search-results').hidden = true;
  if (!event.target.closest('.file-picker')) picker(false);
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Escape') { $('#search-results').hidden = true; $('#search').blur(); viewer.select(null); }
  if (event.target.closest('input, select, textarea, .file-picker')) return;
  if (event.key === '/') { $('#search').focus(); event.preventDefault(); }
  if (event.key.toLowerCase() === 'f') viewer.fit();
  if (event.key === '+' || event.key === '=') viewer.zoomIn();
  if (event.key === '-') viewer.zoomOut();
});

await refresh();
let serverId;
const events = new EventSource('/events');
events.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  if (event.type === 'connected') {
    if (serverId && serverId !== event.serverId) { location.reload(); return; }
    serverId = event.serverId;
    refresh();
  }
  if (event.type === 'data' && !document.hidden) refresh();
  if (event.type === 'styles') {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const next = link.cloneNode();
      const url = new URL(link.href);
      url.searchParams.set('v', Date.now());
      next.href = url.href;
      next.onload = () => link.remove();
      next.onerror = () => next.remove();
      link.after(next);
    });
  }
  if (event.type === 'reload') location.reload();
};
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
