const container = document.getElementById('tagCloud');
const themeToggle = document.getElementById('themeToggle');
const nsfwToggle = document.getElementById('nsfwToggle');

async function fetchTags() {
  const res = await fetch('/api/tags');
  return res.json();
}

function render(tags) {
  const max = tags[0] ? tags[0].count : 1;

  tags.forEach((t) => {
    const span = document.createElement('span');
    span.className = 'tag-item';
    span.textContent = t.tag;
    const scale = t.count / max;
    span.style.fontSize = 0.8 + scale * 1.2 + 'rem';
    span.addEventListener('click', () => {
      window.location.href = `gallery.html?tag=${encodeURIComponent(t.tag)}`;
    });
    container.appendChild(span);
  });
}

window.addEventListener('load', async () => {
  const tags = await fetchTags();
  render(tags);
});

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

themeToggle.addEventListener('click', () => {
  const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

function applyNsfwFilter(on) {
  nsfwToggle.textContent = on ? '🚫' : '🔞';
  localStorage.setItem('vv-nsfw', on ? 'on' : 'off');
}

nsfwToggle.addEventListener('click', () => {
  const current = localStorage.getItem('vv-nsfw') !== 'off';
  applyNsfwFilter(!current);
});

applyTheme(localStorage.getItem('vv-theme') || 'dark');
applyNsfwFilter(localStorage.getItem('vv-nsfw') !== 'off');
