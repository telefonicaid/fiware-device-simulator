# FIWARE Device Simulator

[![License badge](https://img.shields.io/badge/license-AGPL-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Documentation badge](https://readthedocs.org/projects/fiware-device-simulator/badge/?version=latest)](http://fiware-device-simulator.readthedocs.io/en/latest/)
[![Docker badge](https://img.shields.io/docker/pulls/fiware/device-simulator.svg)](https://hub.docker.com/r/fiware/device-simulator/)
[![Support badge]( https://img.shields.io/badge/support-sof-yellowgreen.svg)](http://stackoverflow.com/questions/tagged/fiware-device-simulator)

The FIWARE Device Simulator is a tool which makes it possible to interact with the FIWARE ecosystem of components simulating devices and other elements which may communicate with FIWARE components.

More concretely, the FIWARE Device Simulator includes the following capabilities:

1. Making update context requests to [Context Broker](https://github.com/telefonicaid/fiware-orion) instances via NGSI v1 and NGSI v2.
2. Making notification requests to subscribers of context data managed by [Context Broker](https://github.com/telefonicaid/fiware-orion) instances (currently only NGSI v1 notifications are supported).
3. Simulating devices supporting the UltraLight 2.0 and the JSON format via HTTP and MQTT interacting with [UltraLight](https://github.com/telefonicaid/iotagent-ul) and [JSON](https://github.com/telefonicaid/iotagent-json) IoT Agents.
4. Automatic authorization and token management to interact with secured components and infrastructures.
5. Possibility to run the simulations in real time and fast-forward modes.
6. Possibility to visualize the evolution of the simulations in [Freeboard.io](http://freeboard.io/) dashboards.

For further information please visit: the official [FIWARE Device Simulator documentation](https://fiware-device-simulator.readthedocs.io) at ReadTheDocs.

## Run it with docker
* [Docker instructions](doc/manuals/run-with-docker.md)

## Licence

The FIWARE Device Simulator is licensed under Affero General Public License (GPL) version 3.

## Contact

* Germán Toro del Valle ([german.torodelvalle@telefonica.com](mailto:german.torodelvalle@telefonica.com), [@gtorodelvalle](http://www.twitter.com/gtorodelvalle))
