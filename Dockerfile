# Copyright 2016 Telefónica Investigación y Desarrollo, S.A.U
#
# This file is part of the FIWARE Device Simulator tool
#
# The FIWARE Device Simulator tool is free software: you can redistribute it
# and/or modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the License,
# or (at your option) any later version.
#
# The FIWARE Device Simulator is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with the FIWARE Device Simulator.
# If not, see http://www.gnu.org/licenses/.
#
# For those usages not covered by the GNU Affero General Public License
# please contact with: [german.torodelvalle@telefonica.com]

ARG  NODE_VERSION=12.21.0-slim
FROM node:${NODE_VERSION}

MAINTAINER FIWARE Device Simulator Team. Telefónica I+D

COPY . /opt/fiware-device-simulator
WORKDIR /opt/fiware-device-simulator

RUN \
    apt-get update && \
    apt-get install -y bzip2 python make gcc g++ && \
    npm install && \
    # Clean apt cache
    apt-get clean && \
    apt-get remove -y bzip2 python make gcc g++ && \
    apt-get -y autoremove

