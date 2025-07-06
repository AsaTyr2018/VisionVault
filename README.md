# VisionVault

VisionVault is a lightweight image board tailored for AI-generated artwork. Uploaded files have their embedded metadata parsed automatically so you can search and organise creations by prompt, model and other parameters. The interface uses Bootstrap 5 for a responsive gallery experience.

## Features

- Drag-and-drop bulk uploads with automatic extraction of PNG `Parameters` metadata
- Images and metadata stored in a local SQLite database
- Infinite scrolling gallery with quick tag preview
- Sorting by date or first tag (trigger)
- Filters for tags, model names, LoRA references and resolution
- LoRA names are detected from prompt references and the `Lora hashes` metadata field
- Tag cloud page showing popular keywords
- Metadata drawer and fullscreen modal per image
- Single or bulk deletion of images
- Light/dark theme toggle for improved usability
- Optional `prestart.sh` script to pull updates and reinstall dependencies

## Use Cases

VisionVault acts as a personal vault for experiments with Stable Diffusion or similar generators. By capturing prompts and model settings, it lets you track variations, compare results and revisit earlier work. Small teams can also share a common gallery to exchange ideas or manage LoRA-based workflows.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 16 or higher

### Install & Run
```bash
npm install
npm start
```
The server runs on `http://localhost:3000` by default.

Start with an update check using:
```bash
./prestart.sh
```
This script fetches Git updates and installs dependencies if required.
If upgrading from an older version, the database schema is adjusted automatically.

### Docker Setup

Use the scripts in `docker_setup/` to build a containerized instance of VisionVault.
Run the builder and start the service with:

```bash
python docker_setup/builder.py
cd app
docker compose up -d
```

This creates a Docker environment with a persistent `data` volume for the SQLite
database and uploads. Access the web interface at `http://localhost:3000`.
To update an existing container without losing data, run `python update.py`.

### API Overview

The Express server exposes the following endpoints:

- `POST /api/upload` – upload one or more images and record their metadata
- `GET /api/images` – list images with filters (`tag`, `model`, `lora`, `width`, `height`, `offset`, `limit`)
- `DELETE /api/images/:id` – remove a single image
- `POST /api/images/delete` – bulk remove images via an `ids` array
- `GET /api/tags` – return a tag frequency list for the tag cloud

### Project Structure
- **src/server.js** – main server implementation
- **public/** – static files for the dashboard, gallery and upload pages

The default `index.html` now shows a dashboard with basic statistics. Browse images through `public/gallery.html`. Upload images via `public/upload.html`. Hover an image in the gallery to preview its main tag or open the metadata drawer for complete details.

