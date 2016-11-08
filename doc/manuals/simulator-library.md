# FIWARE Device Simulator library

The FIWARE Device Simulator library can be found in the [`./bin`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/bin) directory. It is composed of:

1. The main [`./lib/fiwareDeviceSimulator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/fiwareDeviceSimulator.js) file. It exposes the following functions:
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
      * `update-request`: Whenever a new entity update is requested. The passed event includes the following properties:
          * `request`: Details about the update request
      * `update-response`: Whenever a new entity update response is received. The passed event includes the following properties:
          * `request`: Details about the update request
          * `response`: The body of the received update response
      * `info`: Informational event typically to inform about the simulation evolution. The passed event includes the following properties:
          * `message`: The informational message.
      * `progress-info`: Progress information about the running simulation. The passed event includes the following properties:
          * `updatesProcessed`: The total number of updates processed
          * `updatesRequested`: The number of update requests sent
          * `delayedUpdateRequests`: The number of delayed update requests
          * `errorUpdateRequests`: The number of erroneous update requests
          * `elapsedTime`: The real elapsed time
          * `simulatedElapsedTime`: The simulated time in case of fast-forward simulations
          * `updateJobs`: The array of scheduled update requests
          * `clock`: The [lolex](https://www.npmjs.com/package/lolex) NPM package `clock` (returned by `lolex.createClock()`) in case of fast-forward simulations
      * `error`: Whenever an error happens. The passed event includes the following properties:
          * `error`: The error
          * `request`: The optional associated request (optional)
      * `stop`: Whenever the simulation is stopped. No event object is passed as additional information for this event occurrence.
      * `end`: Whenever the simulation ends. No event object is passed as additional information for this event occurrence.
    2. `stop()`: it stops the currently running simulation, if any, and emits the `stop` event.
2. The [`./lib/validators/fiwareDeviceSimulatorValidator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/validators/fiwareDeviceSimulatorValidator.js) file. It exposes the following functions:
    * `validateConfiguration`: Validates a simulation configuration object asynchronously taking the simulation configuration object as input as well as a callback which will be called once the validation has been completed passing an error object with further information about the problem in case the simulation configuration object was not valid.
3. The [`./lib/errors`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/lib/errors) directory including:
    1. The [`fdsErrors.js`](https://github.com/telefonicaid/fiware-device-simulator/tree/master/lib/interpolators) file. It includes the errors which may be sent when running a device simulation.
4. The [`./lib/interpolators`](./lib/interpolators) directory including:
    1. The [`attributeFunctionInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/attributeFunctionInterpolator.js) file. It implements the `attribute-function-interpolator` attribute value resolver.
    2. The [`dateIncrementInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/dateIncrementInterpolator.js) file. It implements the `date-increment-interpolator` attribute value resolver.
    3. The [`linearInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/linearInterpolator.js) file. It implements the `time-linear-interpolator` attribute value resolver.
    4. The [`multilinePositionInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/multilinePositionInterpolator.js) file. It implements the `multiline-position-interpolator` attribute value resolver.
    5. The [`randomLinearInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/randomLinearInterpolator.js) file. It implements the `time-random-linear-interpolator` attribute value resolver.
    6. The [`stepAfterInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/stepAfterInterpolator.js) file. It implements the `time-step-after-interpolator` attribute value resolver.
    7. The [`stepBeforeInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/stepBeforeInterpolator.js) file. It implements the `time-step-before-interpolator` attribute value resolver.
    8. The [`textRotationInterpolator.js`](https://github.com/telefonicaid/fiware-device-simulator/blob/master/lib/interpolators/textRotationInterpolator.js) file. It implements the `text-rotation-interpolator` attribute value resolver.
