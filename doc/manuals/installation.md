# Installation

The FIWARE Device Simulator can be installed using 2 main procedures:

1. Cloning the Github repository.
2. Automatic deployment using Docker.

## Cloning the Github repository

To install the FIWARE Device Simulator cloning the Github repository, please run the following commands:

This is:
```bash
git clone https://github.com/telefonicaid/fiware-device-simulator.git
cd fiware-device-simulator/
npm install
```

The FIWARE Device Simulator is ready to be used.

## Automatic deployment using Docker

To ease the testing and deployment of the FIWARE Device Simulator, there also exists Docker images hosted at the [FIWARE Docker Hub](https://hub.docker.com/r/fiware/device-simulator/), including all the information needed to deploy and to try the FIWARE Device Simulator via the execution of a simple Docker command.

To run a docker instance including a FIWARE Device Simulator instance, please run the following command:
```bash
docker run -t -i fiware/device-simulator:latest /bin/bash
```

At this point, you will be inside the Docker container with a FIWARE Device Simulator ready to be used.
