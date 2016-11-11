# Command line tools

The FIWARE Device Simulator includes 2 command line tools both located in the [`./bin`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/bin) directory:

1. The main FIWARE Device Simulator command line tool: [`fiwareDeviceSimulatorCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorCLI).
2. The FIWARE Device Simulator transpiler command line tool: [`fiwareDeviceSimulatorTranspilerCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorTranspilerCLI).

Let's cover each one of them.

## FIWARE Device Simulator command line tool

The FIWARE Device Simulator command line tool is located in the [`./bin`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/bin) directory and the concrete file is called [`fiwareDeviceSimulatorCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorCLI).

To run the FIWARE Device Simulator command line tool just run:

```bash
./bin/fiwareDeviceSimulatorCLI
```

This will show the FIWARE Device Simulator command line tool help which will guide you to learn how to properly use it:

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
    -w, --dweet <dweet-configuration>              Configuration information to publish the simulation progress information in dweet.io (it must be an object containing a 'name' property for the dweet thing and optionally an 'apiKey' property in case the thing is locked, for example: -w "{\"name\": \"fds:Test:001\"}")
    -l, --timeline <google-sheets-configuration    Configuration information to publish the scheduled updates into Google Sheets for its visualization as a Timeline Google Chart in Freeboard.io (it must be an object including a 'sheetKey' property for the long Google Sheet key where the data will be stored, a 'credentialsPath' property for the path to the Google generated credentials (more information about how to generate this credentials is available in the documentation), a 'dateFormat' property for the date format used by Google Sheets in your locale according to the dateformat NPM package (for further information, please visit: https://github.com/felixge/node-dateformat#mask-options) and a 'refreshInterval' property for the minimum interval in milliseconds the scheduled updates will be refreshed in the associated Google Sheet (i.e., the Google Sheet will be udpated in the next progress information tick (see the -p option) once this interval has passed since the last refresh), for example: -l "{\"sheetKey": \"1rGEpgC38kf_AC7FFlM71wev_-fKeuPKEOTvVY9I7e2Y", \"credentialsPath\": \"FIWARE Device Simulator-f11816817451.json\", \"dateFormat": \"dd/mm/yyyy HH:MM:ss\", \"refreshInterval\": 15000}")
    -f, --from <from-date>                         The start date to begin the fast-forward simulation (if not set, the current time will be used)
    -t, --to <to-date>                             The end date to stop the fast-forward simulation (if not set, the fast-forward will progress to the future and never end)
    -x, --all <cli-configuration-file-path>        Absolute or relative path (from the root of the Node application) to the command line tool configuration file (a JSON file including all the previous configuration options) (the long option names are used as properties of the JSON object) (options set in the comand line prevail)
```

As you can see, the FIWARE Device Simulator command line tool requires the path to a simulation configuration file detailing the simulation to be run. This simulation configuration file is the cornerstone of the FIWARE Device Simulator tool and is detailed in another section of this documentation.

On the other hand, the FIWARE Device Simulator command line tool supports a fast-forward simulation functionality which makes it possible to run the simulation from some date to certain date (in the past or in the future). Time will move forward automatically from the `from` date to the `to` date updating entities or sending device updates accordingly.

In the case of fast-forward simulations, it is possible to control the number of requests sent to the Context Broker instance per second using the `-m` and `-d` options. Usually setting the `-m` is more than enough. Increase the value passed to the `-m` option to increase the throughput, in case the Context Broker or IoT Agents you are sending requests to is able to deal with it.

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

## FIWARE Device Simulator transpiler command line tool

The FIWARE Device Simulator transpiler command line tool is located in the [`./bin`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/bin) directory and the concrete file is called [`fiwareDeviceSimulatorTranspilerCLI`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/bin/fiwareDeviceSimulatorTranspilerCLI).

To run the FIWARE Device Simulator transpiler command line tool just run:

```bash
./bin/fiwareDeviceSimulatorTranspilerCLI
```

This will show the FIWARE Device Simulator transpiler command tool help which will guide you to learn how to properly use it:

```
Usage: fiwareDeviceSimulatorTranspilerCLI [options]

 Options:

   -h, --help                                     output usage information
   -V, --version                                  output the version number
   -c, --configuration <configuration-file-path>  Absolute or relative path (from the root of the Node application) to the device simulator configuration input file (mandatory)
   -o, --output <output-file-path>                Absolute or relative path (from the root of the Node application) to the output device simulator configuration file (mandatory)
```

The FIWARE Device Simulator transpiler command line tool makes it possible to resolve the `import` directives which may be included in a simulation configuration file to get the final simulation configuration file to be run.

It is important to note that the FIWARE Device Simulator command line tool transpiles the input simulation configuration file before running the simulation, this additional command line tool is just meant as a helper to check that the transpilation process runs and excepted and the final generated simulation configuration file is the one expected.

More information about the `import` directives is included in the `Simulation configuration file` section.
