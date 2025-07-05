# VisionVault
A automatic Meta Tagging Image Board for AI Generated Content. The interface is built with modern Bootstrap 5 styles for a responsive experience.

## Getting Started
This repository contains the first gallery framework for VisionVault. Images can be uploaded in bulk, metadata is automatically extracted and stored in a local SQLite database. Tags parsed from prompts are searchable via the gallery interface. Hover over images in the gallery to reveal prompt and tag details.

### Prerequisites
- [Node.js](https://nodejs.org/) 16 or higher

### Install & Run
```bash
npm install
npm start
```
The server will start on [http://{serverip}:3000](http://{serverip}:3000).

### Automatic Updates
To start the server with an update check, run:

```bash
./prestart.sh
```
The script fetches any changes from the Git repository and prompts you to update.
If `package.json` or `package-lock.json` changed, `npm install` will be executed
before launching the server.

If you are upgrading from a previous version of VisionVault, the server will
automatically update your existing `visionvault.db` file to include a
`created_at` column used for sorting images by upload time.

### Project Structure
- **src/server.js** – Express server with image upload and search API.
- **public/** – Static frontend implementing a simple gallery.

Upload images through `upload.html`, which offers a drag-and-drop zone for quick imports. The metadata found in PNG files under the `Parameters` field is parsed automatically.
