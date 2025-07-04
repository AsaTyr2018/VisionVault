const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Placeholder: extract metadata from image file
function fetchMetadata(imagePath) {
  // TODO: implement metadata extraction
  return {};
}

// Placeholder: categorize image based on metadata
function categorizeImage(metadata) {
  // TODO: implement categorization logic
  return 'Uncategorized';
}

// Placeholder: search images via metadata or prompt
function searchImages(query) {
  // TODO: implement search
  return [];
}

// API placeholder to list images
app.get('/api/images', (req, res) => {
  // TODO: serve actual image data
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`VisionVault server running on port ${PORT}`);
});
