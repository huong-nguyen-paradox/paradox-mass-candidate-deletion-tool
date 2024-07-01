#!/bin/sh

deps=(colima docker docker-buildx)

check_dependencies() {

    deps=("$@")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "$dep is not installed. Installing using Homebrew..."
            brew install "$dep"

            if ! command -v "$dep" &> /dev/null; then
                echo "$dep installation failed. Exiting."
                exit 1
            else
                echo "$dep installed successfully."
            fi
        else
            echo "$dep is already installed."
        fi
  done
}

start_colima() {
    if ! colima status | grep -q 'Running'; then
        echo "Starting Colima..."
        colima start
    else
        echo "Colima is already running."
    fi
}

check_dependencies "${deps[@]}"

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