import os
import platform
import subprocess
from pathlib import Path

DEFAULT_REPO = "https://github.com/AsaTyr2018/VisionVault.git"
APP_DIR = Path("app")


def run(cmd: list[str]):
    subprocess.check_call(cmd)


def detect_os() -> str:
    system = platform.system().lower()
    if "windows" in system:
        return "windows"
    return "linux"


def clone_repo(repo: str) -> Path:
    if APP_DIR.exists():
        print(f"Using existing repo in {APP_DIR}")
        return APP_DIR
    run(["git", "clone", repo, str(APP_DIR)])
    return APP_DIR


def create_dockerfile(path: Path):
    df = path / "Dockerfile"
    if df.exists():
        return
    df.write_text(
        """
FROM node:20-alpine
WORKDIR /app
COPY . /app
RUN npm install --production
EXPOSE 3000
CMD [\"npm\", \"start\"]
"""
    )


def create_compose(path: Path):
    compose = path / "docker-compose.yml"
    if compose.exists():
        return
    compose.write_text(
        """
version: '3'
services:
  visionvault:
    build: .
    ports:
      - '3000:3000'
    volumes:
      - ./public/images:/app/public/images
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/visionvault.db
"""
    )

    # Ensure host data directory and database file exist so Docker
    # mounts a file instead of creating a directory
    data_dir = path / "data"
    data_dir.mkdir(exist_ok=True)
    db_file = data_dir / "visionvault.db"
    if not db_file.exists():
        db_file.touch()


def main(repo: str = DEFAULT_REPO):
    os_type = detect_os()
    print(f"Detected OS: {os_type}")
    path = clone_repo(repo)
    create_dockerfile(path)
    create_compose(path)
    print("Docker setup files created. Run 'docker compose up -d' inside the app folder.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Build Docker setup for VisionVault")
    parser.add_argument("repo", nargs="?", default=DEFAULT_REPO, help="Repository to clone")
    args = parser.parse_args()
    main(args.repo)
