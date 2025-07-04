const container = document.getElementById('tagCloud');

async function fetchTags() {
  const res = await fetch('/api/tags');
  return res.json();
}

function render(tags) {
  const max = tags[0] ? tags[0].count : 1;
  const maxRadius = container.offsetWidth / 2 - 40;
  const center = container.offsetWidth / 2;

  tags.forEach((t) => {
    const span = document.createElement('span');
    span.className = 'tag-item';
    span.textContent = t.tag;
    const scale = t.count / max;
    span.style.fontSize = 0.8 + scale * 2 + 'rem';
    const radius = maxRadius * (1 - scale);
    const angle = Math.random() * Math.PI * 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.addEventListener('click', () => {
      window.location.href = `index.html?tag=${encodeURIComponent(t.tag)}`;
    });
    container.appendChild(span);
  });
}

window.addEventListener('load', async () => {
  const tags = await fetchTags();
  render(tags);
});
