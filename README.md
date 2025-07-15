# VisionVault

VisionVault is a lightweight image board tailored for AI-generated artwork. Uploaded files have their embedded metadata parsed automatically so you can search and organise creations by prompt, model and other parameters. The interface uses Bootstrap 5 for a responsive gallery experience.

## Features

- Drag-and-drop bulk uploads with automatic extraction of PNG `Parameters` metadata
- Local SQLite database stores images and all parsed metadata
- Infinite scrolling gallery with quick tag preview
- Sorting by date or first tag (trigger)
- Filters for tags, model names, LoRA references, resolution, year and month
- LoRA names detected from prompt references and the `Lora hashes` metadata field
- Dashboard summarising image counts, unique tags and storage use
- Dashboard shows top uploaders
- Tag cloud page showing popular keywords
- NSFW filter toggle driven by the optional `nsfw.txt` blacklist
- Metadata drawer and fullscreen modal per image
- Shows uploader name in the metadata drawer
- Search box filters images by prompt or tags
- Single or bulk deletion of images
- User accounts with role-based permissions (admin & user)
- Users can mark uploads as private
- Optional Caption Mode stores raw metadata as searchable captions
- Keyword filter includes an option to run a full-text caption search
- Admin panel includes a "Take Ownership" action to claim all images
- Light/dark theme toggle for improved usability
- Optional `prestart.sh` script to pull updates and reinstall dependencies

## Use Cases

VisionVault suits anyone exploring generative art. It keeps a detailed history of prompts, models and LoRAs so you can revisit earlier attempts or branch off new ideas. Individuals can treat it as a searchable sketchbook, while small teams may share a common gallery to coordinate LoRA testing or compare results across different models.

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
The server will also add the new `caption` column and build its search index on startup.

### User Accounts

The server now includes basic authentication using sessions. An initial `admin` account (username **admin**, password **admin**) is created automatically *only if no other admin users exist*. Images that predate the account system are stored without an owner (displayed as "unknown"). Register new accounts on `login.html` or manage users from `admin.html` (admin only). **Delete or change the default `admin` account after creating your own admin user.** Regular users can upload and delete only their own images, while guests may browse the gallery.

### Docker Setup

VisionVault ships with a `docker-compose.yml` that spins up the service ready to use. From the project root simply run:

```bash
docker compose up -d
```

The compose file mounts `./public/images` and `./data` so uploads and the SQLite database persist locally. The web interface will be available at `http://localhost:3000`.

### API Overview

The Express server exposes the following endpoints:

- `POST /api/upload` – upload one or more images and record their metadata
- `GET /api/images` – list images with filters (`tag`, `model`, `loraName`, `width`, `height`, `year`, `month`, `offset`, `limit`, `sort`)
- `DELETE /api/images/:id` – remove a single image
- `POST /api/images/delete` – bulk remove images via an `ids` array
- `POST /api/register` – create a new user
- `POST /api/login` – authenticate and start a session
- `POST /api/logout` – end the current session
- `GET /api/admin/users` – list users (admin)
- `POST /api/admin/create-user` – create a user (admin)
- `POST /api/admin/delete-user` – remove a user and their images (admin)
- `GET /api/tags` – return a tag frequency list for the tag cloud
- `GET /api/models` – list unique models from metadata
- `GET /api/loras` – list unique LoRA names
- `GET /api/resolutions` – list available resolutions
- `GET /api/nsfw-tags` – return blacklist words for the NSFW toggle
- `GET /api/years` – list years present in the collection
- `GET /api/months` – list months for a given year
- `GET /api/stats` – return dashboard statistics

### Project Structure
- **src/server.js** – Express server and API routes
- **public/** – static HTML, JavaScript and styles for the dashboard, gallery and upload pages
- **tools/refreshMetadata.js** – utility script to rescan existing images and fill in metadata
- **docker-compose.yml** – Docker compose file to run the service
- **prestart.sh** – optional script to pull updates and install dependencies

The default `index.html` now shows a dashboard with basic statistics. Browse images through `public/gallery.html`. Upload images via `public/upload.html`. Hover an image in the gallery to preview its main tag or open the metadata drawer for complete details.

### Refreshing Metadata

If you add or modify image files outside of the web interface, run:

```bash
npm run refresh-meta
```

This command scans the `public/images` folder and updates the SQLite database, inserting any new files and filling in missing metadata for existing records.

