# Docker Setup Builder

This directory provides a helper script for generating a Docker environment for **VisionVault**. The builder works on Windows and Linux by detecting the operating system automatically.

## Requirements

- **Windows**: Windows 10+ with Docker Desktop or WSL2 with Docker installed.
- **Linux**: Docker Engine with the Docker Compose plugin.

Running the script performs the following steps:

1. Clone the VisionVault repository into `./app` if it is not already present.
2. Create a `Dockerfile` and `docker-compose.yml` inside the cloned directory.
3. Configure Docker volumes so the SQLite database and uploaded images remain outside the container for easy backup. The builder now creates a `data` directory containing the database file.

## Usage

```bash
python builder.py
```

By default the script uses the main VisionVault repository URL. After the files have been created you can start the service with:

```bash
cd app
docker compose up -d
```

The container uses `DB_PATH=/app/data/visionvault.db` so the SQLite database resides
in the mounted `data` directory.

The web interface will be available at `http://localhost:3000`.

## Updating

Use `update.py` to pull the latest code and rebuild the container while keeping your data volume:

```bash
python update.py
```

The script stops the running container, renames it with a `_backup` suffix and starts a freshly built container using the same volumes so no uploads or database files are lost.
