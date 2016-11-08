# <a name="top">FIWARE Device Simulator</a>

* [Introduction](#introduction)
* [FIWARE Device Simulator CLI tool](#fiware-device-simulator-cli-tool)
    * [Simulation configuration file](#simulation-configuration-file)
* [FIWARE Device Simulator library](#fiware-device-simulator-library)
* [Development documentation](#development-documentation)
    * [Project build](#project-build)
    * [Testing](#testing)
    * [Coding guidelines](#coding-guidelines)
    * [Continuous testing](#continuous-testing)
    * [Source code documentation](#source-code-documentation)
    * [Code coverage](#code-coverage)
    * [Code complexity](#code-complexity)
    * [PLC](#plc)
    * [Development environment](#development-environment)
    * [Site generation](#site-generation)
* [Contact](#contact)

## Introduction

The FIWARE Device Simulator is a tool to generate data for the FIWARE ecosystem in the shape of entities and its associated attributes.

The FIWARE Device Simulator is composed of 2 main elements:

1. A **CLI tool** to run FIWARE-compatible devices.
2. The **device simulator library** itself.

Let's cover each one of them.

[Top](#top)

## FIWARE Device Simulator CLI tool

The FIWARE Device Simulator CLI tool is located in the [./bin](./bin) directory and it is called [`fiwareDeviceSimulatorCLI`](./bin/fiwareDeviceSimulatorCLI.js).

Before running the FIWARE Device Simulator CLI tool, you have to resolve and to download the Node package dependencies at least once. To do it, execute:

```bash
npm install
```

To run the FIWARE Device Simulator CLI tool just run:

```bash
./bin/fiwareDeviceSimulatorCLI
```

This will show the FIWARE Device Simulator CLI tool help which will guide you to learn how to properly use it:

```
Usage: fiwareDeviceSimulatorCLI [options]

  Options:

    -h, --help                                     output usage information
    -V, --version                                  output the version number
    -c, --configuration <configuration-file-path>  Absolute or relative path (from the root of the Node application) to the device simulator configuration file (mandatory)
    -d, --delay <milliseconds>                     The delay in milliseconds for future updates when the number of update requests waiting for response is bigger than the value set with the -m option (defaults to 1 second if -m is set and -d is not set, it has no effect if -m is not set)
    -m, --maximumNotRespondedRequests <requests>   The maximum number of update requests not responded before applying delay
    -p, --progressInfoInterval <milliseconds>      The interval in milliseconds to show progress information  for fast-forward simulation
    -s, --silent                                   No progress information will be output by the console
    -w, --dweet <dweetConfiguration>               Configuration information to publish the simulation progress information in dweet.io (it must be an object containing a 'name' property for the dweet thing and optionally an 'apiKey' property in case the thing is locked, for example: -w "{\"name\": \"fds:Test:001\"}")
    -l, --timeline <googleSheetsConfiguration      Configuration information to publish the scheduled updates into Google Sheets for its visualization as a Timeline Google Chart in Freeboard.io (it must be an object including a 'sheetKey' property for the long Google Sheet key where the data will be stored, a 'credentialsPath' property for the path to the Google generated credentials (more information about how to generate this credentials is available in the documentation), a 'dateFormat' property for the date format used by Google Sheets in your locale according to the dateformat NPM package (for further information, please visit: https://github.com/felixge/node-dateformat#mask-options) and a 'refreshInterval' property for the minimum interval in milliseconds the scheduled updates will be refreshed in the associated Google Sheet (i.e., the Google Sheet will be udpated in the next progress information tick (see the -p option) once this interval has passed since the last refresh), for example: -l "{\"sheetKey": \"1rGEpgC38kf_AC7FFlM71wev_-fKeuPKEOTvVY9I7e2Y", \"credentialsPath\": \"FIWARE Device Simulator-f11816817451.json\", \"dateFormat": \"dd/mm/yyyy HH:MM:ss\", \"refreshInterval\": 15000}")
    -f, --from <fromDate>                          The start date to begin the fast-forward simulation (if not set, the current time will be used)
    -t, --to <toDate>                              The end date to stop the fast-forward simulation (if not set, the fast-forward will progress to the future and never end)
```

As you can see, the FIWARE Device Simulator CLI tool requires the path to a simulation configuration file detailing the simulation to be run. This simulation configuration file is the cornerstone of the FIWARE Device Simulator tool and is detailed in the next section.

On the other hand, the FIWARE Device Simulator CLI tool supports a fast-forward simulation functionality which makes it possible to run the simulation from some date to certain date (in the past or in the future). Time will move forward automatically from the `from` date to the `to` date updating entities or sending device updates accordingly.

In the case of fast-forward simulations, it is possible to control the number of requests sent to the Context Broker per second using the `-m` and `-d` options. Usually setting the `-m` is more than enough. Increase the value passed to the `-m` option to increase the throughput, in case the Context Broker or IoT Agents you are sending requests to is able to deal with it.

When running fast-forward simulations which make use of the `attribute-function-interpolator` using the value of attributes hosted by the Context Broker instance, it is recommended to pass `0` as the `-m` option. This will assure that new updates will not be sent to the Context Broker until the previous one has been completed and the value of the attributes associated to this previous request have been updated by the Context Broker. This is important in case of updates where the attribute values depend on the values updated by previous requests.

In case you would like to get information about the evolution of the simulation, use the `-p` option passing the number of milliseconds between progress information updates. Set the `-s` option if you do not want the progress information to be output by the console. You can use the `-w` option in case you want to "dweet" the simulation progress information to visualize it directly in [dweet.io](https://dweet.io) (using the `name` you set to your "dweeting thing") or in [Freeboard.io](https://freeboard.io) (please, feel free to clone the [FIWARE Device Simulator Dashboard](https://freeboard.io/board/3_oiiw) updating its Dweet data source to your "dweeting thing"'s `name` to visualize your simulation progress information or use the [FIWARE Device Simulator Dashboard (extended)](https://freeboard.io/board/VLtliw) also updating its Dweet data source to your "dweeting thing"'s `name` in case you want to also visualize the evolution of the values assigned to some entities' attributes (we have included a couple of entities with a couple of attributes each as an example, please update their associated data sources accordingly)).

Combined with the previous `-p` option previously described, it is also possible to visualize your "simulations DNA", this is the attribute and entity updates your simulation schedules for a future execution. To do it, please follow these steps:

1. Once authenticated in Google, visit the [Google Sheets](https://docs.google.com/spreadsheets) website.
2. Create a new Google Sheets document clicking on the `+` button on the lower right area of the page.
3. The URL of this new Google Sheet document will be something such as: https://docs.google.com/spreadsheets/d/1SvLfPobfq8VM0eJZweEIty8SosEs8ODmarV8EwmZPks/edit#gid=0 Please, take a note of the Google Sheet document key which is between the `https://docs.google.com/spreadsheets/d/` and `/edit#gid=0` sections.
4. Share this Google Sheet document and make it accessible via link for edition or writing, not only read access, clicking on the `Share` button on the upper right area of the page.
5. Navigate to your [Google Developer Console project section](https://console.developers.google.com/iam-admin/projects).
6. Create a new project called, for example: `FIWARE Device Simulator`. You can choose any other name, of course. Once the new project is created, the page will navigate to your new project's console.
7. Search for the `Google Sheets API`, click on it and enabled it clicking on the `ENABLE` link.
8. Click on the `Go to Credentials` button on the upper right area of the page.
9. In the `Where will you be calling the API from?` selection, select the `Web server (e.g. node.js, Tomcat)` option.
10. From the `What data will you be accessing?` options, enable the `Application data (access data belonging to your own application)` option.
11. From the `Are you using Google App Engine or Google Compute Engine?` options, enable the `No, I'm not using them.` unless you are using them to run the simulator.
12. Click on the `What credentials do I need?` button.
13. In the `Service account name` input field, type a service name, for example: `FIWARE Device Simulator`. You can choose any other name, of course.
14. In the `Role` selection, select the role. If you are the owner of the Google Sheet, select `Project` -> `Owner`. If you are not the owner of the Google Sheet, select `Project` -> `Editor`.
15. In the `Key type` section, enable the `JSON (recommended)` options if not currently enabled.
16. Click on the `Continue` button. A JSON file with your credentials will start downloading. Save it to some secure place since you will need it to run the simulations to be able to visualize the scheduled updates.
17. Clone the [FIWARE Device Simulator Dashboard (timeline)](https://freeboard.io/board/kUdbXw).
18. Update its Dweet data source to your "dweeting thing"'s `name`. The one which will be passed in the `-w` option of the command line tool. For example: `fds:Test:1234`.
19. Run the simulator comand line tool using the `-p`, `-w`, and `-l` options passing the data you fetched throughout the previous steps (mainly, the Dweet thing name, the Google Sheet document key and the path to your Google credentials), for example: `./bin/fiwareDeviceSimulatorCLI -c simulation-5s-2-attributes.json -p 5000 -w "{\"name\": \"fds:Test:1234\"}" -s -l "{\"sheetKey\": \"1SvLfPobfq8VM0eJZweEIty8SorEs8ODmarV8EwmZPks\", \"credentialsPath\": \"FIWARE Device Simulator-f11816817451.json\", \"dateFormat\": \"dd/mm/yyyy HH:MM:ss\", \"refreshInterval\": 15000}"`. Notice that as part of the timeline option a data format is included. This is needed since Google Sheets uses distinct formats depending on the concrete locale. To check the one you should use, navigate to any Google Sheet document, click on the `Format` menu entry, hover the `Number` menu item and check the `Date time` format you should use according to this mask options: https://github.com/felixge/node-dateformat#mask-options.
20. Your simulation scheduled updates will appear in the `SCHEDULED UPDATES TIMELINE` widget. Hover over the blue bars to get further information about the scheduled update. It will include the date and time when this update is scheduled, the entity name and the attribute names which will be updated.

The Google Sheet document is only used to store the scheduled updates and can be reused amongst distinct simulation runs. If you want to run seveval simulations at the same time with scheduled updates timeline visualization, you will need a concrete Google Sheet document for each one of them. No need to say that you can reuse the same Google credentials to update distinct Google Sheet documents in case those credentials have the permissions to do so and the target Google Sheet document is shared by link as mentioned in 4. 

Since the FIWARE Device Simulator CLI tool uses the [logops](https://www.npmjs.com/package/logops) package for logging, the logging level can be set using the `LOGOPS_LEVEL` environment variable. On the other hand, the logging format can be set using the `LOGOPS_FORMAT` environment variable.

**NOTE:** There is an [issue](https://github.com/abbr/deasync/issues/48) in the [`deasync`](https://www.npmjs.com/package/deasync) Node package which seems to break fast-forward simulations which make use of the `attribute-function-interpolator` in combination with entity attribute references (this is, `${{<entityId>}{<attributeName>}}` provoking a segmentation fault error. A workaround to avoid this issue is the use of global state variables updating the value of the attributes which need to be referenced and assigning their value to global state variables which make it possible to access them from any other `attribute-function-interpolator` instance.

[Top](#top)

### Simulation configuration file

The simulation configuration file is a JSON-formatted text file detailing the characteristics of the device simulation which will be run.

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
  			"value": "multiline-position-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"
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
* **require**: An array of names and/or paths of NPM packages to be required before running the simulation. This property is related to the `attribute-function-interpolator` detailed below. It makes it possible to `require()` these NPM packages directly in the code associated to these `attribute-function-interpolator`.
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
            1. **`date-increment-interpolator`**: It returns dates in UTC format. On the other hand, it accepts a JSON object including 2 properties: 1) `origin` (the date from when the date will be incremented or `now` for the current date when the value is interpolated) and 2) `increment` (the number of seconds the origin should incremented by. For example, a date increment interpolator specification such as: `{\"origin\": \"now\", \"increment\": 86400}` will return the current hour incremented in `86400` seconds, this is, 1 day, when the interpolated value is requested to be updated. A valid attribute value using the `date-increment-interpolator` is: `date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})`.
            2. **`multiline-position-interpolator`**: It returns the current position of a mobile object for the current [decimal hour](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) as a GeoJSON geometry of type `Point` including its `coordinates`. On the other hand, it takes an object including the following properties:
                * `coordinates`: an array of points, this is, an array of 2 element arrays corresponding to the longitude and the latitude of the points. The connection between this points determine the line or route the mobile object will be traveling. It can be a circular or not circular route (in this case the mobile object will start the route from the beginning once the end is reached).
                * `speed`: an object including the following properties:
                    * `value`: a number corresponding to the speed at which the mobile object will be moving
                    * `units`: a string corresponding to the speed units. Valid values are `km/h` (kilometers per hour) and `mi/h` (miles per hour).
                * `time`: an object including the following properties:
                    * `from`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) from which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is before the `from` one, the interpolated position will be the starting point.
                    * `to`: a number corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) until which the mobile object will be moving. If the current [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) is after the `to` one, the traveled distance will be calculated until this one.
                * A valid attribute value using the `multiline-position-interpolator` is: `"multiline-position-interpolator({\"coordinates\": [[-6.2683868408203125,36.48948933214638],[-6.257915496826172,36.46478162030615],[-6.252079010009766,36.461744374732085],[-6.2162017822265625,36.456774079889286]],\"speed\": {\"value\": 30,\"units\": \"km/h\"},\"time\": {\"from\": 10,\"to\": 22}})"`.
            3. **`time-linear-interpolator`**: It returns float or integer values depending on the configuration. On the other hand, it accepts an object including the following properties:
                * `spec`: An array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time linear interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.125` if the interpolated value is requested at the `10:00` hours according to a linear interpolation between `0` and `20` as the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in the x-axis. This is the reason why a `time-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day.
                * `return`: It is an object including the following properties:
                    * `type`: The interpolator return type. It can take any of the following values: `float` or `integer`.
                    * `rounding`: If the type is equal to `integer`, the rounding mechanism must also be specified. It can take any of the following values: `ceil`, `floor` or `round`.
                * A valid attribute value using the `time-linear-interpolator` is: `"time-linear-interpolator({\"spec\": [[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `time-linear-interpolator({\"spec\": [[8,0],[12,100],[22,0]], \"return\": {\"type\": \"float\"}})`, in this case and due to its linear nature values for decimal hours from 0 to 8 will be negative (linearly), values for decimal hours from 8 to 12 will be between 0 and 100 (linearly), values for decimal hours from 12 to 22 will be between 100 and 0 (linearly), and again values for decimal hours from 22 to 24 will be negative (linearly).
            4. **`time-random-linear-interpolator`**: It returns float or integer values depending on the configuration. On the other hand, it accepts an object including the following properties:
                * `spec`: An array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value.
                    * The first element of the array or decimal hours may include the `random()` directive. For example, a random time linear interpolator specification such as: `[[random(0,1),0],[random(23,24),100]]` will behave as a `time-linear-interpolator` where the random part will be substituted for a concrete random decimal hours value each time this interpolator is invoked. For example, subsequent invocations of the previous interpolator may end up behaving such as the following `time-linear-interpolator`s: `[0.410237338161096,0],[23.268972319317982,100]]`, `[0.192138821585104,0],[23.442964296089485,100]]`, `[0.223540030419827,0],[23.614114402793348,100]]`, etc.
                        * A valid attribute value using the `time-random-linear-interpolator` is: `"random-time-linear-interpolator({\"spec\": [[random(12,13),0],[random(20,21),100]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                        * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `random-time-linear-interpolator({\"spec\": [[random(12,13),10],[random(20,21),100]], \"return\": {\"type\": \"float\"}})`, in this case and due to its linear nature values for decimal hours from 0 to 12 will be below 10 (linearly, including the randomness factor it may go beyond the 12 decimal hour) including negative values, values for decimal hours from the 13 to the 20 will be between 0 and 100 (linearly and according to the randomness factor it may go before the 13 and beyond the 20 decimal hours), values for decimal hours from 21 to 24 will be greater than 100 (linearly and according to the randomness factor it may be before the 21 decimal hour).
                    * The second element of the array or specified value may include the `random()` directive. For example, a time random linear interpolator specification such as: `[[0,0],[20,random(0.25,0.50)],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, a random number bigger than `0.25` and smaller than `0.50` if the interpolated value is requested at the `20:00` hours and the corresponding interpolated value between the previous y-axis values if it is requested at a time between the `00:00` hours and the `20:00` hours. This is the reason why a `time-random-linear-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day.
                        * A valid attribute value using the `time-random-linear-interpolator` is: `"time-random-linear-interpolator({\"spec\": [[0,0],[20,random(25,45)],[21,random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"`.
                        * It is important to note that since this interpolator is a linear one (more concretely it leans on the [`linear-interpolator` package](https://www.npmjs.com/package/linear-interpolator)), if some of the entries for the starting (0, 1, 2, etc.) or ending hours (22, 23, 24) are missing, the behavior may not be the one expected. Let's see it with a concrete example: `"time-random-linear-interpolator({\"spec\": [[8,random(0,10)],[12,random(90,100)],[22,random(0,10)]], \"return\": {\"type\": \"float\"}})"`, in this case and due to its linear nature values for decimal hours from 0 to 8 will be below 10 (linearly including the randomness factor) including negative values, values for decimal hours from 8 to 12 will be between 0 and 100 (linearly and according to the randomness factor), values for decimal hours from 12 to 22 will be between 100 and 0 (linearly and according to the randomness factor), and again values for decimal hours from 22 to 24 will be below 10 (linearly and according to the randomness factor) including negative values.
                    * The `random()` directive can be used in the first element of the array specification, in the second one or in both in which case the behavior is the combined one. Consequently, `"time-random-linear-interpolator({\"spec\": [[random(0,1),0],[20,random(25,45)],[random(21,22),random(50,75)],[22,100],[24,0]], \"return\": {\"type\": \"integer\", \"rounding\": \"ceil\"}})"` is a perfectly valid `time-random-linear-interpolator`.
                * `return`: It is an object including the following properties:
                    * `type`: The interpolator return type. It can take any of the following values: `float` or `integer`.
                    * `rounding`: If the type is equal to `integer`, the rounding mechanism must also be specified. It can take any of the following values: `ceil`, `floor` or `round`.
            5. **`time-step-after-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time step after interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-after"). This is the reason why a `time-step-after-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day. A valid attribute value using the `time-step-after-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            6. **`time-step-before-interpolator`**: It returns float values. On the other hand, it accepts an array of 2 elements arrays corresponding to the [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) of the day and its specified value. For example, a time step before interpolator specification such as: `[[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]]` will return `0` if the interpolated value is requested at the `00:00` hours, `0.25` if the interpolated value is requested at the `20:00` hours and `0.25` if the interpolated value is requested at any time between the `00:00` hours and the `20:00` hours (notice it is called "step-before"). This is the reason why a `time-step-before-interpolator` is typically specified providing values for the `0` and `24` values in the x-axis according to the available [decimal hours](https://en.wikipedia.org/wiki/Decimal_time#Decimal_hours) in any day. A valid attribute value using the `time-step-before-interpolator` is: `time-step-before-interpolator([[0,0],[20,0.25],[21,0.50],[22,0.75],[23,1],[24,1]])`.
            7. **`text-rotation-interpolator`**: It returns a string from a set of possible values with support for probabilistic occurrences of them. On the other hand, it accepts an object including the following properties:
                * `units`: It is a string which affects the `text` property detailed below. It accepts the following values: `seconds`, `minutes`, `hours`, `days` (day of the week), `dates` (day of the month), `months` and `years`.
                * `text`: It is an array of 2 elements arrays. The first element is the number of `seconds` (from 0 to 59), `minutes` (from 0 to 59), `hours` (from 0 to 23), `days` (from 0 to 6), `dates` (from 1 to 31), `months` (from 0 to 11) and `years` (full year) (according to the `units` property) from which the specified text will be returned for the current date and time. The second element can be a string corresponding to the text to be returned or an array of 2 elements arrays. The first element of this second 2 elements array is the probability (from 0 to 100) of the occurrence of the text specified as the second element of the array. The addition of the first elements array must be 100.
                * A valid attribute value using the `text-rotation-interpolator` is: `"text-rotation-interpolator({\"units\": \"seconds\", \"text\": [[0,\"PENDING\"],[15,\"REQUESTED\"],[30,[[50,\"COMPLETED\"],[50,\"ERROR\"]]],[45,\"REMOVED\"]]})"`. For example, according to this text rotation interpolation specification, if the current time seconds is between 0 and 15 it will return the value `PENDING`, if it is between 15 and 30 it will return the value `REQUESTED`, if it is between 30 and 45 it will return the value `COMPLETED` with a probability of 50% and `ERROR` with a probability of 50%.
            8. **`attribute-function-interpolator`**: It returns the result of the evaluation of some Javascript code. This code may include references to any entity's attributes values stored in the Context Broker. This interpolator accepts a string (properly escaped) with the Javascript code to evaluate. In this Javascript code, references to entity's attribute values may be included using the notation: `${{<entity-id>:#:<entity-type>}{<attribute-name>}}`, substituting the `<entity-id>`, `<entity-type>` and `<attribute-name}` by their concrete values. Take into consideration that the type specification of the entity (i.e., `:#:<entity-type>`, including the `:#:` separator) is optional and can be omitted, in which case the entity type will not be considered when retrieving the entity and the corresponding attribute value from the Context Broker.
                * A valid attribute value using the `attribute-function-interpolator` is: `"attribute-function-interpolator(${{Entity:001}{active:001}} + Math.pow(${{Entity:002}{active:001}},2))"`.
                * An advanced feature incorporated to the `attribute-function-interpolator` is the possibility to `require` packages directly in the Javascript code to be evaluated. Obviously, all the capabilities related to referencing entity attributes are supported too in this case. To use it, please follow the next steps:
                    1. Include a `require` property in your simulation configuration file setting its value to an array including the names and/or paths of the NPM packages you will be using in any of your `attribute-function-interpolator` interpolators. These packages will be required before proceding with the simulation and made available to your `attribute-function-interpolator` code which uses them. For example: `"require": ["postfix-calculate"]`.
                    2. The result of the evaluation of your code should be assigned to the `module.exports` property (this is due to the fact that this functionality leans on the [`eval` NPM package](https://www.npmjs.com/package/eval) which imposes this restriction).
                * A valid attribute value using this advanced mode of the `attribute-function-interpolator` is: `"attribute-function-interpolator(var postfixCalculate = require('postfix-calculate'); module.exports = postfixCalculate('${{Entity:001}{active:001}} 1 +');)"`, where the result of the evaluation (this is, the value assigned to `module.exports`) will be the result of adding 1 to the value of the `active:001` attribute of the `Entity:001` entity, according to the [`postfix-calculate` NPM](https://www.npmjs.com/package/postfix-calculate) functionality.
                * Sometimes it is useful to have access to the simulation date (mainly in case of fast-forward simulations (more information about fast-forward simulations below)), for that we inject into the Javascript code of `attribute-function-interpolator`s an object SimulationDate which behaves such as the Javascript `Date` object but "points" to the simulation time and date, this is `new SimulationDate()` returns the current `Date` for the current simulation. It is important to note that the `SimulationDate` object will only be available if you assign the result of your code evaluation to the `module.exports` property.
                * A valid attribute value using the possibility to access the current simulation time is: `"attribute-function-interpolator(module.exports = new SimulationDate())"`, where the result of the evaluation (this is, the value assigned to `module.exports`) will be the current simulation date.
                * In case you want to maintain state amongst executions of `attribute-function-interpolator` with the same specification (this is, with the same Javascript code to be evaluated), you can do it following the next guidelines:
                    1. Include a comment in your `attribute-function-interpolator` Javascript code such as: `/* state: statefulVariable1 = 5, statefulVariable2 = {\"prop1\": \"value1\"}, statefulVariable3 */`, this is a `state:` tag followed by the list of variables you would like the interpolator to maintain as the state. This list is used to inject into your code these variables with the value included after the `=` character or `null` if no value is assigned for the first execution of your Javascript code.
                    2. Return the result the evaluation setting it as the value for the `module.exports.result` property.
                    3. Return the variables whose state should be maintained between executions of the interpolator as properties of an object assigned to the `module.exports.state` property.
                * It is important to note that all the `attribute-function-interpolator` sharing the same specification (this is, your Javascript code) will share the same state. If you do not want this, just slightly change the specification somehow withouth affecting the execution of your code such adding an additional `;` or including a comment.
                * A valid attribute value using the possibility to maintain state amongst `attribute-function-interpolator` interpolator executions is: `"attribute-function-interpolator(/* state: counter = 1 */ module.exports = { result: ${{Entity:001}{active:001}} + counter, state: { counter: ++counter }};)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the times the interpolator has been run.
                * Last but not least, we have also incorporated the possibility to share state between distint `attribute-function-interpolator`s, this is, `attribute-function-interpolator`s with distinct associated Javascript code (since if it is the same, the state can be shared "locally" amongs all the instances of the same `attribute-function-interpolator` as previously described). To share state between distinct `attribute-function-interpolator`s no matter their specification or associated Javascript code, follow the next steps:
                    1. Assign initial values to the global state variables in the `globals` property of the simulation configuration. For example: `"globals": { "globalVar1": 1, "globalVar2": 2}`. This step is optional and its necessity depends on your specific `attribute-function-interpolator` Javascript code where, obviously, you should not access any non-declared variable.
                    2. The variables will be available to be used in all the `attribute-function-interpolator` instances of the simulation. Take into consideration that in case of using not valid variable names in the step 1 above (such as: `global-var-1`), you have to access the variables via the `global` variable, this is, instead of the not valid `global-var-1` variable name, use `global.global-var-1`.
                    3. Return the result the evaluation setting it as the value for the `module.exports.result` property.
                    4. Return the global state variables whose values you would like to update as properties of the object assigned to `module.exports.state.globals`. The global variables will be updated accordingly and passed to the next `attribute-function-interpolator` being executed.
                * A valid attribute value using the possibility to maintain global state between `attribute-function-interpolator` instances (no matter the Javascript code included in them): `"attribute-function-interpolator(module.exports = { result: ${{Entity:001}{active:001}} + globalVar1, state: { globals: { globalVar1: ++globalVar1 } }};)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the value of the `globalVar1` global state variable, which will be incremented in 1 and passed as incremented to the next execution of an `attribute-function-interpolator` interpolator.
                * It is important to note that global state variables (this is, amongst `attribute-function-interpolator` instances no matter their specification or associated Javascript code) and local state variables (this is, amongst `attribute-function-interpolator` instances with the same specification or associated Javascript code) can be combined following the guidelines detailed above. Notice that local state variables will impose over global state variables. This is, if a `attribute-function-interpolator` uses a local state variable with the same name as a global state variable, the local one will preserve and apply.
                * A valid attribute value using the possibility to maintain local and global state amongst `attribute-function-interpolator` interpolator executions is: `"attribute-function-interpolator(/* state: counter = 1 */ module.exports = { result: ${{Entity:001}{active:001}} + counter + globalVar1, state: { counter: ++counter, globals: { globalVar1: ++globalVar1 } } };)"`, where the result of the evaluation (this is, the value assigned to `module.exports.result`) will be the result of adding to the value of the `active:001` attribute of the `Entity:001` entity an increment equal to the times the interpolator has been run plus the value of the `globalVar1` state variable (which, on the other hand, is incremented globally in 1 before exiting the evaluation of the Javascript code).
                * **NOTE:** There is an [issue](https://github.com/abbr/deasync/issues/48) in the [`deasync`](https://www.npmjs.com/package/deasync) Node package which seems to break fast-forward simulations which make use of the `attribute-function-interpolator` in combination with entity attribute references (this is, `${{<entityId>}{<attributeName>}}` provoking a segmentation fault error. A workaround to avoid this issue is the use of global state variables updating the value of the attributes which need to be referenced and assigning their value to global state variables which make it possible to access them from any other `attribute-function-interpolator` instance.
        * **metadata**: Array of metadata information to be associated to the attribute on the update. Each metadata array entry is an object including 3 properties:
            * **name**: The metadata name.
            * **type**: The metadata type.
            * **value**: The metadata value. As the value of any metadata, all the possible accepted values for attributes (detailed above) can be used including the interpolators.
    * **staticAttributes**: List of attributes which will be included in every update of the entity. Static attributes are just like the active attributes previously described with 1 main remarks: they do not include a `schedule` property since the schedule of the updates of the entity and its attributes is determined by the `schedule` property at the active attributes level or the one specified at the entity level. Although staticAttributes may use any of the available interpolators as their `value` property, they typically include fixed values and no any type of interpolation.
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

Although the `fiwareDeviceSimulatorCLI` command line tool previously detailed includes support for the import mechanism just described, we have also included a specific command line tool for the import mechanism which transpiles an input simulation configuration file into an output configuration file including the resolved imports.

To run the FIWARE Device Simulator Transpiler CLI tool just run:

```bash
./bin/fiwareDeviceSimulatorTranspilerCLI
```

This will show the FIWARE Device Simulator Transpiler CLI tool help which will guide you to learn how to properly use it:

```
Usage: fiwareDeviceSimulatorTranspilerCLI [options]

  Options:

    -h, --help                                     output usage information
    -V, --version                                  output the version number
    -c, --configuration <configuration-file-path>  Absolute or relative path (from the root of the Node application) to the device simulator configuration input file (mandatory)
    -o, --output <output-file-path>                Absolute or relative path (from the root of the Node application) to the output device simulator configuration file (mandatory)
```

Following the description of the simulation configuration file accepted properties and leaning on the [FIWARE waste management harmonized data models](http://fiware-datamodels.readthedocs.io/en/latest/WasteManagement/doc/introduction/index.html), we provide a simulation configuration real example file to automatically generate waste management data, more concretely simulating the dynamic filling levels for 8 waste containers spread out at 4 areas (`Oeste` (i.e., West), `Norte` (i.e., North), `Este` (i.e., East) and `Sur` (i.e., South) of the Distrito Telefónica area (where the Telefónica headquarters are located) in Madrid.

```json
{
  "domain": {
    "service": "theService",
    "subservice": "/theSubService"
  },
  "contextBroker": {
    "protocol": "https",
    "host": "195.235.93.224",
    "port": 10027,
    "ngsiVersion": "1.0"
  },
  "authentication": {
    "protocol": "https",
    "host": "195.235.93.224",
    "port": 15001,
    "user": "theUser",
    "password": "thePassword"
  },
  "entities": [
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Oeste",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "Text",
          "value": "Distrito Telefónica - Oeste"
        },
        {
          "name": "description",
          "type": "Text",
          "value": "Zona de contenedores Oeste de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Polygon",
            "coordinates": [[[-3.6642676591873165,40.51337501088891],[-3.66318941116333,40.51437011409327],[-3.666316866874695,40.51642960455014],[-3.667373657226562,40.51549162664228],[-3.6642676591873165,40.51337501088891]]]
          }
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Oeste, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "List",
          "value": ["WasteContainer:DTO:001", "WasteContainer:DTO:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Norte",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "Text",
          "value": "Distrito Telefónica - Norte"
        },
        {
          "name": "description",
          "type": "Text",
          "value": "Zona de contenedores Norte de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Polygon",
            "coordinates": [[[-3.66318941116333,40.51437827061587],[-3.662030696868896,40.51548754844881],[-3.6651098728179927,40.51761633170772],[-3.6664187908172607,40.51649893283121],[-3.66318941116333,40.51437827061587]]]
          }
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Norte, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "List",
          "value": ["WasteContainer:DTN:001", "WasteContainer:DTN:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Este",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "Text",
          "value": "Distrito Telefónica - Este"
        },
        {
          "name": "description",
          "type": "Text",
          "value": "Zona de contenedores Este de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Polygon",
            "coordinates": [[[-3.6642730236053462,40.51338316753258],[-3.6614298820495605,40.5115234270992],[-3.6603784561157227,40.51245330376326],[-3.663200139999389,40.51439458365814],[-3.6642730236053462,40.51338316753258]]]
          }
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Este, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "List",
          "value": ["WasteContainer:DTE:001", "WasteContainer:DTE:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerIsle:Sur",
      "entity_type": "WasteContainerIsle",
      "staticAttributes": [
        {
          "name": "name",
          "type": "Text",
          "value": "Distrito Telefónica - Sur"
        },
        {
          "name": "description",
          "type": "Text",
          "value": "Zona de contenedores Sur de Distrito Telefónica"
        },
        {
          "name": "features",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Polygon",
            "coordinates": [[[-3.663210868835449,40.51437011409327],[-3.662030696868896,40.515512017605886],[-3.6591768264770512,40.513627866381356],[-3.660399913787842,40.51245330376326],[-3.663210868835449,40.51437011409327]]]
          }
        },
        {
          "name": "address",
          "type": "address",
          "value": {
            "streetAddress" : "Zona Sur, Ronda de la Comunicación s/n",
            "addressLocality": "Madrid",
            "addressCountry": "ES"
          }
        },
        {
          "name": "containers",
          "type": "List",
          "value": ["WasteContainer:DTS:001", "WasteContainer:DTS:002"]
        }
      ]
    },
    {
      "schedule": "once",
      "entity_name": "WasteContainerModel:001",
      "entity_type": "WasteContainerModel",
      "staticAttributes": [
        {
          "name": "width",
          "type": "Number",
          "value": 0.50
        },
        {
          "name": "height",
          "type": "Number",
          "value": 0.80
        },
        {
          "name": "depth",
          "type": "Number",
          "value": 0.40
        },
        {
          "name": "volumeStored",
          "type": "Number",
          "value": 150
        },
        {
          "name": "brandName",
          "type": "Text",
          "value": "Modelo de Contenedor 001"
        },
        {
          "name": "modelName",
          "type": "Text",
          "value": "001"
        },
        {
          "name": "compliantWith",
          "type": "List",
          "value": ["UNE-EN 840-2:2013"]
        },
        {
          "name": "madeOf",
          "type": "Text",
          "value": "plastic"
        },
        {
          "name": "features",
          "type": "List",
          "value": ["wheels", "lid"]
        },
        {
          "name": "category",
          "type": "List",
          "value": ["dumpster"]
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTO:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value":
          "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value":
          "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value":
          "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTO:001"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.6661827564239498,40.51538151533159]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["organic"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTO:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Oeste"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTO:002"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.666096925735473,40.515112353588606]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["inorganic"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTN:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTN:001"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.6647772789001465,40.51664574542514]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["glass"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTN:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Norte"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTN:002"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.6647450923919673,40.51627055704617]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["paper"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTE:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTE:001"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.6606144905090328,40.5138236248174]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["plastic"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTE:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Este"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTE:002"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.661140203475952,40.513668649435985]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["batteries"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTS:001",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTS:001"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.6622023582458496,40.51242067673018]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["metal"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    },
    {
      "entity_name": "WasteContainer:DTS:002",
      "entity_type": "WasteContainer",
      "schedule": "*/5 * * * * *",
      "active": [
        {
          "name": "fillingLevel",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,0],[20,random(0.25,0.50)],[21,random(0.50,0.75)],[22,0.75],[23,1],[24,1]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "temperature",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(0,10)],[10,random(10,15)],[14,random(25,35)],[20,random(10,15)],[24,random(0,10)]], \"return\": {\"type\": \"float\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "methaneConcentration",
          "type": "Number",
          "value": "time-random-linear-interpolator({\"spec\": [[0,random(1700,1600)],[20,random(1600,1700)],[21,random(1700,1750)],[22,random(1750,1800)],[23,random(1800,1850)],[24,random(1800,1850)]], \"return\": {\"type\": \"integer\", \"rounding\": \"round\"}})",
          "metadata": [
            {
              "name": "dateUpdated",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            },
            {
              "name": "TimeInstant",
              "type": "DateTime",
              "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
            }
          ]
        },
        {
          "name": "dateUpdated",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "name": "TimeInstant",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 * * *",
          "name": "dateLastEmptying",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 0})"
        },
        {
          "schedule": "0 0 0 1 * *",
          "name": "dateNextActuation",
          "type": "DateTime",
          "value": "date-increment-interpolator({\"origin\": \"now\", \"increment\": 2592000})"
        }
      ],
      "staticAttributes": [
        {
          "name": "refWasteContainerModel",
          "type": "Text",
          "value": "WasteContainerModel:001"
        },
        {
          "name": "containerIsle",
          "type": "Text",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "isleId",
          "type": "Text",
          "value": "WasteContainerIsle:Sur"
        },
        {
          "name": "serialNumber",
          "type": "Text",
          "value": "WasteContainer:DTS:002"
        },
        {
          "name": "location",
          "type": "geo:json",
          "value": {
            "type": "Point",
            "coordinates": [-3.662030696868896,40.512893767156115]
          }
        },
        {
          "name": "category",
          "type": "List",
          "value": ["surface"]
        },
        {
          "name": "storedWasteOrigin",
          "type": "Text",
          "value": "municipal"
        },
        {
          "name": "storedWasteKind",
          "type": "List",
          "value": ["electronics"]
        },
        {
          "name": "status",
          "type": "Text",
          "value": "ok"
        }
      ]
    }
  ]
}
```

The four mentioned areas or `WasteContainerIsle`s (`Oeste` (i.e., West), `Norte` (i.e., North), `Este` (i.e., East) and `Sur` (i.e., South) at Distrito Telefónica) and the 8 waste containers or `WasteContainer`s can be graphically seen online as a [http://geojson.io/](http://geojson.io/) map at [http://bl.ocks.org/anonymous/raw/82837480c5685f8cffa9d9c013197b0d/](http://bl.ocks.org/anonymous/raw/82837480c5685f8cffa9d9c013197b0d/).

The previously mentioned waste management simulation configuration file will generate entities and attributes in the specified Context Broker such as the ones depicted in the following Telefónica's IoT Platform Portal screenshot:

![Telefónica's IoT Platform Portal screenshot](https://dl.dropboxusercontent.com/u/2461997/Images/Urbo_portal_entities_screenshot.png "Telefónica's IoT Platform Portal screenshot")

The generated entities and attributes can also be checked in this [CSV file](https://dl.dropboxusercontent.com/u/2461997/Docs/Urbo_waste_management_entities.csv).

[Top](#top)

## FIWARE Device Simulator library

The FIWARE Device Simulator library can be found in the [./lib](./lib) directory. It is composed of:

1. The main [`./lib/fiwareDeviceSimulator.js`](./lib/fiwareDeviceSimulator.js) file. It exposes the following functions:
    1. `start()`: it takes a simulation configuration JSON object and returns an instance of `EventEmitter` which informs of the following events to the client:
        * `token-request`: Whenever a new authorization token is requested. No event object is passed as additional information for this event occurrence.
        * `token-response`: Whenever a new authorization token is received. The passed event includes the following properties:
            * - `expires_at`: The expiration date
        * `token-request-scheduled`: Whenever a new authorization token request is scheduled. The passed event includes the following properties:
            * `scheduled_at`: The scheduled date
        * `update-scheduled`: Whenever a new entity update is scheduled. The passed event includes the following properties:
            * `schedule`: The schedule
            * `entity`: Information about the entity to be updated
            * `attributes`: The attributes to be updated
      * `update-request`: Whenever a new entity update is requested.
          * `request`: Details about the update request
      * `update-response`: Whenever a new entity update response is received.
          * `request`: Details about the update request
          * `response`: The body of the received update response
      * `error`: Whenever an error happens
          * `error`: The error
          * `request`: The optional associated request (optional)
      * `stop`: Whenever the simulation is stopped. No event object is passed as additional information for this event occurrence.
      * `end`: Whenever the simulation ends. No event object is passed as additional information for this event occurrence.
    2. `stop()`: it stops the currently running simulation, if any, and emits the `stop` event.
2. The [`./lib/validators/fiwareDeviceSimulatorValidator.js`](./lib/validators/fiwareDeviceSimulatorValidator.js) file. It exposes the following functions:
    * `validateConfiguration`: Validates a simulation configuration object asynchronously taking the simulation configuration object as input as well as a callback which will be called once the validation has been completed passing an error object with further information about the problem in case the simulation configuration object was not valid.
3. The [`./lib/errors`](./lib/errors) directory including:
    1. The [`fdsErrors.js`](./lib/errors/fdsErrors.js) file. It includes the errors which may be sent when running a device simulation.
4. The [`./lib/interpolators`](./lib/interpolators) directory including:
    1. The [`dateIncrementInterpolator.js`](./lib/interpolators/dateIncrementInterpolator.js) file. It implements the date-increment-interpolator attribute value resolver.
    2. The [`multilinePositionInterpolator.js`](./lib/interpolators/multilinePositionInterpolator.js) file. It implements the multiline-position-interpolator attribute value resolver.
    3. The [`linearInterpolator.js`](./lib/interpolators/linearInterpolator.js) file. It implements the time-linear-interpolator attribute value resolver.
    4. The [`randomLinearInterpolator.js`](./lib/interpolators/randomLinearInterpolator.js) file. It implements the time-random-linear-interpolator attribute value resolver.
    5. The [`stepAfterInterpolator.js`](./lib/interpolators/stepAfterInterpolator.js) file. It implements the time-step-after-interpolator attribute value resolver.
    6. The [`stepBeforeInterpolator.js`](./lib/interpolators/stepBeforeInterpolator.js) file. It implements the time-step-before-interpolator attribute value resolver.
    6. The [`textRotationInterpolator.js`](./lib/interpolators/textRotationInterpolator.js) file. It implements the text-rotation-interpolator attribute value resolver.

[Top](#top)

## Development documentation

### Project build

The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.

[Top](#top)

### Testing

[Mocha](http://visionmedia.github.io/mocha/) Test Runner + [Chai](http://chaijs.com/) Assertion Library + [Sinon](http://sinonjs.org/) Spies, stubs.

The test environment is preconfigured to run [BDD](http://chaijs.com/api/bdd/) testing style with
`chai.expect` and `chai.should()` available globally while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```

[Top](#top)

### Coding guidelines

jshint, gjslint

Uses provided .jshintrc and .gjslintrc flag files. The latter requires Python and its use can be disabled
while creating the project skeleton with grunt-init.
To check source code style, type
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type
```bash
grunt lint-report
```

[Top](#top)

### Continuous testing

Support for continuous testing by modifying a src file or a test.
For continuous testing, type
```bash
grunt watch
```

[Top](#top)

### Source code documentation

dox-foundation

Generates HTML documentation under `site/doc/`. It can be used together with jenkins by means of DocLinks plugin.
For compiling source code documentation, type
```bash
grunt doc
```

[Top](#top)

### Code coverage

Istanbul

Analizes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type
```bash
# Use git-bash on Windows
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
# Use git-bash on Windows
grunt coverage-report
```

[Top](#top)

### Code complexity

Plato

Analizes code complexity using Plato and stores the report under `site/report/`. It can be used together with jenkins
by means of DocLinks plugin.
For complexity report, type
```bash
grunt complexity
```

[Top](#top)

### PLC

Update the contributors for the project
```bash
grunt contributors
```

[Top](#top)

### Development environment

Initialize your environment with git hooks.
```bash
grunt init-dev-env
```

We strongly suggest you to make an automatic execution of this task for every developer simply by adding the following
lines to your `package.json`
```
{
  "scripts": {
     "postinstall": "grunt init-dev-env"
  }
}
```

[Top](#top)

### Site generation

There is a grunt task to generate the GitHub pages of the project, publishing also coverage, complexity and JSDocs pages.
In order to initialize the GitHub pages, use:

```bash
grunt init-pages
```

This will also create a site folder under the root of your repository. This site folder is detached from your repository's
history, and associated to the gh-pages branch, created for publishing. This initialization action should be done only
once in the project history. Once the site has been initialized, publish with the following command:

```bash
grunt site
```

This command will only work after the developer has executed init-dev-env (that's the goal that will create the detached site).

This command will also launch the coverage, doc and complexity task (see in the above sections).

[Top](#top)

## Contact

* Germán Toro del Valle ([german.torodelvalle@telefonica.com](mailto:german.torodelvalle@telefonica.com), [@gtorodelvalle](http://www.twitter.com/gtorodelvalle))

[Top](#top)
