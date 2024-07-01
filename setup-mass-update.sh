#!/bin/sh

start_colima() {
    if ! colima status | grep -q 'Running'; then
        echo "Starting Colima..."
        colima start
    else
        echo "Colima is already running."
    fi
}


start_colima

docker-buildx build -t mass-update .

if [ $? -ne 0 ]; then
    echo "Docker build failed. Exiting."
    exit 1
fi


docker run -d -p 3000:3000 --name mass-update-container mass-update

if [ $? -ne 0 ]; then
    echo "Failed to start the Docker container. Exiting."
    exit 1
fi

docker ps