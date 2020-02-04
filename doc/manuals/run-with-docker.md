# To run with docker

A Docker Compose file is provided for convenience. You must install [Docker Compose](https://docs.docker.com/compose/install/) for this method to work.

Simply navigate to the docker directory of the fiware-device-simulator code (if you have downloaded it) and run

        docker-compose up


Then, in a new shell script command cline you can invoke the simulator CLI by typing

        docker exec iot-device-simulator bash -c "./bin/fiwareDeviceSimulatorCLI <youroptions>"
