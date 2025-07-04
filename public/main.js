async function fetchImages(tag = '') {
  const url = tag ? `/api/images?tag=${encodeURIComponent(tag)}` : '/api/images';
  const res = await fetch(url);
  return res.json();
}

function renderImages(images) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  if (!images.length) {
    const p = document.createElement('p');
    p.className = 'placeholder';
    p.textContent = 'Keine Bilder gefunden';
    gallery.appendChild(p);
    return;
  }
  images.forEach((img) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-item';
    const el = document.createElement('img');
    el.src = img.url;
    el.alt = img.prompt;
    const overlay = document.createElement('div');
    overlay.className = 'info-overlay';
    overlay.innerHTML = `
      <strong>${img.prompt || 'No prompt'}</strong>
      <div>${img.tags.join(', ')}</div>
    `;
    wrapper.appendChild(el);
    wrapper.appendChild(overlay);
    gallery.appendChild(wrapper);
  });
}

async function load(tag = '') {
  const images = await fetchImages(tag);
  renderImages(images);
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search');
  const form = document.getElementById('uploadForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    await fetch('/api/upload', { method: 'POST', body: data });
    form.reset();
    load();
  });

  search.addEventListener('input', () => {
    load(search.value.trim());
  });

  load();
});
