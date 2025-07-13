
const gallery = document.getElementById('gallery');
const drawer = document.getElementById('drawer');
const drawerContent = document.getElementById('drawerContent');
let bsDrawer;
let modal;
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('search');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const sortSelect = document.getElementById('sortSelect');
const themeToggle = document.getElementById('themeToggle');
const nsfwToggle = document.getElementById('nsfwToggle');
const modelListEl = document.getElementById('modelList');
const loraListEl = document.getElementById('loraList');
const yearSelect = document.getElementById('yearFilter');
const monthSelect = document.getElementById('monthFilter');

// Simple helper so all debug output is grouped and easy to filter
function debug(...args) {
  console.log('[VisionVault]', ...args);
}

let offset = 0;
const limit = 50;
let loading = false;
let nsfwWords = [];
let hideNsfw = localStorage.getItem('vv-nsfw') !== 'off';
let filters = {
  tag: '',
  model: '',
  loraName: '',
  resolution: '',
  year: '',
  month: '',
  sort: 'date_desc'
};


// Apply tag from query parameter if present
const urlParams = new URLSearchParams(window.location.search);
const tagParam = urlParams.get('tag');
if (tagParam) {
  filters.tag = tagParam;
  if (searchInput) searchInput.value = tagParam;
}
const sortParam = urlParams.get('sort');
if (sortParam) {
  filters.sort = sortParam;
  if (sortSelect) sortSelect.value = sortParam;
}
const modelParam = urlParams.get('model');
if (modelParam) {
  filters.model = modelParam;
}
const loraParam = urlParams.get('loraName');
if (loraParam) {
  filters.loraName = loraParam;
}
const yearParam = urlParams.get('year');
if (yearParam) {
  filters.year = yearParam;
  if (yearSelect) yearSelect.value = yearParam;
}
const monthParam = urlParams.get('month');
if (monthParam) {
  filters.month = monthParam;
  if (monthSelect) monthSelect.value = monthParam;
}

function buildQuery() {
  const params = new URLSearchParams();
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.model) params.set('model', filters.model);
  if (filters.loraName) params.set('loraName', filters.loraName);
  if (filters.resolution) {
    const [w, h] = filters.resolution.split('x');
    if (w && h) {
      params.set('width', w.trim());
      params.set('height', h.trim());
    }
  }
  if (filters.year) params.set('year', filters.year);
  if (filters.month) params.set('month', filters.month);
  if (filters.sort) params.set('sort', filters.sort);
  params.set('offset', offset);
  params.set('limit', limit);
  return params.toString();
}

async function fetchImages() {
  const query = '/api/images?' + buildQuery();
  debug('Requesting images:', query);
  try {
    const res = await fetch(query);
    const data = await res.json();
    debug('Received', data.length, 'images');
    return data;
  } catch (err) {
    console.error('[VisionVault] Failed to fetch images', err);
    return [];
  }
}

async function loadModels() {
  if (!modelListEl) return;
  try {
    const res = await fetch('/api/models');
    const models = await res.json();
    modelListEl.innerHTML = '';
    models.forEach((m) => {
      const label = document.createElement('label');
      label.className = 'block';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'mr-2 model-option';
      cb.value = m;
      if (m === filters.model) cb.checked = true;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          filters.model = cb.value;
          document.querySelectorAll('.model-option').forEach((o) => {
            if (o !== cb) o.checked = false;
          });
        } else {
          filters.model = '';
        }
        loadMore(true);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(m));
      modelListEl.appendChild(label);
    });
  } catch (err) {
    console.error('[VisionVault] Failed to load models', err);
  }
}

async function loadLoras() {
  if (!loraListEl) return;
  try {
    const res = await fetch('/api/loras');
    const loras = await res.json();
    loraListEl.innerHTML = '';
    loras.forEach((m) => {
      const label = document.createElement('label');
      label.className = 'block';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'mr-2 lora-option';
      cb.value = m;
      if (m === filters.loraName) cb.checked = true;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          filters.loraName = cb.value;
          document.querySelectorAll('.lora-option').forEach((o) => {
            if (o !== cb) o.checked = false;
          });
        } else {
          filters.loraName = '';
        }
        loadMore(true);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(m));
      loraListEl.appendChild(label);
    });
  } catch (err) {
    console.error('[VisionVault] Failed to load loras', err);
  }
}

