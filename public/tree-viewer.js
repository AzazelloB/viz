import { validateTree } from '../lib/tree.js';
import { layoutTree, CARD_WIDTH, CARD_HEIGHT } from './layout.js';
import { icon } from './icons.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Mount a self-contained hierarchy canvas. Requires style.css and a sized host. */
export function createTreeViewer(container, { onChange = () => {} } = {}) {
  container.classList.add('tree-viewer');
  container.innerHTML = `<div class="tree-canvas" tabindex="0" role="region" aria-label="Hierarchy canvas">
    <div class="tree-world"><div class="tree-scene"><svg class="tree-edges" aria-hidden="true"></svg><div class="tree-nodes"></div></div></div>
    <div class="tree-message">No tree loaded.</div>
  </div><aside class="tree-inspector" aria-label="Node details" hidden></aside>`;
  const $ = selector => container.querySelector(selector);
  const canvas = $('.tree-canvas'), world = $('.tree-world'), scene = $('.tree-scene'), panel = $('.tree-inspector');
  const controller = new AbortController();
  const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: controller.signal });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tree, graph, selected = null, query = '';
  let focusRootId = null, overview = null;
  let index = new Map(), parents = new Map(), collapsed = new Set();
  let view = { x: 0, y: 0, scale: 1 }, animation = 0, destroyed = false;
  let displayed = new Map(), layoutFrame = 0;
  const nodeElements = new Map(), edgeElements = new Map();

  function scopeRoot() { return index.get(focusRootId) || tree?.root; }
  function scopeNodes() {
    const nodes = [];
    function visit(node) { if (!node) return; nodes.push(node); node.children.forEach(visit); }
    visit(scopeRoot());
    return nodes;
  }
  function inScope(id) { return !focusRootId || ancestors(id).includes(focusRootId); }
  function notify() {
    const branches = scopeNodes().filter(node => node.children.length);
    onChange({
      zoom: view.scale, selectedId: selected, focusRootId,
      collapsedCount: branches.filter(node => collapsed.has(node.id)).length,
      canCollapse: branches.some(node => !collapsed.has(node.id)),
    });
  }
  function transform() {
    // Layout zoom rerasterizes text at its displayed size. Scaling a promoted
    // transform layer reused a low-resolution bitmap until nodes were rebuilt.
    const pixels = window.devicePixelRatio || 1;
    world.style.transform = `translate(${Math.round(view.x * pixels) / pixels}px, ${Math.round(view.y * pixels) / pixels}px)`;
    scene.style.zoom = String(view.scale);
    canvas.style.backgroundPosition = `${view.x}px ${view.y}px`;
    canvas.style.backgroundSize = `${24 * Math.max(.5, view.scale)}px ${24 * Math.max(.5, view.scale)}px`;
    notify();
  }
  function moveTo(target, smooth = true) {
    const token = ++animation;
    if (!smooth || reducedMotion) { view = target; transform(); return; }
    const from = { ...view }, started = performance.now();
    function frame(now) {
      if (destroyed || token !== animation) return;
      const t = Math.min(1, (now - started) / 240), eased = 1 - (1 - t) ** 3;
      view = Object.fromEntries(['x', 'y', 'scale'].map(key => [key, from[key] + (target[key] - from[key]) * eased]));
      transform();
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function area() {
    const width = container.clientWidth, height = container.clientHeight;
    const side = !panel.hidden && width > 650 ? 380 : 0;
    const bottom = !panel.hidden && width <= 650 ? panel.offsetHeight + 90 : 80;
    return { x: 32, y: 86, width: Math.max(150, width - 64 - side), height: Math.max(100, height - 86 - bottom) };
  }
  function fit(smooth = true) {
    if (!graph) return;
    const a = area(), scale = Math.min(1, a.width / graph.width, a.height / graph.height);
    moveTo({ x: a.x + (a.width - graph.width * scale) / 2 - graph.left * scale, y: a.y + Math.min(30, (a.height - graph.height * scale) / 2), scale }, smooth);
  }
  function initialFrame() {
    if (!graph) return;
    if (container.clientWidth > 650) { fit(false); return; }
    const root = graph.nodes[0], scale = .9;
    moveTo({ scale, x: container.clientWidth / 2 - (root.x + CARD_WIDTH / 2) * scale, y: 100 }, false);
  }
  function zoom(factor, x = container.clientWidth / 2, y = container.clientHeight / 2, smooth = true) {
    const scale = Math.max(.005, Math.min(2.5, view.scale * factor)), ratio = scale / view.scale;
    moveTo({ scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio }, smooth);
  }
  function ancestors(id) {
    const result = [];
    while (id != null) { result.unshift(id); id = parents.get(id); }
    return result;
  }
  function find(text) {
    const term = text.trim().toLowerCase();
    return term ? [...index.values()].filter(node => `${node.label} ${node.subtitle || ''} ${node.description || ''} ${node.source || ''}`.toLowerCase().includes(term)) : [];
  }
  function highlight() {
    const path = new Set(selected ? ancestors(selected) : []), matches = new Set(find(query).map(node => node.id));
    container.querySelectorAll('.node').forEach(el => {
      el.classList.toggle('selected', el.dataset.id === selected);
      el.classList.toggle('search-match', matches.has(el.dataset.id));
    });
    container.querySelectorAll('.tree-edges path').forEach(el => el.classList.toggle('active', path.has(el.dataset.child)));
  }
  function updateNode(node, visible) {
    let element = nodeElements.get(node.id);
    if (!element) {
      element = document.createElement('section');
      element.className = 'node'; element.dataset.id = node.id;
      element.innerHTML = '<button class="node-main"><span class="node-label"></span></button>';
      $('.tree-nodes').append(element);
      nodeElements.set(node.id, element);
    }
    element.classList.toggle('root', node.depth === 0);
    element.classList.toggle('has-children', node.children.length > 0);
    element.setAttribute('aria-label', node.label);
    element.inert = !visible;
    if (visible) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', 'true');
    const main = element.querySelector('.node-main');
    main.dataset.select = node.id;
    main.setAttribute('aria-label', `${node.label}. Show details.`);
    element.querySelector('.node-label').textContent = node.label;
    let toggle = element.querySelector('.node-toggle');
    if (node.children.length) {
      if (!toggle) { toggle = document.createElement('button'); toggle.className = 'node-toggle'; element.append(toggle); }
      const folded = collapsed.has(node.id), label = `${folded ? 'Expand' : 'Collapse'} ${node.label}`;
      toggle.dataset.toggle = node.id;
      toggle.setAttribute('aria-label', label); toggle.title = label;
      toggle.setAttribute('aria-expanded', String(!folded));
    } else toggle?.remove();
    if (node.parent !== null && !edgeElements.has(node.id)) {
      const edge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      edge.dataset.child = node.id;
      $('.tree-edges').append(edge); edgeElements.set(node.id, edge);
    } else if (node.parent === null && edgeElements.has(node.id)) {
      edgeElements.get(node.id).remove(); edgeElements.delete(node.id);
    }
  }
  function draw(positions) {
    displayed = positions;
    for (const node of positions.values()) {
      const element = nodeElements.get(node.id);
      // Animate layout coordinates, never scale a cached layer of text.
      element.style.left = `${node.x}px`; element.style.top = `${node.y}px`;
      element.style.opacity = String(node.opacity);
      const parent = positions.get(node.parent), edge = edgeElements.get(node.id);
      if (!parent || !edge) continue;
      const sx = parent.x + CARD_WIDTH / 2, sy = parent.y + CARD_HEIGHT + 9;
      const ex = node.x + CARD_WIDTH / 2, ey = node.y, middle = (sy + ey) / 2;
      edge.setAttribute('d', `M${sx},${sy} C${sx},${middle} ${ex},${middle} ${ex},${ey}`);
      edge.style.opacity = String(Math.min(node.opacity, parent.opacity));
    }
  }
  function render({ animate = false, anchorId = null, rootX = null } = {}) {
    cancelAnimationFrame(layoutFrame);
    const from = new Map(displayed);
    graph = layoutTree(scopeRoot(), collapsed);
    const anchor = graph.nodes.find(node => node.id === anchorId);
    const offset = rootX !== null ? rootX - graph.nodes[0].x : anchor && from.has(anchorId) ? from.get(anchorId).x - anchor.x : 0;
    graph.left = offset;
    for (const node of graph.nodes) node.x += offset;
    const target = new Map(graph.nodes.map(node => [node.id, { ...node, opacity: 1 }]));
    // Find the closest retained ancestor: new nodes emerge from its connector;
    // removed nodes return there. The same rule handles nested/rapid toggles.
    function connector(node, known, positions) {
      let parentId = node.parent;
      while (parentId !== null && parentId !== undefined) {
        if (known.has(parentId)) {
          const parent = positions.get(parentId) || known.get(parentId);
          return { x: parent.x, y: parent.y + CARD_HEIGHT + 12 };
        }
        parentId = from.get(parentId)?.parent ?? parents.get(parentId);
      }
      return { x: node.x, y: node.y };
    }
    const destination = new Map(target);
    for (const node of target.values()) {
      if (!from.has(node.id)) from.set(node.id, { ...node, ...connector(node, displayed, displayed), opacity: 0 });
      updateNode(node, true);
    }
    for (const node of displayed.values()) {
      if (target.has(node.id)) continue;
      destination.set(node.id, { ...node, ...connector(node, target, target), opacity: 0 });
      updateNode(node, false);
    }
    function finish() {
      draw(target);
      for (const [id, element] of nodeElements) {
        if (target.has(id)) continue;
        element.remove(); nodeElements.delete(id);
        edgeElements.get(id)?.remove(); edgeElements.delete(id);
      }
      layoutFrame = 0;
    }
    highlight();
    notify();
    if (!animate || reducedMotion || !displayed.size) { finish(); return; }
    const started = performance.now();
    function frame(now) {
      if (destroyed) return;
      const t = Math.min(1, (now - started) / 340), eased = 1 - (1 - t) ** 3;
      const positions = new Map();
      for (const [id, end] of destination) {
        const start = from.get(id);
        positions.set(id, {
          ...end,
          x: start.x + (end.x - start.x) * eased,
          y: start.y + (end.y - start.y) * eased,
          opacity: start.opacity + (end.opacity - start.opacity) * eased,
        });
      }
      draw(positions);
      if (t < 1) layoutFrame = requestAnimationFrame(frame);
      else finish();
    }
    // Place entering nodes at the connector before the first animation frame.
    draw(new Map([...destination].map(([id, node]) => [id, { ...node, ...from.get(id) }])));
    layoutFrame = requestAnimationFrame(frame);
  }
  function renderPanel() {
    const node = index.get(selected);
    const previousId = panel.dataset.nodeId, previousScroll = panel.scrollTop;
    panel.hidden = !node;
    if (!node) return;
    panel.dataset.nodeId = node.id;
    const parent = index.get(parents.get(node.id));
    panel.innerHTML = `<div class="inspector-header">${parent ? `<button data-action="parent" aria-label="Go to parent: ${escape(parent.label)}" title="Parent: ${escape(parent.label)}">${icon('up')}</button>` : ''}<h2>${escape(node.label)}</h2><button data-action="close" aria-label="Close node details" title="Close">${icon('close')}</button></div>
      ${node.subtitle ? `<p class="inspector-subtitle">${escape(node.subtitle)}</p>` : ''}
      ${node.source ? `<code class="inspector-source">${escape(node.source)}</code>` : ''}
      ${node.description ? `<p class="inspector-description">${escape(node.description)}</p>` : ''}
      ${node.children.length ? `<div class="inspector-children">${node.children.map(child => `<button data-child="${escape(child.id)}">${escape(child.label)}</button>`).join('')}</div>` : ''}
      ${node.children.length ? `<div class="inspector-actions">${node.id !== scopeRoot().id ? '<button data-action="subtree">Focus subtree</button>' : ''}<button data-action="toggle">${collapsed.has(selected) ? 'Expand' : 'Collapse'}</button></div>` : ''}`;
    panel.scrollTop = previousId === node.id ? previousScroll : 0;
  }
  function select(id) {
    if (id !== null && !index.has(id)) throw new Error(`Unknown node: ${id}`);
    selected = id;
    renderPanel(); highlight(); notify();
  }
  function setCollapsed(id, fold) {
    if (!index.has(id)) throw new Error(`Unknown node: ${id}`);
    if (!index.get(id).children.length || collapsed.has(id) === fold) return;
    if (fold) {
      collapsed.add(id);
      if (selected !== id && ancestors(selected).includes(id)) selected = id;
    } else collapsed.delete(id);
    ++animation;
    render({ animate: true, anchorId: id }); renderPanel();
  }
  function focus(id) {
    if (!index.has(id)) throw new Error(`Unknown node: ${id}`);
    // Search and detail navigation can also reveal a node outside the focus.
    if (!inScope(id)) { focusRootId = null; overview = null; }
    ancestors(id).forEach(parent => collapsed.delete(parent));
    render({ animate: true, anchorId: scopeRoot().id }); select(id);
    const node = graph.nodes.find(item => item.id === id), a = area();
    const scale = Math.min(1, Math.max(.9, view.scale));
    moveTo({ scale, x: a.x + a.width / 2 - (node.x + CARD_WIDTH / 2) * scale, y: a.y + a.height / 2 - (node.y + CARD_HEIGHT / 2) * scale });
  }
  function focusSubtree(id) {
    if (!index.has(id)) throw new Error(`Unknown node: ${id}`);
    if (id === tree.root.id) { showFullTree(); select(id); return; }
    if (!focusRootId) overview = { view: { ...view }, rootX: displayed.get(tree.root.id)?.x ?? graph.nodes[0].x };
    focusRootId = id;
    collapsed.delete(id);
    selected = id;
    renderPanel(); render({ animate: true, anchorId: id });
    const a = area(), root = graph.nodes[0];
    // Keep a large focused branch readable. Fit remains available for its
    // complete overview; focus should not recreate the unreadable panorama.
    const scale = Math.min(1, Math.max(.85, Math.min(a.width / graph.width, a.height / graph.height)));
    moveTo({ scale, x: a.x + a.width / 2 - (root.x + CARD_WIDTH / 2) * scale, y: a.y + 30 });
  }
  function showFullTree() {
    if (!tree || !focusRootId) return;
    const previous = overview;
    focusRootId = null; overview = null;
    renderPanel(); render({ animate: true, rootX: previous?.rootX ?? null });
    if (previous) moveTo({ ...previous.view });
    else fit();
  }
  function goToParent() {
    const parentId = parents.get(selected || scopeRoot()?.id);
    if (parentId === null || parentId === undefined) return;
    if (!inScope(parentId)) {
      if (parentId === tree.root.id) { showFullTree(); focus(parentId); }
      else focusSubtree(parentId);
    } else focus(parentId);
  }
  function collapseAll() {
    if (!tree) return;
    const root = scopeRoot();
    scopeNodes().forEach(node => { if (node.children.length) collapsed.add(node.id); });
    if (selected !== null) selected = root.id;
    renderPanel(); render({ animate: true, anchorId: root.id }); fit();
  }
  function expandAll() {
    if (!tree) return;
    scopeNodes().forEach(node => collapsed.delete(node.id));
    renderPanel(); render({ animate: true, anchorId: scopeRoot().id }); fit();
  }
  function setTree(input, { preserveView = false } = {}) {
    const normalized = validateTree(input);
    tree = normalized;
    index = new Map(); parents = new Map();
    function visit(node, parent = null, depth = 0) {
      index.set(node.id, { ...node, depth }); parents.set(node.id, parent);
      node.children.forEach(child => visit(child, node.id, depth + 1));
    }
    visit(tree.root);
    if (!preserveView) { selected = null; collapsed.clear(); query = ''; focusRootId = null; overview = null; }
    const lostFocus = focusRootId !== null && !index.has(focusRootId);
    if (lostFocus) { focusRootId = null; overview = null; }
    if (!index.has(selected)) selected = null;
    collapsed = new Set([...collapsed].filter(id => index.has(id)));
    $('.tree-message').hidden = true;
    renderPanel(); render({ animate: preserveView, anchorId: preserveView ? scopeRoot().id : null });
    if (!preserveView || lostFocus) initialFrame();
    return tree;
  }
  function clear(message = 'No tree loaded.') {
    ++animation;
    cancelAnimationFrame(layoutFrame);
    displayed.clear(); nodeElements.clear(); edgeElements.clear();
    tree = graph = null; selected = null; focusRootId = null; overview = null;
    index.clear(); parents.clear(); collapsed.clear();
    $('.tree-nodes').replaceChildren(); $('.tree-edges').replaceChildren(); panel.hidden = true;
    $('.tree-message').textContent = message; $('.tree-message').hidden = false;
    notify();
  }

  listen($('.tree-nodes'), 'click', event => {
    const toggle = event.target.closest('[data-toggle]'), node = event.target.closest('[data-select]');
    if (toggle) {
      const id = toggle.dataset.toggle;
      setCollapsed(id, !collapsed.has(id));
      [...container.querySelectorAll('[data-toggle]')].find(button => button.dataset.toggle === id)?.focus({ preventScroll: true });
    } else if (node) select(node.dataset.select);
  });
  listen(panel, 'click', event => {
    const child = event.target.closest('[data-child]'), action = event.target.closest('[data-action]')?.dataset.action;
    if (child) focus(child.dataset.child);
    if (action === 'close') { select(null); canvas.focus(); }
    if (action === 'subtree') focusSubtree(selected);
    if (action === 'parent') goToParent();
    if (action === 'toggle') setCollapsed(selected, !collapsed.has(selected));
  });
  const pointers = new Map();
  let drag, pinch, moved = false;
  listen(canvas, 'pointerdown', event => {
    if (event.target.closest('button') || ![0, 1].includes(event.button)) return;
    event.preventDefault(); ++animation; canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) { drag = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y }; moved = false; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], r = canvas.getBoundingClientRect();
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), view: { ...view }, x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
    }
    canvas.classList.add('dragging');
  });
  listen(canvas, 'pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()], r = canvas.getBoundingClientRect();
      const scale = Math.max(.005, Math.min(2.5, pinch.view.scale * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.distance)));
      const ratio = scale / pinch.view.scale;
      view = { scale, x: (a.x + b.x) / 2 - r.left - (pinch.x - pinch.view.x) * ratio, y: (a.y + b.y) / 2 - r.top - (pinch.y - pinch.view.y) * ratio };
      moved = true;
    } else if (drag) {
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      view.x = drag.viewX + dx; view.y = drag.viewY + dy;
    }
    transform();
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (!pointers.size) {
      if (!moved && event.type !== 'pointercancel') select(null);
      drag = pinch = null; canvas.classList.remove('dragging');
    } else {
      const [remaining] = pointers.values();
      drag = { x: remaining.x, y: remaining.y, viewX: view.x, viewY: view.y }; pinch = null;
    }
  }
  listen(canvas, 'pointerup', endPointer);
  listen(canvas, 'pointercancel', endPointer);
  listen(canvas, 'wheel', event => {
    event.preventDefault();
    const r = canvas.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1);
    zoom(Math.exp(-delta * .0015), event.clientX - r.left, event.clientY - r.top, false);
  }, { passive: false });
  listen(canvas, 'keydown', event => {
    if (!tree || !event.key.startsWith('Arrow') || event.ctrlKey || event.metaKey || event.altKey) return;
    let id = selected || scopeRoot().id;
    const node = index.get(id), parent = index.get(parents.get(id));
    if (event.key === 'ArrowUp' && parent) { goToParent(); event.preventDefault(); return; }
    if (event.key === 'ArrowDown' && node.children.length) id = node.children[0].id;
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && parent && inScope(parent.id)) {
      const at = parent.children.findIndex(child => child.id === id), direction = event.key === 'ArrowLeft' ? -1 : 1;
      id = parent.children[Math.max(0, Math.min(parent.children.length - 1, at + direction))].id;
    }
    focus(id); event.preventDefault();
  });
  let width = container.clientWidth;
  const resize = new ResizeObserver(() => {
    if (container.clientWidth === width) return;
    width = container.clientWidth;
    initialFrame();
  });
  resize.observe(container);

  return {
    setTree, clear, fit, focus, select, focusSubtree, showFullTree, goToParent, collapseAll, expandAll,
    find,
    search(text) { query = text; highlight(); return find(text); },
    collapse(id) { setCollapsed(id, true); },
    expand(id) { setCollapsed(id, false); },
    zoomIn() { zoom(1.2); },
    zoomOut() { zoom(1 / 1.2); },
    resetZoom() { zoom(1 / view.scale); },
    destroy() { destroyed = true; ++animation; cancelAnimationFrame(layoutFrame); controller.abort(); resize.disconnect(); container.replaceChildren(); container.classList.remove('tree-viewer'); },
  };
}
