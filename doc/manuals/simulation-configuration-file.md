# Simulation configuration file

As mentioned in the description of the FIWARE Device Simulator command line tool, a simulation is described by a simulation configuration file (which is passed to the command line tool using the `-c` option).

The simulation configuration file is a JSON-formatted text file detailing the characteristics of the simulation to run.

This simulation configuration file can use environment variables, as described in [a specific section](#using-environment-variables-in-simulation-file).

An example simulation configuration file is shown next to give you a glimpse of its shape. After it, the accepted properties and options are properly detailed.

```json
  {
    "domain": {
      "service": "theService",
      "subservice": "/theSubService"
    },
    "contextBroker": {
      "protocol": "https",
      "host": "localhost",
      "port": 1026,
      "ngsiVersion": "1.0"
    },
    "authentication": {
      "provider": "keystone",
      "protocol": "https",
      "host": "localhost",
      "port": 5001,
      "user": "theUser",
      "password": "thePassword",
      "retry": {
        "times": 10,
        "interval": 1000
      }
    },
    "iota": {
      "ultralight": {
        "api_key": "1ifhm6o0kp4ew7fi377mpyc3c",
        "http": {
          "protocol": "http",
          "host": "localhost",
          "port": 8085
        },
        "mqtt": {
          "protocol": "mqtt",
          "host": "localhost",
          "port": 1883,
          "user": "mqttUser",
          "password": "mqttPassword"
        }
      },
      "json": {
        "api_key": "83ut64ib3gzs6km6izubjyenu",
        "http": {
          "protocol": "http",
          "host": "localhost",
          "port": 8185
        },
        "mqtt": {
          "protocol": "mqtt",
          "host": "localhost",
          "port": 1883,
          "user": "mqttUser",
          "password": "mqttPassword"
        }
      }
    },
  	"entities": [{
  		"schedule": "once",
  		"entity_name": "EntityName1",
  		"entity_type": "EntityType1",
  		"active": [{
  			"name": "active1",
  			"type": "date",
  			"value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 3600})"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
      "schedule": {
        "start": "2016-10-19T10:00:00Z",
        "end": "2016-10-19T11:00:00Z",
        "rule": "*/5 * * * * *"
      },
  		"entity_name": "EntityName2",
  		"entity_type": "EntityType2",
  		"active": [{
  			"name": "active1",
  			"type": "geo:json",
  			"value": "multiline-position-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"
  		}, {
  			"schedule": "*/1 * * * * *",
  			"name": "active2",
  			"type": "number",
  			"value": "time-linear-interpolator({\"spec\": [[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "string",
  			"value": "Value of static1"
  		}]
  	}, {
  		"count": "3",
  		"entity_type": "EntityType3",
  		"schedule": "*/1 * * * * *",
  		"active": [{
  			"name": "active1",
  			"type": "number",
  			"value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"float\"}})"
  		}, {
  			"schedule": "*/5 * * * * *",
  			"name": "active2",
  			"type": "number",
  			"value": "time-step-after-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}],
  		"staticAttributes": [{
  			"name": "static1",
  			"type": "percentage",
  			"value": "time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}, {
  			"name": "static2",
  			"type": "status",
  			"value": "text-rotation-interpolator({\"units\": \"seconds\", \"text\": [[0,\"PENDING\"],[15,\"REQUESTED\"],[30,[[50,\"COMPLETED\"],[50,\"ERROR\"]]],[45,\"REMOVED\"]]})"
  		}]
  	}],
  	"devices": [{
  		"schedule": "once",
      "protocol": "UltraLight::HTTP",
  		"device_id": "DeviceId1",
  		"attributes": [{
  			"object_id": "a1",
  			"value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 3600})"
  		}]
  	}, {
  		"schedule": "*/5 * * * * *",
      "protocol": "UltraLight::JSON",
  		"device_id": "DeviceId2",
      "api_key": "1ifdjdo0kkd7w77du77mpjd78",
  		"attributes": [{
  			"object_id": "a1",
  			"value": "multiline-bearing-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"
  		}, {
  			"schedule": "*/1 * * * * *",
  			"object_id": "a2",
  			"value": "time-linear-interpolator({\"spec\": [[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"
  		}]
  	}, {
  		"count": "5",
      "schedule": "*/1 * * * * *",
      "entity_type": "DeviceType3",
  		"protocol": "UltraLight::MQTT",
      "api_key": "ag235jdo0kkhd367du77mpgs54",
  		"attributes": [{
  			"object_id": "a1",
  			"value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"
  		}, {
  			"schedule": "*/5 * * * * *",
  			"object_id": "a2",
  			"value": "time-step-after-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])"
  		}]
  	}]
  }
```

The simulation configuration file accepts the following JSON properties or entries:

* **exports**: The FIWARE Device Simulation provides a templating mechanism to avoid repeating text into simulation configuration files as well as to facilitate the edition of these files. More information about this templating mechanism just after the description of the rest of the properties which may be used in a simulation configuration file.
* **globals**: An object including the global state variables and their initial values to be shared amongst executions of the `attribute-function-interpolator` no matter their specification. This property is related to the `attribute-function-interpolator` detailed below and it will become much clearer once the reader reaches that section.
* **require**: An array of names and/or paths of NPM packages to be required before running the simulation. This property is related to the `attribute-function-interpolator` interpolator as well as to the `collector` entry inside the `external` property detailed below. It makes it possible to `require()` these NPM packages directly in the code associated to these `attribute-function-interpolator` interpolators and collectors.
* **domain**: Includes information about the service and subservice (i.e., service path) to use in the requests. It is mandatory in case any `entities` are included in the simulation configuration (see below).
    * **service**: The service to use in the requests.
    * **subservice**: The subservice (i.e., service path) to use in the requests.
* **contextBroker**: Includes information about the context broker where the data will be stored. It is mandatory in case any `entities` are included in the simulation configuration (see below) and no `subscriber` configuration information is included (see below).
    * **protocol**: The protocol the Context Broker is expecting the requests to be sent by (or more concretely of the PEP protecting the access to the Context Broker API).
    * **host**: The host machine name or IP address where the Context Broker is running (or more concretely of the PEP protecting the access to the Context Broker API).
    * **port**: The port where the Context Broker host machine is listening for API requests (or more concretely of the PEP protecting the access to the Context Broker API).
    * **ngsiVersion**: The NGSI version to be used in the requests sent to the Context Broker. Currently, versions `1.0` and `2.0` are supported.
* **subscriber**: Includes information about the subscriber where the data will be notified. It is mandatory in case any `entities` are included in the simulation configuration (see below) and no `contextBroker` configuration information is included. Note that in case of including `contextBroker` and `subscriber` configuration information, the `contextBroker` will prevail over the `subscriber` one and no notifications will be sent to the configured subscriber.
    * **protocol**: The protocol the subscriber is expecting the notification requests to be sent to.
    * **host**: The host machine name or IP address where the subscriber is running.
    * **port**: The port where the subscriber host machine is listening for notification requests.
    * **path**: The path where the subscriber host machine is listening for notification requests.
    * **ngsiVersion**: The NGSI version to be used in the notification requests sent to the subscriber. Currently, only version `1.0` is supported.
* **authentication**: Includes information about the Identity Service to get tokens to be included in the Context Broker requests. Optional (authentication tokens will only be requested if the `authentication` information is included).
    * **provider**: The Identity Service provider from which the authorization tokens will be requested. Accepted values are: `keystone` (to request tokens for the Telefónica IoT Platform) and `fiware-lab` (to request tokens for the [FIWARE Lab cloud infrastructure](https://account.lab.fiware.org/)).
    * **protocol**: The protocol the Identity Service is expecting the requests to be sent by.
    * **host**: The host machine or IP where the Identity Service is running.
    * **port**: The port where the Identity Service is listening for requests.
    * **user**: The user to be used in the authorization token requests for the provided service and subservice.
    * **password**: The password to be used in the authorization token requests for the provided service and subservice.
    * **retry**: Retry mechanism in case an error occurs when requesting the authentication token. It is based on the [`async.retry()`](http://caolan.github.io/async/docs.html#.retry) function. It is an object including the following properties:
        * **times**: The number of attempts to make before giving up and ending the simulation. Mandatory if the `retry` property is included.
        * **interval**: The time to wait between retries, in milliseconds. Mandatory if the `retry` property is included.
* **iota**: Includes information about the IoT Agents which will be used for the devices updates. It is mandatory if a `devices` property describing devices is included in the simulation configuration.
    * **ultralight**: Includes information about the configuration of the UltraLight IoT Agents. It is mandatory if a `devices` property describing UltraLight devices (`protocol` property starting with `UltraLight::`) is included in the simulation configuration).
        * **api_key**: The API key to be used when updating UltraLight devices whose API key is not specified at a local level (see below). Mandatory if at least one UltraLight device is included whose API key is not specified at a local level.
        * **http**: Includes information about the configuration of the HTTP binding for the UltraLight protocol. It is mandatory if a `devices` property describing UltraLight HTTP devices (`protocol` property equal to `UltraLight::HTTP`) or UltraLight JSON devices ((`protocol` property equal to `UltraLight::JSON`)) is included in the simulation configuration).
            * **protocol**: The protocol the UltraLight HTTP IoT Agent is expecting the requests to be sent by.
            * **host**: The host machine where the UltraLight HTTP IoT Agent will be listening for requests.
            * **port**: The port where the UltraLight HTTP IoT Agent will be listening for requests.
        * **mqtt**: Includes information about the configuration of the MQTT binding for the UltraLight protocol. It is mandatory if a `devices` property describing UltraLight MQTT devices (`protocol` property equal to `UltraLight::MQTT`) is included in the simulation configuration).
            * **protocol**: The transport protocol used. Possible values include: `mqtt`, `mqtts`, `tcp`, `tls`, `ws`, `wss`.
            * **host**: The host machine where the UltraLight MQTT IoT Agent will be listening for requests.
            * **port**: The port where the UltraLight MQTT IoT Agent will be listening for requests.
            * **user**: The user to use for MQTT authenticated communications. Optional.
            * **password**: The password to use for MQTT authenticated communications. Optional.
    * **json**: Includes information about the configuration of the JSON IoT Agents. It is mandatory if a `devices` property describing UltraLight devices (`protocol` property starting with `JSON::`) is included in the simulation configuration).
        * **api_key**: The API key to be used when updating JSON devices whose API key is not specified at a local level (see below). Mandatory if at least one JSON device is included whose API key is not specified at a local level.
        * **http**: Includes information about the configuration of the HTTP binding for the JSON protocol. It is mandatory if a `devices` property describing JSON HTTP devices (`protocol` property equal to `JSON::HTTP`) is included in the simulation configuration).
            * **protocol**: The protocol the JSON HTTP IoT Agent is expecting the requests to be sent by.
            * **host**: The host machine where the JSON HTTP IoT Agent will be listening for requests.
            * **port**: The port where the JSON HTTP IoT Agent will be listening for requests.
        * **mqtt**: Includes information about the configuration of the MQTT binding for the JSON protocol. It is mandatory if a `devices` property describing JSON MQTT devices (`protocol` property equal to `JSON::MQTT`) is included in the simulation configuration).
            * **protocol**: The transport protocol used. Possible values include: `mqtt`, `mqtts`, `tcp`, `tls`, `ws`, `wss`.
                * **host**: The host machine where the JSON MQTT IoT Agent will be listening for requests.
                * **port**: The port where the JSON MQTT IoT Agent will be listening for requests.
                * **user**: The user to use for MQTT authenticated communications. Optional.
                * **password**: The password to use for MQTT authenticated communications. Optional.
