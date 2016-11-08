# Welcome to the FIWARE Device Simulator documentation.

The FIWARE Device Simulator is a tool which makes it possible to interact with the FIWARE ecosystem of components simulating devices and other elements which may communicate with FIWARE components.

More concretely, the FIWARE Device Simulator includes the following capabilities:

1. Making update context requests to [Context Broker](https://github.com/telefonicaid/fiware-orion) instances via NGSI v1 and NGSI v2.
2. Making notification requests to subscribers of context data managed by [Context Broker](https://github.com/telefonicaid/fiware-orion) instances (currently only NGSI v1 notifications are supported).
3. Simulating devices supporting the UltraLight 2.0 and the JSON format via HTTP and MQTT interacting with [UltraLight](https://github.com/telefonicaid/iotagent-ul) and [JSON](https://github.com/telefonicaid/iotagent-json) IoT Agents.
4. Automatic authorization and token management to interact with secured components and infrastructures.
5. Possibility to run the simulations in real time and fast-forward modes.
6. Possibility to visualize the evolution of the simulations in [Freeboard.io](http://freeboard.io/) dashboards.
