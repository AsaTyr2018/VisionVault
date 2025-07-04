
const gallery = document.getElementById('gallery');
const drawer = document.getElementById('drawer');
const drawerContent = document.getElementById('drawerContent');
let bsDrawer;
let modal;
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const manualTagToggle = document.getElementById('manualTagToggle');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('search');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');

// Simple helper so all debug output is grouped and easy to filter
function debug(...args) {
  console.log('[VisionVault]', ...args);
}

let offset = 0;
const limit = 50;
let loading = false;
let filters = {
  tag: '',
  model: '',
  lora: false,
  resolution: ''
};


// Apply tag from query parameter if present
const urlParams = new URLSearchParams(window.location.search);
const tagParam = urlParams.get('tag');
if (tagParam) {
  filters.tag = tagParam;
  if (searchInput) searchInput.value = tagParam;
}

function buildQuery() {
  const params = new URLSearchParams();
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.model) params.set('model', filters.model);
  if (filters.lora) params.set('lora', 'true');
  if (filters.resolution) {
    const [w, h] = filters.resolution.split('x');
    if (w && h) {
      params.set('width', w.trim());
      params.set('height', h.trim());
    }
  }
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
  filters.model = document.getElementById('modelFilter').value.trim();
  filters.tag = document.getElementById('keywordFilter').value.trim();
  filters.resolution = document.getElementById('resFilter').value.trim();
  filters.lora = document.getElementById('loraFilter').checked;
  loadMore(true);
});

searchInput.addEventListener('input', () => {
  filters.tag = searchInput.value.trim();
  loadMore(true);
});

manualTagToggle.addEventListener('change', () => {
  const showManual = manualTagToggle.checked;
  document.querySelectorAll('.tag-auto').forEach((el) => {
    el.style.display = showManual ? 'none' : '';
  });
});

deleteSelectedBtn.addEventListener('click', deleteSelected);

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

// initial load
loadMore(true);
