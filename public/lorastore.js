const dropZone = document.getElementById('dropZone');
const loraInput = document.getElementById('loraInput');
const statusEl = document.getElementById('uploadStatus');
const tableBody = document.querySelector('#loraTable tbody');
const themeToggle = document.getElementById('themeToggle');

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

applyTheme(localStorage.getItem('vv-theme') || 'dark');

function addFile(file) {
  const formData = new FormData();
  formData.append('lora', file);
  statusEl.textContent = `Uploading ${file.name}...`;
  fetch('/api/loras/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(() => {
      statusEl.textContent = 'Upload complete';
      loadTable();
    })
    .catch(() => {
      statusEl.textContent = 'Upload failed';
    });
}

dropZone.addEventListener('click', () => loraInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) addFile(e.dataTransfer.files[0]);
});
loraInput.addEventListener('change', () => { if (loraInput.files[0]) addFile(loraInput.files[0]); });

async function loadTable() {
  const res = await fetch('/api/lorafiles');
  const list = await res.json();
  tableBody.innerHTML = '';
  list.forEach(item => {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    const link = document.createElement('a');
    link.textContent = item.name;
    link.href = `gallery.html?loraName=${encodeURIComponent(item.name)}`;
    nameTd.appendChild(link);
    const usesTd = document.createElement('td');
    usesTd.textContent = item.uses;
    const dlTd = document.createElement('td');
    const dl = document.createElement('a');
    dl.textContent = 'Download';
    dl.href = `/loras/${item.id}`;
    dlTd.appendChild(dl);
    tr.appendChild(nameTd);
    tr.appendChild(usesTd);
    tr.appendChild(dlTd);
    tableBody.appendChild(tr);
  });
}

loadTable();
