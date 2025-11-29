#!/bin/bash
set -e

# 1. Start Docker Daemon
echo "Starting Docker Daemon..."
dockerd > /var/log/dockerd.log 2>&1 &
DOCKER_PID=$!

# 2. Wait for Docker
echo "Waiting for Docker to start..."
until docker info >/dev/null 2>&1; do
    echo "Waiting for Docker daemon..."
    sleep 1
done
echo "Docker is ready!"

# 3. Load the offline images (CHANGED)
# We loop through every .tar file in the directory and load it
if ls /root/images/*.tar 1> /dev/null 2>&1; then
    echo "Loading offline database images..."
    for img in /root/images/*.tar; do
        echo "Loading $img..."
        docker load -i "$img"
    done
else
    echo "No offline images found to load."
fi

# 4. Start the databases
echo "Starting Database containers..."
docker compose --file /root/workspace/docker-compose.yml up -d

# 5. Execute User Command
npm ci

echo "Executing command: $@"
exec "$@"