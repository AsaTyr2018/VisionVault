import subprocess
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent / "app"
COMPOSE_FILE = APP_DIR / "docker-compose.yml"
SERVICE_NAME = "visionvault"


def run(cmd, capture_output=False):
    if capture_output:
        return subprocess.check_output(cmd, text=True).strip()
    subprocess.check_call(cmd)


def compose(*args, capture_output=False):
    base = ["docker", "compose", "-f", str(COMPOSE_FILE)]
    return run(base + list(args), capture_output=capture_output)


def get_container_id():
    try:
        return compose("ps", "-q", SERVICE_NAME, capture_output=True)
    except subprocess.CalledProcessError:
        return ""


def get_container_name(container_id):
    if not container_id:
        return ""
    name = run(["docker", "inspect", "-f", "{{.Name}}", container_id], capture_output=True)
    return name.lstrip("/")


def stop_and_backup(container_name):
    if not container_name:
        return
    run(["docker", "stop", container_name])
    backup = f"{container_name}_backup"
    subprocess.run(["docker", "rm", "-f", backup], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    run(["docker", "rename", container_name, backup])


def update_repo():
    if APP_DIR.exists():
        run(["git", "-C", str(APP_DIR), "pull"])


def rebuild_container():
    compose("up", "-d", "--build")


def main():
    cid = get_container_id()
    name = get_container_name(cid)
    if name:
        print(f"Stopping container {name}")
        stop_and_backup(name)
    else:
        print("No running container found.")

    update_repo()
    rebuild_container()
    print("Update complete. Old container kept with '_backup' suffix.")


if __name__ == "__main__":
    main()
