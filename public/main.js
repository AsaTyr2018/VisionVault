const gallery = document.getElementById('gallery');
const drawer = document.getElementById('drawer');
const drawerContent = document.getElementById('drawerContent');
const drawerClose = document.getElementById('drawerClose');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const manualTagToggle = document.getElementById('manualTagToggle');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('search');

let offset = 0;
const limit = 20;
let loading = false;
let filters = {
  tag: '',
  model: '',
  lora: false,
  resolution: ''
};

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
  const res = await fetch('/api/images?' + buildQuery());
  return res.json();
}

function createItem(img) {
  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-item';
  wrapper.dataset.meta = JSON.stringify(img);

  const el = document.createElement('img');
  el.src = img.url;
  el.alt = img.prompt || '';

  const meta = document.createElement('div');
  meta.className = 'meta-preview';
  meta.innerHTML = `
    <div>Model: ${img.model || ''}</div>
    <div>Seed: ${img.seed || ''}</div>
    <div class="tag-auto">${img.tags.join(', ')}</div>
  `;

  wrapper.appendChild(el);
  wrapper.appendChild(meta);
  wrapper.addEventListener('click', () => openDrawer(img));
  return wrapper;
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
  drawer.classList.add('open');
}

drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
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

// initial load
loadMore(true);