async function loadResolutions() {
  const sel = document.getElementById('resFilter');
  if (!sel) return;
  try {
    const res = await fetch('/api/resolutions');
    const list = await res.json();
    sel.innerHTML = '<option value="">Resolution</option>';
    list.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (r === filters.resolution) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error('[VisionVault] Failed to load resolutions', err);
  }
}

async function loadMonths(year = '') {
  if (!monthSelect) return;
  try {
    const query = year ? `/api/months?year=${year}` : '/api/months';
    const res = await fetch(query);
    const months = await res.json();
    monthSelect.innerHTML = '<option value="">Month</option>';
    months.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === filters.month) opt.selected = true;
      monthSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('[VisionVault] Failed to load months', err);
  }
}

async function loadYears() {
  if (!yearSelect) return;
  try {
    const res = await fetch('/api/years');
    const years = await res.json();
    yearSelect.innerHTML = '<option value="">Year</option>';
    years.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === filters.year) opt.selected = true;
      yearSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('[VisionVault] Failed to load years', err);
  }
  await loadMonths(filters.year);
}

async function loadNsfwWords() {
  try {
    const res = await fetch('/api/nsfw-tags');
    nsfwWords = await res.json();
  } catch {
    nsfwWords = [];
  }
}

function createItem(img) {
  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-item';
  wrapper.dataset.meta = JSON.stringify(img);
  wrapper.dataset.id = img.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'select-box';
  checkbox.dataset.id = img.id;

  const delBtn = document.createElement('button');
  delBtn.className = 'delete-btn';
  delBtn.innerHTML = '×';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteImage(img.id);
  });

  const link = document.createElement('a');
  link.href = img.url;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(img);
  });

  const el = document.createElement('img');
  // Use native lazy loading so off-screen images don't load immediately
  el.loading = 'lazy';
  el.src = img.url;
  el.alt = img.prompt || '';
  el.addEventListener('load', () => {
    // ensure modal image dimensions are available if needed
    el.dataset.width = el.naturalWidth;
    el.dataset.height = el.naturalHeight;
  });
  link.appendChild(el);

  const meta = document.createElement('div');
  meta.className = 'meta-preview';
  meta.innerHTML = `
    <div class="tag-auto">${img.tags[0] || ''}</div>
  `;

  wrapper.appendChild(link);
  wrapper.appendChild(meta);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(delBtn);
  if (hideNsfw && nsfwWords.some((w) => img.tags.includes(w))) {
    wrapper.style.display = 'none';
    wrapper.dataset.nsfwHidden = 'true';
  }
  wrapper.addEventListener('click', (e) => {
    if (
      e.target === checkbox ||
      e.target === delBtn ||
      e.target.closest('a')
    )
      return;
    openDrawer(img);
  });
  return wrapper;
}

async function deleteImage(id) {
  await fetch(`/api/images/${id}`, { method: 'DELETE' });
  const el = document.querySelector(`.gallery-item[data-id="${id}"]`);
  if (el) el.remove();
}

async function deleteSelected() {
  const ids = Array.from(document.querySelectorAll('.select-box:checked')).map(
    (cb) => parseInt(cb.dataset.id, 10)
  );
  if (!ids.length) return;
  await fetch('/api/images/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  ids.forEach((id) => {
    const el = document.querySelector(`.gallery-item[data-id="${id}"]`);
    if (el) el.remove();
  });
}

function uploadFiles(files) {
  if (!files || !files.length) return;
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append('images', f));
  fetch('/api/upload', {
    method: 'POST',
    body: formData,
  }).then(() => {
    imageInput.value = '';
    loadMore(true);
  });
}

