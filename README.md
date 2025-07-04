# VisionVault
A automatic Meta Tagging Image Board for AI Generated Content

## Getting Started
This repository contains the first gallery framework for VisionVault. Images can be uploaded in bulk, metadata is automatically extracted and stored in a local SQLite database. Tags parsed from prompts are searchable via the gallery interface. Hover over images in the gallery to reveal prompt and tag details.

### Prerequisites
- [Node.js](https://nodejs.org/) 16 or higher

### Install & Run
```bash
npm install
npm start
```
The server will start on [http://localhost:3000](http://localhost:3000).

If you are upgrading from a previous version of VisionVault, the server will
automatically update your existing `visionvault.db` file to include a
`created_at` column used for sorting images by upload time.

### Project Structure
- **src/server.js** – Express server with image upload and search API.
- **public/** – Static frontend implementing a simple gallery.

Upload images using the drag-and-drop area on the main page. The metadata found in PNG files under the `Parameters` field is parsed automatically.
