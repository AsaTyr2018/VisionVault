# VisionVault
A automatic Meta Tagging Image Board for AI Generated Content

## Getting Started
This repository contains the first gallery framework for VisionVault. Images can be uploaded, metadata is automatically extracted and stored in a local SQLite database. Tags parsed from prompts are searchable via the gallery interface.

### Prerequisites
- [Node.js](https://nodejs.org/) 16 or higher

### Install & Run
```bash
npm install
npm start
```
The server will start on [http://localhost:3000](http://localhost:3000).

### Project Structure
- **src/server.js** – Express server with image upload and search API.
- **public/** – Static frontend implementing a simple gallery.

Upload images via the form on the main page. The metadata found in PNG files under the `Parameters` field is parsed automatically.