function renderImages(images, append = true) {
  if (!append) gallery.innerHTML = '';
  if (!images.length && !append) {
    const p = document.createElement('p');
    p.className = 'placeholder';
    p.textContent = 'Keine Bilder gefunden';
    gallery.appendChild(p);
    return;
  }
  images.forEach((img) => gallery.appendChild(createItem(img)));
  applyNsfwFilter(hideNsfw);
}

async function loadMore(reset = false) {
  if (loading) return;
  loading = true;
  if (reset) offset = 0;
  const imgs = await fetchImages();
  debug('Loading images', { reset, count: imgs.length, offset });
  renderImages(imgs, !reset);
  offset += imgs.length;
  loading = false;
}

function checkScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMore();
  }
}

function openDrawer(img) {
  drawerContent.innerHTML = `
    <h3>Metadata</h3>
    <p><strong>Prompt:</strong> ${img.prompt || ''}</p>
    ${img.negativePrompt ? `<p><strong>Negative:</strong> ${img.negativePrompt}</p>` : ''}
    <p><strong>Model:</strong> ${img.model || ''}</p>
    <p><strong>Seed:</strong> ${img.seed || ''}</p>
    <p><strong>Size:</strong> ${img.width || '?'}x${img.height || '?'}</p>
    ${img.loras && img.loras.length ? `<p><strong>LoRA:</strong> ${img.loras.join(', ')}</p>` : ''}
  `;
  debug('Opening metadata drawer for image', img.id);
  if (!bsDrawer) bsDrawer = new bootstrap.Offcanvas(drawer);
  bsDrawer.show();
}

function openModal(img) {
  if (!modal) {
    modal = new bootstrap.Modal(document.getElementById('imageModal'));
  }
  const modalImg = document.getElementById('modalImage');
  modalImg.src = img.url;
  modalImg.alt = img.prompt || '';
  modal.show();
}

window.addEventListener('scroll', checkScroll);

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

filterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  filters.tag = document.getElementById('keywordFilter').value.trim();
  filters.resolution = document.getElementById('resFilter').value;
  filters.year = yearSelect ? yearSelect.value : '';
  filters.month = monthSelect ? monthSelect.value : '';
  const checkedLora = document.querySelector('.lora-option:checked');
  filters.loraName = checkedLora ? checkedLora.value : '';
  loadMore(true);
});

if (yearSelect) {
  yearSelect.addEventListener('change', () => {
    filters.year = yearSelect.value;
    filters.month = '';
    if (monthSelect) monthSelect.value = '';
    loadMonths(filters.year);
  });
}

searchInput.addEventListener('input', () => {
  filters.tag = searchInput.value.trim();
  loadMore(true);
});

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    filters.sort = sortSelect.value;
    loadMore(true);
  });
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '🌙';
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.textContent = '☀';
  }
  localStorage.setItem('vv-theme', theme);
}

function applyNsfwFilter(on) {
  hideNsfw = on;
  nsfwToggle.textContent = hideNsfw ? '🚫' : '🔞';
  localStorage.setItem('vv-nsfw', hideNsfw ? 'on' : 'off');
  document.querySelectorAll('.gallery-item').forEach((item) => {
    const data = JSON.parse(item.dataset.meta);
    const has = data.tags.some((t) => nsfwWords.includes(t));
    item.style.display = hideNsfw && has ? 'none' : '';
  });
}

themeToggle.addEventListener('click', () => {
  const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

nsfwToggle.addEventListener('click', () => {
  applyNsfwFilter(!hideNsfw);
});

// Apply stored theme on load
applyTheme(localStorage.getItem('vv-theme') || 'dark');
applyNsfwFilter(hideNsfw);

deleteSelectedBtn.addEventListener('click', deleteSelected);

if (uploadForm && dropZone && imageInput) {
  uploadForm.addEventListener('submit', (e) => e.preventDefault());
  dropZone.addEventListener('click', () => imageInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    uploadFiles(e.dataTransfer.files);
  });
  imageInput.addEventListener('change', () => uploadFiles(imageInput.files));
}

// initial load
loadModels()
  .then(loadLoras)
  .then(loadResolutions)
  .then(loadYears)
  .then(loadNsfwWords)
  .then(() => loadMore(true));
