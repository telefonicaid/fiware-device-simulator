# Installation

The FIWARE Device Simulator can be installed using three main procedures:

1. Cloning the Github repository.

2. Using a RPM package

3. Automatic deployment using Docker.

## Cloning the Github repository

To install the FIWARE Device Simulator cloning the Github repository, please run the following commands:

This is:
```bash
git clone https://github.com/telefonicaid/fiware-device-simulator.git
cd fiware-device-simulator/
npm install
```

The FIWARE Device Simulator is ready to be used.

## Using a RPM package

We detail the steps to follow to install, update and remove the fiware-device-simulator component using a RPM package.
### Package generation
**Prerequisites:** To generate the RPM package from the fiware-device-simulator component sources it is needed to have the rpm build tools (`rpmbuild` executable), Node and the
npm utilities, as well as an Internet connection to download the required Node modules.
To generate the RPM package for the fiware-device-simulator component, execute the following command from the root of the fiware-device-simulator component:
```bash
./rpm/create-rpm.sh -v <version> -r <release>
```
If everything goes fine, a new RPM package will be created and stored in the following location: `./rpm/RPMS/x86_64/fiware-device-simulator-<version>-<release>.x86_64.rpm`.
Execute the next command to get additional information about the RPM package creation script:
```bash
./rpm/create-rpm.sh -h
```
### Installation, upgrade and removal
**Prerequisites:** Node is needed to install the generated fiware-device-simulator component RPM package.
To install or upgrade the fiware-device-simulator component, execute:
```bash
sudo rpm -Uvh fiware-device-simulator-<version>-<release>.x86_64.rpm
```
After the installation, the following files and directories are created:
```
/etc/logrotate.d
└── logrotate-fiware-device-simulator-daily.conf
/var/log/fiware-device-simulator
/opt/fiware-device-simulator
├── conf
│   └── <empty> Here is where configuration files are stored
├── node_modules
│   └── <node modules directory structure and files>
├── package.json
└── (other files and directories)
```
To remove a previous fiware-device-simulator component installation, execute:
```bash
sudo rpm -e fiware-device-simulator
```

## Automatic deployment using Docker

To ease the testing and deployment of the FIWARE Device Simulator, there also exists Docker images hosted at the [Telefonica Docker Hub](https://hub.docker.com/repository/docker/telefonicaiot/fiware-device-simulator/), including all the information needed to deploy and to try the FIWARE Device Simulator via the execution of a simple Docker command.

To run a Docker instance including a FIWARE Device Simulator instance, please run the following commands:
```bash
docker pull telefonicaiot/fiware-device-simulator
docker run -t -i telefonicaiot/fiware-device-simulator /bin/bash
```

At this point, you will be inside the Docker container with a FIWARE Device Simulator ready to be used.
