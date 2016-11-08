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

FROM node:0.12

RUN mkdir -p /opt/fiware-device-simulator

COPY package.json /opt/fiware-device-simulator
RUN npm install

COPY bin /opt/fiware-device-simulator/bin
COPY lib /opt/fiware-device-simulator/lib

WORKDIR /opt/fiware-device-simulator