* **entities**: Information about the entities to be updated during this concrete simulation.
    * **schedule**: Cron-style schedule (according to [https://www.npmjs.com/package/node-schedule#cron-style-scheduling](https://www.npmjs.com/package/node-schedule#cron-style-scheduling)) to schedule the updates of the entity. For example: `*/5 * * * * *` will update the attributes of the entity for which there is no `schedule` information, see below, every 5 seconds, whereas `0 0 0 * * *` will update the attributes of the entity for which there is no `schedule` information, see below, at 00:00 of every first day of each month. A very useful tool for dealing with cron-style schedules can be found at [http://crontab.guru/](http://crontab.guru/). An additional accepted value `once` is included to force the update of the entity only once at the beginning of the simulation. The `schedule` property also accepts an object including starting and ending dates for the schedule such as: `"schedule": {"start": "2016-10-19T10:47:00Z", "end": "2016-10-19T11:47:00Z", "rule": "*/5 * * * * *"}`. The previous `schedule` will only be effective from `2016-10-19T10:47:00Z` to `2016-10-19T11:47:00Z`.
    * **entity_name**: The name of the entity. The `entity_name` should not be provided if the `count` is provided.
    * **count**: The number of entities to simulate and update. For example, if a value of 3 is provided as the `count` property, 3 entities with names `<entity_type>:1`, `<entity_type>:2` and `<entity_type>:3` will be created and updated accordingly substituting the `<entity_type>` by its provided value (see just below) and according to its active and static attribute simulation specification (see below).
    * **entity_type**: The type of the entity.
    * **active**: List of attributes which will be updated according to their `schedule`s or the main entity `schedule` and the provided `value` (see just below).
        * **schedule**: The schedule by which this attribute should be updated. See the `schedule` property at the entity level above. It is an optional property. In case it is not specified, the entity level `schedule` property will be used.
        * **name**: The name of the attribute.
        * **type**: The type of the attribute.
        * **value**: The value of the attribute. This is the property which provides flexibility and realism to the FIWARE Device Simulator tool. It accepts static values (such as numbers (i.e., `123`), text (i.e., `the attribute value`), arrays (i.e., `[1, 2, 3]`), JSON objects (i.e., `{"key": "value"}`), etc.) as well as interpolator function specifications which the FIWARE Device Simulator tool will use to generate the final values. The supported interpolator function specifications are:
            1. **`date-increment-interpolator`**: It returns dates in UTC format. On the other hand, it accepts a JSON object including 2 properties: 1) `origin` (the date from when the date will be incremented or `now` for the current date when the value is interpolated) and 2) `increment` (the number of seconds the origin should incremented by. For example, a date increment interpolator specification such as: `{\"origin\": \"now\", \"increment\": 86400}` will return the current hour incremented in `86400` seconds, this is, 1 day, when the interpolated value is requested to be updated. For instance, an example attribute value using the `date-increment-interpolator` is: `date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})`.
            2. **`multiline-position-interpolator`**: It returns the current position of a mobile object for the current [decimal hour](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) by default as a GeoJSON geometry of type `Point` including its `coordinates`. The return value can also be obtained as a `geo:point` setting the `return` property to `geo:point` (see below). To this regard, it takes an object including the following properties:
                * `coordinates`: an array of points, this is, an array of 2 element arrays corresponding to the longitude and the latitude of the points. The connection between this points determine the line or route the mobile object will be traveling. It can be a circular or not circular route (in this case the mobile object will start the route from the beginning once the end is reached).
                * `speed`: an object including the following properties:
                    * `value`: a number corresponding to the speed at which the mobile object will be moving
                    * `units`: a string corresponding to the speed units. Valid values are `km/h` (kilometers per hour) and `mi/h` (miles per hour).
                * `time`: an object including the following properties:
                    * `from`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) from which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is before the `from` one, the interpolated position will be the starting point.
                    * `to`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) until which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is after the `to` one, the traveled distance will be calculated until this one.
                * `return`: a string including any of the following values: `geo:json` (to get the interpolated value as a GeoJSON point, this is the default behaviour) or `geo:point` (to get the interpolated value as a `geo:point`, this is the coordinates array of the GeoJSON point value as a string).
                * An example attribute value using the `multiline-position-interpolator` is: `"multiline-position-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"`.
            3. **`multiline-bearing-interpolator`**: It returns the bearing of the position of a mobile object for the current [decimal hour](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) by default as a GeoJSON geometry of type `Point` including its `coordinates`. To this regard, it takes an object including the following properties:
                * `coordinates`: an array of points, this is, an array of 2 element arrays corresponding to the longitude and the latitude of the points. The connection between this points determine the line or route the mobile object will be traveling. It can be a circular or not circular route (in this case the mobile object will start the route from the beginning once the end is reached).
                * `speed`: an object including the following properties:
                    * `value`: a number corresponding to the speed at which the mobile object will be moving
                    * `units`: a string corresponding to the speed units. Valid values are `km/h` (kilometers per hour) and `mi/h` (miles per hour).
                * `time`: an object including the following properties:
                    * `from`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) from which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is before the `from` one, the interpolated position will be the starting point.
                    * `to`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) until which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is after the `to` one, the traveled distance will be calculated until this one.
                * For instance, an example attribute value using the `multiline-bearing-interpolator` is: `"multiline-bearing-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"`.
            4. **`time-linear-interpolator`**: It returns float or integer values depending on the configuration. On the other hand, it accepts an object including the following properties:
                * `spec`: An array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time linear interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.125` if the interpolated value is requested at the `10:00` hours according to a linear interpolation between `0` and `20` as the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in the x-axis. This is the reason why a `time-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day.
                * `return`: It is an object including the following properties:
                    * `type`: The interpolator return type. It can take any of the following values: `float` or `integer`.
                    * `rounding`: If the type is equal to `integer`, the rounding mechanism must also be specified. It can take any of the following values: `ceil`, `floor` or `round`.
                * A possible attribute value using the `time-linear-interpolator` is: `"time-linear-interpolator({\"spec\": [[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `time-linear-interpolator({\"spec\": [[8,0],[12,100],[22,0]], \"return\": {\"type\": \"float\"}})`, in this case and due to its linear nature values for decimal hours from 0 to 8 will be negative (linearly), values for decimal hours from 8 to 12 will be between 0 and 100 (linearly), values for decimal hours from 12 to 22 will be between 100 and 0 (linearly), and again values for decimal hours from 22 to 24 will be negative (linearly).
            5. **`time-random-linear-interpolator`**: It returns float or integer values depending on the configuration. On the other hand, it accepts an object including the following properties:
                * `spec`: An array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value.
                    * The first element of the array or decimal hours may include the `random()` directive. For example, a random time linear interpolator specification such as: `[[random(0,1),0],[random(23,24),100]]` will behave as a `time-linear-interpolator` where the random part will be substituted for a concrete random decimal hours value each time this interpolator is invoked. For example, subsequent invocations of the previous interpolator may end up behaving such as the following `time-linear-interpolator`s: `[0.410237338161096,0],[23.268972319317982,100]]`, `[0.192138821585104,0],[23.442964296089485,100]]`, `[0.223540030419827,0],[23.614114402793348,100]]`, etc.
                        * An example attribute value using the `time-random-linear-interpolator` is: `"random-time-linear-interpolator({\"spec\": [[random(12,13),0],[random(20,21),100]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                        * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `random-time-linear-interpolator({\"spec\": [[random(12,13),10],[random(20,21),100]], \"return\": {\"type\": \"float\"}})`, in this case and due to its linear nature values for decimal hours from 0 to 12 will be below 10 (linearly, including the randomness factor it may go beyond the 12 decimal hour) including negative values, values for decimal hours from the 13 to the 20 will be between 0 and 100 (linearly and according to the randomness factor it may go before the 13 and beyond the 20 decimal hours), values for decimal hours from 21 to 24 will be greater than 100 (linearly and according to the randomness factor it may be before the 21 decimal hour).
                    * The second element of the array or specified value may include the `random()` directive. For example, a time random linear interpolator specification such as: `[[0,0],[20,random(0.25,0.50)],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, a random number bigger than `0.25` and smaller than `0.50` if the interpolated value is requested at the `20:00` hours and the corresponding interpolated value between the previous y-axis values if it is requested at a time between the `00:00` hours and the `20:00` hours. This is the reason why a `time-random-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day.
                        * A possible attribute value using the `time-random-linear-interpolator` is: `"time-random-linear-interpolator({\"spec\": [[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                        * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `"time-random-linear-interpolator({\"spec\": [[8,random(0,10)],[12,random(90,100)],[22,random(0,10)]], \"return\": {\"type\": \"float\"}})"`, in this case and due to its linear nature values for decimal hours from 0 to 8 will be below 10 (linearly including the randomness factor) including negative values, values for decimal hours from 8 to 12 will be between 0 and 100 (linearly and according to the randomness factor), values for decimal hours from 12 to 22 will be between 100 and 0 (linearly and according to the randomness factor), and again values for decimal hours from 22 to 24 will be below 10 (linearly and according to the randomness factor) including negative values.
                    * The `random()` directive can be used in the first element of the array specification, in the second one or in both in which case the behavior is the combined one. Consequently, `"time-random-linear-interpolator({\"spec\": [[random(0,1),0],[20,random(25,45)],[random(21,22),random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"` is a perfectly valid `time-random-linear-interpolator`.
                * `return`: It is an object including the following properties:
                    * `type`: The interpolator return type. It can take any of the following values: `float` or `integer`.
                    * `rounding`: If the type is equal to `integer`, the rounding mechanism must also be specified. It can take any of the following values: `ceil`, `floor` or `round`.
            6. **`time-step-after-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time step after interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-after"). This is the reason why a `time-step-after-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day. An accepted attribute value using the `time-step-after-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            7. **`time-step-before-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time step before interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.25` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-before"). This is the reason why a `time-step-before-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day. An example attribute value using the `time-step-before-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            8. **`text-rotation-interpolator`**: It returns a string from a set of possible values with support for probabilistic occurrences of them. On the other hand, it accepts an object including the following properties:
                * `units`: It is a string which affects the `text` property detailed below. It accepts the following values: `seconds`, `minutes`, `hours`, `days` (day of the week), `dates` (day of the month), `months` and `years`.
                * `text`: It is an array of 2 elements arrays. The first element is the number of `seconds` (from 0 to 59), `minutes` (from 0 to 59), `hours` (from 0 to 23), `days` (from 0 to 6), `dates` (from 1 to 31), `months` (from 0 to 11) and `years` (full year) (according to the `units` property) from which the specified text will be returned for the current date and time. The second element can be a string corresponding to the text to be returned or an array of 2 elements arrays. The first element of this second 2 elements array is the probability (from 0 to 100) of the occurrence of the text specified as the second element of the array. The addition of the first elements array must be 100.
                * A possible attribute value using the `text-rotation-interpolator` is: `"text-rotation-interpolator({\"units\": \"seconds\", \"text\": [[0,\"PENDING\"],[15,\"REQUESTED\"],[30,[[50,\"COMPLETED\"],[50,\"ERROR\"]]],[45,\"REMOVED\"]]})"`. For example, according to this text rotation interpolation specification, if the current time seconds is between 0 and 15 it will return the value `PENDING`, if it is between 15 and 30 it will return the value `REQUESTED`, if it is between 30 and 45 it will return the value `COMPLETED` with a probability of 50% and `ERROR` with a probability of 50%.
            9. **`attribute-function-interpolator`**: It returns the result of the evaluation of some Javascript code. This code may include references to any entity's attributes values stored in the Context Broker. This interpolator accepts a string (properly escaped) with the Javascript code to evaluate. In this Javascript code, references to entity's attribute values may be included using the notation: `${{<entity-id>:#:<entity-type>}{<attribute-name>}}`, substituting the `<entity-id>`, `<entity-type>` and `<attribute-name}` by their concrete values. Take into consideration that the type specification of the entity (i.e., `:#:<entity-type>`, including the `:#:` separator) is optional and can be omitted, in which case the entity type will not be considered when retrieving the entity and the corresponding attribute value from the Context Broker.
                * An example attribute value using the `attribute-function-interpolator` is: `"attribute-function-interpolator(${{Entity:001}{active:001}} + Math.pow(${{Entity:002}{active:001}},2))"`.
                * An advanced feature incorporated to the `attribute-function-interpolator` is the possibility to `require` packages directly in the Javascript code to be evaluated. Obviously, all the capabilities related to referencing entity attributes are supported too in this case. To use it, please follow the next steps:
                    1. Include a `require` property in your simulation configuration file setting its value to an array including the names and/or paths of the NPM packages you will be using in any of your `attribute-function-interpolator` interpolators. These packages will be required before proceding with the simulation and made available to your `attribute-function-interpolator` code which uses them. For example: `"require": ["postfix-calculate"]`.
                    2. The result of the evaluation of your code should be assigned to the `module.exports` property (this is due to the fact that this functionality leans on the [`eval` NPM package](https://www.npmjs.com/package/eval) which imposes this restriction).
                * An accepted attribute value using this advanced mode of the `attribute-function-interpolator` is: `"attribute-function-interpolator(var postfixCalculate = require('postfix-calculate'); module.exports = postfixCalculate('${{Entity:001}{active:001}} 1 +');)"`, where the result of the evaluation (this is, the value assigned to `module.exports`) will be the result of adding 1 to the value of the `active:001` attribute of the `Entity:001` entity, according to the [`postfix-calculate` NPM](https://www.npmjs.com/package/postfix-calculate) functionality.
                * Sometimes it is useful to have access to the simulation date (mainly in case of fast-forward simulations (more information about fast-forward simulations below)), for that we inject into the Javascript code of `attribute-function-interpolator`s an object SimulationDate which behaves such as the Javascript `Date` object but "points" to the simulation time and date, this is `new SimulationDate()` returns the current `Date` for the current simulation. It is important to note that the `SimulationDate` object will only be available if you assign the result of your code evaluation to the `module.exports` property.
                * A possible attribute value using the possibility to access the current simulation time is: `"attribute-function-interpolator(module.exports = new SimulationDate())"`, where the result of the evaluation (this is, the value assigned to `module.exports`) will be the current simulation date.
                * In case you want to maintain state amongst executions of `attribute-function-interpolator` with the same specification (this is, with the same Javascript code to be evaluated), you can do it following the next guidelines:
                    1. Include a comment in your `attribute-function-interpolator` Javascript code such as: `/* state: statefulVariable1 = 5, statefulVariable2 = {\"prop1\": \"value1\"}, statefulVariable3 */`, this is a `state:` tag followed by the list of variables you would like the interpolator to maintain as the state. This list is used to inject into your code these variables with the value included after the `=` character or `null` if no value is assigned for the first execution of your Javascript code.
                    2. Return the result the evaluation setting it as the value for the `module.exports.result` property.
                    3. Return the variables whose state should be maintained between executions of the interpolator as properties of an object assigned to the `module.exports.state` property.
                * It is important to note that all the `attribute-function-interpolator` sharing the same specification (this is, your Javascript code) will share the same state. If you do not want this, just slightly change the specification somehow withouth affecting the execution of your code such adding an additional `;` or including a comment.
                * An example attribute value using the possibility to maintain state amongst `attribute-function-interpolator` interpolator executions is: `"attribute-function-interpolator(/* state: counter = 1 */ module.exports = { result: ${{Entity:001}{active:001}} + counter, state: { counter: ++counter }};)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the times the interpolator has been run.
                * Last but not least, we have also incorporated the possibility to share state between distint `attribute-function-interpolator`s, this is, `attribute-function-interpolator`s with distinct associated Javascript code (since if it is the same, the state can be shared "locally" amongs all the instances of the same `attribute-function-interpolator` as previously described). To share state between distinct `attribute-function-interpolator`s no matter their specification or associated Javascript code, follow the next steps:
                    1. Assign initial values to the global state variables in the `globals` property of the simulation configuration. For example: `"globals": { "globalVar1": 1, "globalVar2": 2}`. This step is optional and its necessity depends on your specific `attribute-function-interpolator` Javascript code where, obviously, you should not access any non-declared variable.
                    2. The variables will be available to be used in all the `attribute-function-interpolator` instances of the simulation. Take into consideration that in case of using not valid variable names in the step 1 above (such as: `global-var-1`), you have to access the variables via the `global` variable, this is, instead of the not valid `global-var-1` variable name, use `global.global-var-1`.
                    3. Return the result the evaluation setting it as the value for the `module.exports.result` property.
                    4. Return the global state variables whose values you would like to update as properties of the object assigned to `module.exports.state.globals`. The global variables will be updated accordingly and passed to the next `attribute-function-interpolator` being executed.
                * A possible attribute value using the possibility to maintain global state between `attribute-function-interpolator` instances (no matter the Javascript code included in them): `"attribute-function-interpolator(module.exports = { result: ${{Entity:001}{active:001}} + globalVar1, state: { globals: { globalVar1: ++globalVar1 } }};)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the value of the `globalVar1` global state variable, which will be incremented in 1 and passed as incremented to the next execution of an `attribute-function-interpolator` interpolator.
                * It is important to note that global state variables (this is, amongst `attribute-function-interpolator` instances no matter their specification or associated Javascript code) and local state variables (this is, amongst `attribute-function-interpolator` instances with the same specification or associated Javascript code) can be combined following the guidelines detailed above. Notice that local state variables will impose over global state variables. This is, if a `attribute-function-interpolator` uses a local state variable with the same name as a global state variable, the local one will preserve and apply.
                * An accepted attribute value using the possibility to maintain local and global state amongst `attribute-function-interpolator` interpolator executions is: `"attribute-function-interpolator(/* state: counter = 1 */ module.exports = { result: ${{Entity:001}{active:001}} + counter + globalVar1, state: { counter: ++counter, globals: { globalVar1: ++globalVar1 } } };)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the times the interpolator has been run plus the value of the `globalVar1` state variable (which, on the other hand, is incremented globally in 1 before exiting the evaluation of the Javascript code).
                * **NOTE:** There is an [issue](https://github.com/abbr/deasync/issues/48) in the [`deasync`](https://www.npmjs.com/package/deasync) Node package which seems to break fast-forward simulations which make use of the `attribute-function-interpolator` in combination with entity attribute references (this is, `${{<entityId>}{<attributeName>}}` provoking a segmentation fault error. A workaround to avoid this issue is the use of global state variables updating the value of the attributes which need to be referenced and assigning their value to global state variables which make it possible to access them from any other `attribute-function-interpolator` instance.
        * **metadata**: Array of metadata information to be associated to the attribute on the update. Each metadata array entry is an object including 3 properties:
            * **name**: The metadata name.
            * **type**: The metadata type.
            * **value**: The metadata value. As the value of any metadata, all the possible accepted values for attributes (detailed above) can be used including the interpolators.
    * **staticAttributes**: List of attributes which will be included in every update of the entity. Static attributes are just like the active attributes previously described with 1 main remarks: they do not include a `schedule` property since the schedule of the updates of the entity and its attributes is determined by the `schedule` property at the active attributes level or the one specified at the entity level. Although staticAttributes may use any of the available interpolators as their `value` property, they typically include fixed values and no any type of interpolation.
    * **external**: Information about an external source from which to load, to transform and to register  data into a Context Broker instance. The `external` property includes the following sub-properties:
        * **body**: Optional. The body to be included into the requests sent to the external source to get the data.
        * **collector**: Mandatory. The `collector` property includes Javascript code used to transform the data loaded from an external source into an array of arrays, each of them including Javascript objects corresponding to the attributes to be updated or notified. This is, in case only one entity including a textual attribute called `attr-001` wants to be updated or notified, the `collector` code should return an array of arrays such as `[[{name: 'attr-001', type: "Text", value: "Some text value"}]]`. If more than 1 array of attributes are returned, a sequence of requests will be sent, each one of them including the attributes returned in each one of the returned arrays. The `collector` may `require()` NPM packages (previously declaring them in the `require` property) just as in the `attribute-function-interpolator` interpolator and should return its result (i.e., the array of arrays) assigning it to the `module.exports` variable. An `external` variable is injected into the `collector` property Javascript code including the simulation configuration `external` property contents of the concrete entity augmented with an additional `response` sub-property with the result of the request made to the external endpoint. An example value for the `collector` property is the following: `"var csvParse = require('csv-parse/lib/sync'); var data = external.response.body; var csvDataIndex = data.indexOf('\"Fecha y hora oficial'); var csvData = data.substring(csvDataIndex); var parsedCSVData = csvParse(csvData, {columns: true}); function getDate(dateString) { return new Date(dateString.substring(6,10), dateString.substring(3,5), dateString.substring(0,2), dateString.substring(11,13), dateString.substring(14));} var dateObserved = getDate(parsedCSVData[0]['Fecha y hora oficial']); module.exports = [[{name: 'dateObserved', type: 'DateTime', value: dateObserved}, {name: 'dateModified', type: 'DateTime', value: dateObserved}, {name: 'temperatura', type: 'Number', value: parsedCSVData[0]['Temperatura (�C)']}, {name: 'vientoVelocidad', type: 'Number', value: parsedCSVData[0]['Velocidad del viento (km/h)']}]];"`.
        * **headers**: Optional. An object including the headers to be added to the external source requests. A possible `headers` property is the following: `"headers": { "Cache-Control": "no-cache", "Content-Type": "application/json", "Accept": "application/json" }`.
        * **json**: Optional. A boolean with the same semantics as used in the `request` NPM package. This is: if `true`, 1) `body` must be a JSON-serializable object, 2) the `Content-type: application/json` header is automatically added to the requests and 3) the response body is parsed as JSON.
        * **method**: Mandatory. The HTTP method to be used in the request made to the external source endpoint. Accepted values: `GET` and `POST`.
        * **retry**:  Optional. Retry politics to be applied in case an error happens when requesting the data from the external source. It is an object including a `times` (with a default default value of 5) property to set the number of retries and an additional `interval` property (with a default default value of 0) to set the delay in milliseconds between the retries.
        * **url**: Mandatory. The URL where the requests for the external data should be sent to. The `url` entry accepts date templates so the final URLs can be composed dynamically. An accepted `url` property is the following: `"url": "http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24"`. The supported date templates include (obviously these templates can be combined in one concrete `url`):
            * `{YY}`: This template is substituted by the final 2 digits of the current year. For example, in 2017 the `url` with value `"http://www.example.com/{YY}"` will be finally generated as `"http://www.example.com/17"`.
            * `{YYYY}`: This template is substituted by all the digits which corresponds to the current year. For example, in 2017 the `url` with value `"http://www.example.com/{YYYY}"` will be finally generated as `"http://www.example.com/2017"`.
            * `{MM}`: This template is substituted by the 2 digits corresponding to the current month including a `0` at the beginning when appropriate. For example, in June the `url` with value `"http://www.example.com/{MM}"` will be finally generated as `"http://www.example.com/06"`.
            * `{M*}@en`: This template is subsituted by the whole name of the current month in uppercase in English. For example, in June the `url` with value `"http://www.example.com/{M*}@en"` will be finally generated as `"http://www.example.com/JUNE"`.
            * `{M*}@es`: This template is substituted by the whole name of the current month in uppercase in Spanish. For example, in June the `url` with value `"http://www.example.com/{M*}@es"` will be finally generated as `"http://www.example.com/JUNIO"`.
            * `{m*}@en`: This template is substituted by the whole name of the current month in lowercase in English. For example, in June the `url` with value `"http://www.example.com/{m*}@en"` will be finally generated as `"http://www.example.com/june"`.
            * `{m*}@es`: This template is substituted by the whole name of the current month in lowercase in Spanish. For example, in June the `url` with value `"http://www.example.com/{M*}@es"` will be finally generated as `"http://www.example.com/junio"`.
            * `{MMM}@en`: This template is substituted by the first 3 characters of the current month in uppercase in English. For example, in June the `url` with value `"http://www.example.com/{MMM}@en"` will be finally generated as `"http://www.example.com/JUN"`.
            * `{MMM}@es`: This template is substituted by the first 3 characters of the current month in uppercase in Spanish. For example, in June the `url` with value `"http://www.example.com/{MMM}@es"` will be finally generated as `"http://www.example.com/JUN"`.
            * `{mmm}@en`: This template is substituted by the first 3 characters of the current month in lowercase in English. For example, in June the `url` with value `"http://www.example.com/{mmm}@en"` will be finally generated as `"http://www.example.com/jun"`.
            * `{mmm}@es`: This template is substituted by the first 3 characters of the current month in lowercase in Spanish. For example, in June the `url` with value `"http://www.example.com/{mmm}@es"` will be finally generated as `"http://www.example.com/jun"`.
            * `{DD}`: This template is substituted by the current day of the month including a `0` at the beginning when appropriate. For example, on the 5th, the `url` with value `"http://www.example.com/{DD}"` will be finally generated as `"http://www.example.com/05"`.
            * `{DD-1}`: This template is substituted by the day before of the current day of the month, including a `0` at the beginning when appropriate. For example, on the 5th, the `url` with value `"http://www.example.com/{DD}"` will be finally generated as `"http://www.example.com/04"`.
            * `{D*}@en`: This template is substituted by the whole name of the current day of the week in English. For example, on Wednesday, the `url` with value `"http://www.example.com/{D*}@en"` will be finally generated as `"http://www.example.com/WEDNESDAY"`.
            * `{D*}@es`: This template is substituted by the whole name of the current day of the week in Spanish. For example, on Wednesday, the `url` with value `"http://www.example.com/{D*}@es"` will be finally generated as `"http://www.example.com/MIÉRCOLES"`.
            * `{DDD}@en`: This template is substituted by the first letters of the name of the current day of the week in uppercase in English. For example, on Wednesday, the `url` with value `"http://www.example.com/{DDD}@en"` will be finally generated as `"http://www.example.com/WED"`.
            * `{DDD}@es`: This template is substituted by the first letters of the name of the current day of the week in uppercase in Spanish. For example, on Wednesday, the `url` with value `"http://www.example.com/{DDD}@es"` will be finally generated as `"http://www.example.com/MIÉ"`.
            * `{ddd}@en`: This template is substituted by the first letters of the name of the current day of the week in lowercase in English. For example, on Wednesday, the `url` with value `"http://www.example.com/{ddd}@en"` will be finally generated as `"http://www.example.com/wed"`.
            * `{ddd}@es`: This template is substituted by the first letters of the name of the current day of the week in lowercase in Spanish. For example, on Wednesday, the `url` with value `"http://www.example.com/{ddd}@es"` will be finally generated as `"http://www.example.com/mié"`.
            * `{hh}`: This template is substituted by the current hour in 24-hours format including a `0` at the beginning when appropriate. For example, at 10 PM, the `url` with value `"http://www.example.com/{hh}"` will be finally generated as `"http://www.example.com/22"`.
            * `{mm}`: This template is substituted by the current minutes including a `0` at the beginning when appropriate. For example, at 10:05 PM, the `url` with value `"http://www.example.com/{mm}"` will be finally generated as `"http://www.example.com/05"`.
            * `{hh}`: This template is substituted by the current seconds including a `0` at the beginning when appropriate. For example, at 10:05:09 PM, the `url` with value `"http://www.example.com/{ss}"` will be finally generated as `"http://www.example.com/09"`.
* **devices**: Information about the devices to be updated during this concrete simulation. The `devices` entries are just like the previous `entities` entries described above with the following modifications:
    1. Instead of the `entity_name`, a `device_id` has to be specified (in case the `count` property is used, the `device_id` property is set just like the `entity_name` as describe above in the `count` property description).
    2. A `protocol` property has to be set specifying the device protocol. Accepted values are: `UltraLight::HTTP`, `UltraLight::MQTT`, `JSON::HTTP` and `JSON::MQTT`.
    3. No `entity_type` property has to be specified.
    4. An `api_key` property has to be set specifying the API key to be used when updating the device attributes.
    5. Instead of the `active` and `staticAttributes` property, an `attributes` properties has to be included specifying the array of attributes to be updated. At the `attributes` level:
        1. No `name` property has to be specified. Instead the `object_id` has to be set specifying the attribute object (short) identifier.
        2. No `type` property has to be specified.
        3. All the previously describe interpolators can be used in the `value`.

To avoid repeating over and over again the same text in the simulation configuration files and, mainly, to facilitate editing them, a templating mechanism has been included. This templating mechanism makes it posible to use the `imports()` directive as the value of any property of a simulation configuration JSON file. As a preliminary process before starting the simulation all these `imports()` directives will be resolved and substituted by their concrete values.

Let's see this `imports()` directive mechanism with an example. The next one is a valid simulation configuration file using the templating mechanism:

```json
{
  "exports": {
    "contextBroker_NGSIv1": {
      "protocol": "https",
      "host": "1.2.3.4",
      "port": 1026,
      "ngsiVersion": "1.0"
    },
    "every 5 seconds": "*/5 * * * * *",
    "autoincrement_1": "attribute-function-interpolator(${{Entity:001}{active:001}} + 1)",
  },
  "domain": {
    "service": "service",
    "subservice": "subservice"
  },
  "contextBroker": "import(contextBroker_NGSIv1)",
  "authentication": "import(authentication)",
  "entities": [
    {
      "schedule": "import(every 5 seconds)",
      "entity_name": "Entity:001",
      "entity_type": "Entity",
      "active": [
        {
          "name": "active:001",
          "type": "Number",
          "value": "import(autoincrement_1)"
        }
      ]
    }
  ]
}
```

For example, the import directives: `import(contextBroker_NGSIv1)`, `import(every 5 seconds)` and `import(autoincrement_1)` will be substituted by the corresponding values declared in the `exports` property of the simulation configuration file, whereas the `import(authentication)` (since it is not declared in the `exports`) property will be `require`d as the file `authentication.json` from the root of the FIWARE Device Simulator application (this is, it is equivalent to `require(${FIWARE_Device_Simulator_Root_Path}/authentication.json))`.

The previous and preliminary support for importing content into specific parts of the simulation configuration files has been recently extended to support conditional imports. In this case, it is possible to impose conditions which must be satisfied for the import to take place. The format of the conditional imports is the following one:

```json
"<template-name>": [
  {
    "condition": "${{<entity-property-1>==<regular-expression-1>}}",
    "content": "the-content-to-import-a-string-in-this-case"
  },
  {
    "condition": "${{<entity-property-2>==<regular-expression-2>}{<attribute-property-2>==<regular-expression-2>}}",
    "content": "the-content-to-import-a-string-in-this-case"
  }
]
```

As you can see, the templates can now be an array of objects including a `condition` and a `content` properties in which case the import will only take place if the `import()` directive appears inside an entity which satisfies the `<entity-property-1>==<regular-expression-1>` condition (this is, the `<entity-property1->` value satisfies the `<regular-expression-1>`) OR appears inside an attribute which satisfies the `<attribute-property-2>==<regular-expression-2>` condition (this is, the `<attribute-property-2>` value satisfies the `<regular-expression-2>`) inside an entity which satisfies the `<entity-property-2>==<regular-expression-2>` condition (this is, the `<entity-property-2>` value satisfies the `<regular-expression-2>`).

Let's see it in a concrete example. Considering a simulation configuration file such as the following one:

```json
{
  "exports": {
    "every 5 seconds": "*/5 * * * * *",
    "parking from 6 to 22": "text-rotation-interpolator({\"units\": \"hours\", \"text\": [[0,\"closed\"],[6,[[40,\"free\"],[60,\"occupied\"]]],[19,[[80,\"free\"],[20,\"occupied\"]]],[22,\"closed\"]]})",
    "now": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})",
    "entity-type": [
      {
        "content": "ParkingSpot",
        "condition": "${{entity_name==pe-moraleja-01-group-0[0-9]:0[0-9]}}"
      }
    ],
    "attribute-type-1": [
      {
        "content": "Text",
        "condition": "${{entity_name==pe-moraleja-01-group-02:0[0-9]}}"
      },
      {
        "content": "DateTime",
        "condition": "${{entity_name==pe-moraleja-01-group-01:0[0-9]}{name==dateModifie[a-z]}}"
      }
    ]
  },
  ...
  "entities": [
    {
      "schedule": "import(every 5 seconds)",
      "entity_name": "pe-moraleja-01-group-01:01",
      "entity_type": "import(entity-type)",
      "active": [
        {
          "name": "status",
          "type": "Text",
          "value": "import(parking from 6 to 22)"
        },
        {
          "name": "dateModified",
          "type": "import(attribute-type-1)",
          "value": "import(now)"
        }
      ]
    },
    {
      "schedule": "import(every 5 seconds)",
      "entity_name": "pe-moraleja-01-group-02:01",
      "entity_type": "import(entity-type)",
      "active": [
        {
          "name": "status",
          "type": "import(attribute-type-1)",
          "value": "import(parking from 6 to 22)"
        },
        {
          "name": "dateModified",
          "type": "DateTime",
          "value": "import(now)"
        }
      ]
    }
  ]
  ...
}
```

After resolving the imports, the simulation configuration file will end up as the following one:

```json
{
  ...
  "entities": [
    {
      "schedule": "*/5 * * * * *", // -> IMPORTED
      "entity_name": "pe-moraleja-01-group-01:01",
      "entity_type": "ParkingSpot", // -> IMPORTED
      "active": [
        {
          "name": "status",
          "type": "Text",
          "value": "text-rotation-interpolator({\"units\": \"hours\", \"text\": [[0,\"closed\"],[6,[[40,\"free\"],[60,\"occupied\"]]],[19,[[80,\"free\"],[20,\"occupied\"]]],[22,\"closed\"]]})" // -> IMPORTED
        },
        {
          "name": "dateModified",
          "type": "DateTime", // -> IMPORTED
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})" // -> IMPORTED
        }
      ]
    },
    {
      "schedule": "*/5 * * * * *", // -> IMPORTED
      "entity_name": "pe-moraleja-01-group-02:01",
      "entity_type": "ParkingSpot", // -> IMPORTED
      "active": [
        {
          "name": "status",
          "type": "Text", // -> IMPORTED
          "value": "text-rotation-interpolator({\"units\": \"hours\", \"text\": [[0,\"closed\"],[6,[[40,\"free\"],[60,\"occupied\"]]],[19,[[80,\"free\"],[20,\"occupied\"]]],[22,\"closed\"]]})" // -> IMPORTED
        },
        {
          "name": "dateModified",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})" // -> IMPORTED
        }
      ]
    }
  ]
  ...
}
```

Just as in the case of the textual imports, the conditional imports can be declared in the `exports` property of the simulation configuration file or in external JSON files which can be imported.

Obviously, if an import directive refers to a template not declared either in the `exports` property or in an external JSON file, an error is thrown and the simulation is not run. On the other hand, if all the substitutions take place fine and the resulting simulation configuration file is valid, the simulation is run.

Although the FIWARE Device Simulator command line tool (i.e., [`fiwareDeviceSimulatorCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorCLI)) includes support for the import mechanism just described, we have also included a specific command line tool for the import mechanism which transpiles an input simulation configuration file into an output configuration file including the resolved imports (i.e., [`fiwareDeviceSimulatorTranspilerCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorTranspilerCLI)). Check the `Command line tools` section for further details on both command line tools.

Last but not least, the [`./examples`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/examples) directory includes some real examples of simulation configuration files used to simulate distinct scenarios.

## Using environment variables in simulation file

The simulation configuration file may use an `.env` file to set configuration in the form of environment variables. This can be used to avoid setting
sensitive information, and be executed in whatever environment, having different configurations and not been needed to change anything on code.

Here's an example of `.env` file with the commonly environment variables used:

AUTH_PASS="pass"
AUTH_USER="user"
AUTH_PORT=5001
AUTH_HOST="localhost"

DOMAIN_SERVICE="service"
DOMAIN_SUBSERVICE="/subservice"

CB_HOST="localhost"
CB_PORT=1026

IOTA_ULTRALIGHT_API="1ifhm6o0kp4ew7fi377mpyc3c"
IOTA_ULTRALIGHT_HTTP_HOST="localhost"
IOTA_ULTRALIGHT_HTTP_PORT=8085
IOTA_ULTRALIGHT_MQTT_HOST="localhost"
IOTA_ULTRALIGHT_MQTT_PORT=1833
IOTA_ULTRALIGHT_MQTT_USER="mqttUser"
IOTA_ULTRALIGHT_MQTT_PASS="mqttPassword"

IOTA_JSON_API="83ut64ib3gzs6km6izubjyenu"
IOTA_JSON_HTTP_HOST="localhost"
IOTA_JSON_HTTP_PORT=8185
IOTA_JSON_MQTT_HOST="localhost"
IOTA_JSON_MQTT_PORT=1883
IOTA_JSON_MQTT_USER="mqttUser"
IOTA_JSON_MQTT_PASS="mqttPassword"
```

To use a environment variable on the configuration file, it's needed to be setted around `${}` having as result `${VARIABLE}`.

An example simulation configuration file using environment variables is shown next to give you a glimpse of its shape:

```json
{
  "domain": {
    "service": "${DOMAIN_SERVICE}",
    "subservice": "${DOMAIN_SUBSERVICE}"
  },
  "contextBroker": {
    "protocol": "http",
    "host": "${CB_HOST}",
    "port": "${CB_PORT}",
    "ngsiVersion": "2.0"
  },
  "authentication": {
    "provider": "keystone",
    "protocol": "http",
    "host": "${AUTH_HOST}",
    "port": "${AUTH_PORT}",
    "user": "${AUTH_USER}",
    "password": "${AUTH_PASS}",
    "retry": {
      "times": 10,
      "interval": 1000
    }
  },
  "iota": {
    "ultralight": {
      "api_key": "${IOTA_ULTRALIGHT_API}",
      "http": {
        "protocol": "http",
        "host": "${IOTA_ULTRALIGHT_HTTP_HOST}",
        "port": "${IOTA_ULTRALIGHT_HTTP_PORT}"
      },
      "mqtt": {
        "protocol": "mqtt",
        "host": "${IOTA_ULTRALIGHT_MQTT_HOST}",
        "port": "${IOTA_ULTRALIGHT_MQTT_PORT}",
        "user": "${IOTA_ULTRALIGHT_MQTT_USER}",
        "password": "${IOTA_ULTRALIGHT_MQTT_PASS}"
      }
    },
    "json": {
      "api_key": "${IOTA_JSON_API",
      "http": {
        "protocol": "http",
        "host": "${IOTA_JSON_HTTP_HOST}",
        "port": "${IOTA_JSON_HTTP_PORT}"
      },
      "mqtt": {
        "protocol": "mqtt",
        "host": "${IOTA_JSON_MQTT_HOST}",
        "port": "${IOTA_JSON_MQTT_PORT}",
        "user": "${IOTA_JSON_MQTT_USER}",
        "password": "${IOTA_JSON_MQTT_PASS}"
      }
    }
  }
}
```
