const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const statusEl = document.getElementById('uploadStatus');
const queueEl = document.getElementById('uploadQueue');

const queue = [];
let uploading = false;

function addFiles(files) {
  Array.from(files).forEach(file => {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.textContent = file.name;

    const progress = document.createElement('div');
    progress.className = 'progress flex-grow-1 ms-2';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.style.width = '0%';
    progress.appendChild(bar);
    item.appendChild(progress);
    queueEl.appendChild(item);

    queue.push({ file, bar, item });
  });
  if (!uploading) processQueue();
}

function processQueue() {
  if (!queue.length) {
    uploading = false;
    statusEl.textContent = 'All uploads complete';
    return;
  }
  uploading = true;
  const { file, bar, item } = queue.shift();
  statusEl.textContent = `Uploading ${file.name}...`;
  const formData = new FormData();
  formData.append('images', file);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload');
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      bar.style.width = `${percent}%`;
    }
  };
  xhr.onload = () => {
    bar.style.width = '100%';
    setTimeout(() => item.remove(), 500);
    processQueue();
  };
  xhr.onerror = () => {
    bar.classList.add('bg-danger');
    processQueue();
  };
  xhr.send(formData);
}

dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});
imageInput.addEventListener('change', () => addFiles(imageInput.files));

uploadForm.addEventListener('submit', (e) => e.preventDefault());
