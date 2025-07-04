const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const statusEl = document.getElementById('uploadStatus');

function uploadFiles(files) {
  if (!files || !files.length) return;
  const formData = new FormData();
  Array.from(files).forEach(f => formData.append('images', f));
  fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
    .then(() => {
      statusEl.textContent = 'Upload complete!';
      imageInput.value = '';
    })
    .catch(() => {
      statusEl.textContent = 'Upload failed.';
    });
}

uploadForm.addEventListener('submit', e => e.preventDefault());
dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  uploadFiles(e.dataTransfer.files);
});
imageInput.addEventListener('change', () => uploadFiles(imageInput.files));
