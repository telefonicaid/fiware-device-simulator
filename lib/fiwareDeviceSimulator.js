/*
 * Copyright 2016 Telefónica Investigación y Desarrollo, S.A.U
 *
 * This file is part of the FIWARE Device Simulator tool
 *
 * The FIWARE Device Simulator tool is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * The FIWARE Device Simulator is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with the FIWARE Device Simulator.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with: [german.torodelvalle@telefonica.com]
 */

'use strict';

var ROOT_PATH = require('app-root-path');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var lolex = require('lolex');
var mqtt = require('mqtt');
var npmInstall = require('npm-install-package');
var scheduler = require('node-schedule');
var request = require('request');
var time = require('time');
var linearInterpolator  = require(ROOT_PATH + '/lib/interpolators/linearInterpolator');
var randomLinearInterpolator  = require(ROOT_PATH + '/lib/interpolators/randomLinearInterpolator');
var stepBeforeInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepBeforeInterpolator');
var stepAfterInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepAfterInterpolator');
var dateIncrementInterpolator  = require(ROOT_PATH + '/lib/interpolators/dateIncrementInterpolator');
var multilinePositionInterpolator  = require(ROOT_PATH + '/lib/interpolators/multilinePositionInterpolator');
var multilineBearingInterpolator  = require(ROOT_PATH + '/lib/interpolators/multilineBearingInterpolator');
var textRotationInterpolator  = require(ROOT_PATH + '/lib/interpolators/textRotationInterpolator');
var attributeFunctionInterpolator  = require(ROOT_PATH + '/lib/interpolators/attributeFunctionInterpolator');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var fiwareDeviceSimulatorTranspiler = require(ROOT_PATH + '/lib/transpilers/fiwareDeviceSimulatorTranspiler');
var fiwareDeviceSimulatorValidator = require(ROOT_PATH + '/lib/validators/fiwareDeviceSimulatorValidator');

/**
 * The loaded configuration
 */
var configuration;

/**
 * The lolex clock
 */
var clock;

/**
 * The maximum number of not responded update requests before appllying delays
 * @type {Number}
 */
var maximumNotRespondedUpdateRequests = 0;

/**
 * Delay between requests for a fast-forward simulation
 */
var delay;

/**
 * The starting date for a fast-forward simulation
 */
var fromDate;

/**
 * The ending date for a fast-forward simulation
 */
var toDate;

/**
 * The real starting date for a fast-forward simulation
 */
var realFromDate;

/**
 * The progress interval object returned by setInterval()
 */
var progressIntervalObj;

/**
 * The MQTT client
 */
var mqttClient;

/**
 * Flag indicating if the MQTT client is connected
 * @type {Boolean}
 */
var isMQTTClientConnected = false;

/**
 * EventEmitter object returned to notify the evolution of the simulation
 */
var eventEmitter = new EventEmitter();

/**
 * Flag indicating if the jobs have been already scheduled
 * @type {Boolean}
 */
var areJobsScheduled = false;

/**
 * Array of update scheduled jobs
 * @type {Array}
 */
var updateJobs = [];

/**
 * Flag indicating if the current simulation has already ended
 * @type {Boolean}
 */
var isEnded = false;

/**
 * Number of updates processed
 * @type {Number}
 */
var updatesProcessed = 0;

/**
 * Number of updates requested
 * @type {Number}
 */
var updatesRequested = 0;

/**
 * Number of updates responded
 * @type {Number}
 */
var updatesResponded = 0;

/**
 * Delayed update requests
 * @type {Number}
 */
var delayedUpdateRequests = 0;

/**
 * Error update requests
 * @type {Number}
 */
var errorUpdateRequests = 0;

/**
 * Cache of interpolators to avoid instantiating them over and over again
 * @type {Object} Object including a property per interpolation type (typically: time-linear-interpolator,
 *                time-step-before-interpolator, time-step-after-interpolator). Each one of them is an object including
 *                a property per configuration array where the concrete interpolator is stored, this is:
 *                {
 *                  "time-linear-interpolator": {
 *                    "[[0,0], [20,25], [21,50], [22,100], [23, 0], [24, 0]]": linearInterpolatorInstance1,
 *                    ...
 *                    "[[0,0], [21,50], [23, 100], [24, 0]]": linearInterpolatorInstanceK
 *                  },
 *                  "time-step-before-interpolator": {
 *                    "[[0,0], [20,25], [21,50], [22,100], [23, 0], [24, 0]]": stepBeforeInterpolatorInstance1,
 *                    ...
 *                    "[[0,0], [21,50], [23, 100], [24, 0]]": : stepBeforeInterpolatorInstanceN
 *                  }
 *                }
 */
var interpolators = {};

/**
 * Clones attributes
 * @param  {Object} attribute The attribute to clone
 * @return {Object}           The cloned attribute
 */
function cloneAttribute(attribute) {
  /* jshint camelcase: false */
  var clonedAttribute = {
    value: attribute.value
  };
  if (attribute.name) {
    clonedAttribute.name = attribute.name;
  }
  if (attribute.type) {
    clonedAttribute.type = attribute.type;
  }
  if (attribute.object_id) {
    clonedAttribute.object_id = attribute.object_id;
  }
  return clonedAttribute;
}

/**
 * Clones a device
 * @param  {Object} device The device to cloned
 * @return {Object}        The cloned device
 */
function cloneDevice(device) {
  /* jshint camelcase: false */
  var clonedDevice = {
    device_id: device.device_id,
    schedule: device.schedule,
    protocol: device.protocol,
    api_key: device.api_key
  };
  if (device.attributes) {
    device.attributes.forEach(function(attribute) {
      clonedDevice.attributes = clonedDevice.attributes || [];
      var clonedAttribute = cloneAttribute(attribute);
      if (attribute.schedule) {
        clonedAttribute.schedule = attribute.schedule;
      }
      clonedDevice.attributes.push(clonedAttribute);
    });
  }
  return clonedDevice;
}

/**
 * Clones a entity
 * @param  {Object} entity The entity to cloned
 * @return {Object}        The cloned device
 */
function cloneEntity(entity) {
  /* jshint camelcase: false */
  var clonedEntity = {
    entity_name: entity.entity_name,
    entity_type: entity.entity_type,
    schedule: entity.schedule
  };
  if (entity.active) {
    entity.active.forEach(function(activeAttribute) {
      clonedEntity.active = clonedEntity.active || [];
      var clonedActiveAttribute = cloneAttribute(activeAttribute);
      if (activeAttribute.schedule) {
        clonedActiveAttribute.schedule = activeAttribute.schedule;
      }
      clonedEntity.active.push(clonedActiveAttribute);
    });
  }
  if (entity.staticAttributes) {
    entity.staticAttributes.forEach(function(staticAttribute) {
      clonedEntity.staticAttributes = clonedEntity.staticAttributes || [];
      var clonedStaticAttribute = cloneAttribute(staticAttribute);
      if (staticAttribute.schedule) {
        clonedStaticAttribute.schedule = staticAttribute.schedule;
      }
      clonedEntity.staticAttributes.push(clonedStaticAttribute);
    });
  }
  return clonedEntity;
}

/**
 * Cancels all the pending (token request and update) jobs if any
 */
function cancelAllJobs() {
  for (var job in scheduler.scheduledJobs) {
    if (scheduler.scheduledJobs.hasOwnProperty(job)) {
      scheduler.scheduledJobs[job].cancel();
    }
  }
  updateJobs = [];
  areJobsScheduled = false;
}

/**
 * Returns the API key associated to certain device
 * @param  {Object} device The device information
 * @return {string}        The associated device API key
 */
function getDeviceAPIKey(device) {
  /* jshint camelcase: false */
  switch (device.protocol) {
    case 'UltraLight::HTTP':
      return device.api_key || configuration.iota.ultralight.api_key;
    case 'UltraLight::MQTT':
      return device.api_key || configuration.iota.ultralight.api_key;
    case 'JSON::HTTP':
      return device.api_key || configuration.iota.json.api_key;
    case 'JSON::MQTT':
      return device.api_key || configuration.iota.json.api_key;
  }
}

/**
 * Emits an "scheduled" event notifying that new update jobs have been scheduled
 * @param  {String} schedule         The schedule
 * @param  {Object} elementType      The element type
 * @param  {Object} element          The information about the entity to update
 * @param  {Array}  attributes Array of attributes to update
 */
function emitScheduled(schedule, elementType, element, attributes) {
  /* jshint camelcase: false */
  var clonedAttributes;
  var event2Emit = {
    schedule: schedule
  };
  if (element.entity_name) {
    event2Emit.entity_name = element.entity_name;
    event2Emit.entity_type = element.entity_type;
  } else if (element.device_id) {
    event2Emit.device_id = element.device_id;
    event2Emit.protocol = element.protocol;
    event2Emit.api_key = getDeviceAPIKey(element);
  }
  if (element.staticAttributes) {
    element.staticAttributes.forEach(function(staticAttribute) {
      clonedAttributes = clonedAttributes || [];
      clonedAttributes.push(cloneAttribute(staticAttribute));
    });
  }
  attributes.forEach(function(attribute) {
    clonedAttributes = clonedAttributes || [];
    clonedAttributes.push(cloneAttribute(attribute));
  });
  event2Emit.attributes = clonedAttributes;
  eventEmitter.emit('update-scheduled', event2Emit);
}

/**
 * Emits an "info" event
 * @param  {Object} info The information to emit
 */
function emitInfo(info) {
  eventEmitter.emit(
    'info',
    {
      message: info
    }
  );
}

/**
 * Emits an "error" event
 * @param  {Object} err The error to emit
 */
function emitError(err) {
  eventEmitter.emit(
    'error',
    {
      error: err
    }
  );
}

/**
 * Emits a "token-request" event
 * @param  {Object} tokenRequest The token request
 */
function emitTokenRequest(tokenRequest) {
  eventEmitter.emit(
    'token-request',
    {
      request: tokenRequest
    }
  );
}

/**
 * Emits a "token-response" event
 * @param  {Date} expirationDate The expiration date
 */
function emitTokenResponse(expirationDate) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'token-response',
    {
      expires_at: expirationDate
    }
  );
}

/**
 * Emits a "token-request-scheduled" event
 * @param  {Date} scheduleDate The schedule date
 */
function emitTokenRequestScheduled(scheduleDate) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'token-request-scheduled',
    {
      scheduled_at: scheduleDate
    }
  );
}

/**
 * Emits an "request" event notifying that new update jobs have been requested
 * @param  {Object} requestOptions The request information
 */
function emitRequest(requestOptions) {
  /* jshint camelcase: false */
  eventEmitter.emit(
    'update-request',
    {
      request: requestOptions
    }
  );
}

/**
 * Emits an "response" or "error" event notifying that new update jobs have been responded
 * @param  {Object} error           Error, if any
 * @param  {Object} request         The associated request
 * @param  {Object} body            The response body
 * @param  {Object} response        The response
 */
function emitResponse(error, request, body, response) {
  /* jshint camelcase: false */
  if (error) {
    errorUpdateRequests += 1;
    eventEmitter.emit(
      'error',
      {
        request: request,
        error: error
      }
    );
  } else if (response && response.statusCode.toString().charAt(0) !== '2') {
    errorUpdateRequests += 1;
    eventEmitter.emit(
      'error',
      {
        request: request,
        response: body,
        error: {
          statusCode: response.statusCode
        }
      }
    );
  } else {
    eventEmitter.emit(
      'update-response',
      {
        request: request,
        response: body
      }
    );
  }
}

/**
 * Emits the "info" event
 */
function emitProgressInfo() {
  if (!isEnded) {
    var realElapsedTime = new time.Date() - realFromDate;
    eventEmitter.emit(
      'progress-info',
      {
        updatesProcessed: updatesProcessed,
        updatesRequested: updatesRequested,
        delayedUpdateRequests: delayedUpdateRequests,
        errorUpdateRequests: errorUpdateRequests,
        elapsedTime: realElapsedTime,
        simulatedElapsedTime: (fromDate ? new Date() - fromDate : realElapsedTime),
        updateJobs: updateJobs,
        clock: clock
      }
    );
  }
}

/**
 * Starts the progress information interval
 * @param  {Number} interval The interval milliseconds
 */
function startProgressInfo(interval) {
  if (interval) {
    progressIntervalObj = setInterval(emitProgressInfo, interval);
  }
}

/**
 * Stops the progress information interval
 */
function stopProgressInfo() {
  if (progressIntervalObj) {
    clearInterval(progressIntervalObj);
  }
}

/**
 * Emits the "stop" event
 */
function emitStop() {
  eventEmitter.emit('stop');
}

/**
 * Emits the "end" event
 */
function emitEnd() {
  eventEmitter.emit('end');
}

/**
 * Ends a currently running simulation, if any, and emits the "end" event
 */
function end() {
  stopProgressInfo();
  cancelAllJobs();
  if (fromDate) {
    clock.uninstall();
  }
  if (!isEnded) {
    isEnded = true;
    emitEnd();
  }
}

/**
 * Stops a currently running simulation, if any, and emits the "stop" event
 */
function stop() {
  if (!isEnded) {
    emitStop();
    end();
  }
}

/**
 * Helper function for the fast-forward simulation
 * @return {Function} [description]
 */
function nextTick() {
  if (fromDate) {
    if (toDate && Date.now() >= toDate.getTime()) {
      emitProgressInfo();
      stop();
    } else {
      clock.next();
    }
  }
}

/**
 * Checks the pending update invocations and emits the "end" if none is pendingInvocations
 */
function checkPendingInvocations() {
  for (var ii = 0; ii < updateJobs.length; ii++) {
    if (updateJobs[ii].pendingInvocations().length === 0) {
      updateJobs.splice(ii, 1);
      break;
    }
  }
  if (updateJobs.length === 0) {
    return end();
  } else {
    nextTick();
  }
}

/**
 * Generates a new device from a device description and a counter
 * @param  {Object} device  The device description
 * @param  {Number} counter The counter
 * @return {Object}         The generated device
 */
function generateDevice(device, counter) {
  /* jshint camelcase: false */
  var clonedDevice = cloneDevice(device);
  clonedDevice.device_id = device.entity_type + ':' + counter;
  clonedDevice.api_key = device.api_key;
  clonedDevice.protocol = device.protocol;
  return clonedDevice;
}

/**
 * Generates a new entity from a entity description and a counter
 * @param  {Object} entity  The entity description
 * @param  {Number} counter The counter
 * @return {Object}         The generated device
 */
function generateEntity(entity, counter) {
  /* jshint camelcase: false */
  var clonedEntity = cloneEntity(entity);
  clonedEntity.entity_name = entity.entity_type + ':' + counter;
  return clonedEntity;
}

/**
 * Adds an active attribute to certain schedule inside the schedules object
 * @param {Object} schedules An object including schedules as properties and arrays of active attributes to update
 *                           as values
 * @param {String} schedule  The schedule
 * @param {Object} attribute Object containing the details of the attribute to update
 */
function addAttribute2Schedule(schedules, schedule, attribute) {
  var theSchedule = typeof schedule === 'string' ? schedule : JSON.stringify(schedule);
  schedules[theSchedule] = schedules[theSchedule] || [];
  schedules[theSchedule].push(attribute);
}

/**
 * Returns the decimal date associated to certain date
 * @param  {date}   date The date
 * @return {Number}      The time in decimal format
 */
function toDecimalHours(date) {
  return date.getHours() + (date.getMinutes() / 60) + (date.getSeconds() / 3600);
}

/**
 * Returns the interpolated value for certain date based on the passed interpolator and interpolator type
 * @param  {Object} interpolator      The interpolator specification
 * @param  {Object} interpolationType The interpolator type
 * @return {Object}                   The interpolated value
 */
function interpolate(interpolator, interpolationType) {
  var interpolationSpec,
      interpolationFunction,
      interpolatorInstance,
      interpolationTypePlural = interpolationType + 's';

  switch(interpolationType) {
    case 'time-linear-interpolator':
      interpolationFunction = linearInterpolator;
      break;
    case 'time-random-linear-interpolator':
      interpolationFunction = randomLinearInterpolator;
      break;
    case 'time-step-before-interpolator':
      interpolationFunction = stepBeforeInterpolator;
      break;
    case 'time-step-after-interpolator':
      interpolationFunction = stepAfterInterpolator;
      break;
    case 'date-increment-interpolator':
      interpolationFunction = dateIncrementInterpolator;
      break;
    case 'multiline-position-interpolator':
      interpolationFunction = multilinePositionInterpolator;
      break;
    case 'multiline-bearing-interpolator':
      interpolationFunction = multilineBearingInterpolator;
      break;
    case 'text-rotation-interpolator':
      interpolationFunction = textRotationInterpolator;
      break;
    case 'attribute-function-interpolator':
      interpolationFunction = attributeFunctionInterpolator;
      break;
    default:
      return null;
  }

  if (interpolationType !== 'time-random-linear-interpolator') {
    interpolationSpec = interpolator.substring((interpolationType + '(').length, interpolator.length - 1);
    interpolators[interpolationTypePlural] = interpolators[interpolationTypePlural] || {};
    interpolatorInstance = interpolators[interpolationTypePlural][interpolationSpec] ||
      (interpolators[interpolationTypePlural][interpolationSpec] =
        (interpolationType === 'attribute-function-interpolator' ?
          interpolationFunction(interpolationSpec, configuration.domain, configuration.contextBroker) :
          interpolationFunction(interpolationSpec)));
  } else {
    interpolationSpec = interpolator.substring((interpolationType + '(').length, interpolator.length - 1);
    interpolatorInstance = interpolationFunction(interpolationSpec);
  }
  return interpolatorInstance.apply(null, Array.prototype.slice.call(arguments, 2));
}

/**
 * Resolves a value for an interpolator and the current date
 * @param  {String} interpolator The value (may be an interpolator specification or concrete value)
 * @return {Number}              The final value for the interpolator and date specified
 */
function resolveValue(interpolator) {
  var value;
  if (typeof interpolator !== 'string') {
    return interpolator;
  }
  if (interpolator.indexOf('time-linear-interpolator(') === 0) {
    return interpolate(interpolator, 'time-linear-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-random-linear-interpolator(') === 0) {
    return interpolate(interpolator, 'time-random-linear-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-step-before-interpolator(') === 0) {
    return interpolate(interpolator, 'time-step-before-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('time-step-after-interpolator(') === 0) {
    return interpolate(interpolator, 'time-step-after-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('date-increment-interpolator(') === 0) {
    return interpolate(interpolator, 'date-increment-interpolator');
  } else if (interpolator.indexOf('multiline-position-interpolator(') === 0) {
    return interpolate(interpolator, 'multiline-position-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('multiline-bearing-interpolator(') === 0) {
    return interpolate(interpolator, 'multiline-bearing-interpolator', toDecimalHours(new Date()));
  } else if (interpolator.indexOf('text-rotation-interpolator(') === 0) {
    return interpolate(interpolator, 'text-rotation-interpolator', new Date());
  } else if (interpolator.indexOf('attribute-function-interpolator(') === 0) {
    try {
      value = interpolate(interpolator, 'attribute-function-interpolator',
        configuration.authentication && configuration.authentication.token);
    } catch (exception) {
      emitError(exception);
    }
    return value;
  } else {
    return interpolator;
  }
}

/**
 * Returns the MQTT topic for certain device
 * @param  {Object} device The device information
 * @return {string}        The topic
 */
function getMQTTTopic(device) {
  /* jshint camelcase: false */
  return '/' + getDeviceAPIKey(device) + '/' + device.device_id + '/attrs';
}

/**
 * Returns the UltraLight payload
 * @param  {Object} device The device information
 * @return {string}        The payload
 */
function getUltraLightPayload(device) {
  /* jshint camelcase: false */
  var httpMQTTPayload = '',
      value;
  if (device.protocol === 'UltraLight::HTTP' || device.protocol === 'UltraLight::MQTT') {
    device.attributes.forEach(function(attribute) {
      value = resolveValue(attribute.value);
      /**
       * Currently the UltraLight HTTP IoT agent does not support passing objects. Once it does, the "stringified"
       * version should be passed:
       * if ((typeof value === 'object') && !_.isDate(value)) {
       *   value = JSON.stringify(value);
       * }
       */
      httpMQTTPayload = httpMQTTPayload.concat(attribute.object_id + '|' + value + '|');
    });
    httpMQTTPayload = httpMQTTPayload.substring(0, httpMQTTPayload.length - 1);
  }
  return httpMQTTPayload;
}

/**
 * Returns the JSON payload
 * @param  {Object} device The device information
 * @return {string}        The payload
 */
function getJSONPayload(device) {
  /* jshint camelcase: false */
  var jsonPayload = {},
      value;
  if (device.protocol === 'JSON::HTTP' || device.protocol === 'JSON::MQTT') {
    device.attributes.forEach(function(attribute) {
      value = resolveValue(attribute.value);
      jsonPayload[attribute.object_id] = value;
    });
  }
  return jsonPayload;
}

/**
 * Returns the request package options associated to the update of certain element (device or entity) and some of its
 * attributes
 * @param  {String} elementType The element type
 * @param  {Object} element     Element information
 * @param  {Array}  attributes  Array of attributes to update
 * @return {Object}             The request package options
 */
function getRequestOptions(elementType, element, attributes) {
  /* jshint camelcase: false */
  var url, path, contentType, body, json, metadatas;
  if (elementType === 'entity') {
    contentType = 'application/json';
    json = true;
    if ((configuration.contextBroker && configuration.contextBroker.ngsiVersion === '1.0') ||
      (configuration.subscriber && configuration.subscriber.ngsiVersion === '1.0')) {
      var contextElement = {};
      contextElement.id = element.entity_name;
      contextElement.type = element.entity_type;
      contextElement.isPattern = false;
      if (element.staticAttributes && element.staticAttributes.length) {
        contextElement.attributes = [];
        element.staticAttributes.forEach(function(staticAttribute) {
          metadatas = [];
          if (staticAttribute.metadata) {
            staticAttribute.metadata.forEach(function(metadata) {
              metadatas.push({
                name: metadata.name,
                type: metadata.type,
                value: resolveValue(metadata.value)
              });
            });
          }
          contextElement.attributes.push({
            name: staticAttribute.name,
            type: staticAttribute.type,
            value: resolveValue(staticAttribute.value),
            metadatas: metadatas
          });
        });
      }
      contextElement.attributes = contextElement.attributes || [];
      attributes.forEach(function(activeAttribute) {
        metadatas = [];
        if (activeAttribute.metadata) {
          activeAttribute.metadata.forEach(function(metadata) {
            metadatas.push({
              name: metadata.name,
              type: metadata.type,
              value: resolveValue(metadata.value)
            });
          });
        }
        contextElement.attributes.push({
          name: activeAttribute.name,
          type: activeAttribute.type,
          value: resolveValue(activeAttribute.value),
          metadatas: metadatas
        });
      });
      if (configuration.contextBroker) {
        path = '/v1/updateContext';
        url = configuration.contextBroker.protocol + '://' + configuration.contextBroker.host + ':' +
          configuration.contextBroker.port + path;
        body = {
          contextElements: [
            contextElement
          ],
          updateAction: 'APPEND'
        };
      } else if (configuration.subscriber) {
        url = configuration.subscriber.protocol + '://' + configuration.subscriber.host + ':' +
          configuration.subscriber.port + configuration.subscriber.path;
        body = {
          subscriptionId: '1234567890abcdef12345678',
          originator: 'fiware-device-simulator',
          contextResponses: [
            {
              contextElement: contextElement,
              statusCode: {
                code: '200',
                reasonPhrase : 'OK'
              }
            }
          ]
        };
      }
    } else if (configuration.contextBroker.ngsiVersion === '2.0') {
      var ngsiV2Entity = {};
      path = '/v2/op/update';
      url = configuration.contextBroker.protocol + '://' + configuration.contextBroker.host + ':' +
        configuration.contextBroker.port + path;
      body = {
        actionType: 'APPEND',
        entities: []
      };
      ngsiV2Entity.id = element.entity_name;
      ngsiV2Entity.type = element.entity_type;
      if (element.staticAttributes && element.staticAttributes.length) {
        element.staticAttributes.forEach(function(staticAttribute) {
          ngsiV2Entity[staticAttribute.name] = {
            type: staticAttribute.type,
            value: resolveValue(staticAttribute.value)
          };
          if (staticAttribute.metadata) {
            ngsiV2Entity[staticAttribute.name].metadata = {};
            staticAttribute.metadata.forEach(function(metadata) {
              ngsiV2Entity[staticAttribute.name].metadata[metadata.name] = {
                type: metadata.type,
                value: resolveValue(metadata.value)
              };
            });
          }
        });
      }
      attributes.forEach(function(activeAttribute) {
        ngsiV2Entity[activeAttribute.name] = {
          type: activeAttribute.type,
          value: resolveValue(activeAttribute.value)
        };
        if (activeAttribute.metadata) {
          ngsiV2Entity[activeAttribute.name].metadata = {};
          activeAttribute.metadata.forEach(function(metadata) {
            ngsiV2Entity[activeAttribute.name].metadata[metadata.name] = {
              type: metadata.type,
              value: resolveValue(metadata.value)
            };
          });
        }
      });
      body.entities.push(ngsiV2Entity);
    } else {
      emitError(new fdsErrors.NGSIVersionNotSupported('The provided NGSI version (\'' +
        configuration.contextBroker.ngsiVersion + '\') is not supported'));
      return null;
    }
  } else if (elementType === 'device') {
    if (element.protocol === 'UltraLight::HTTP') {
      contentType = 'text/plain';
      url = configuration.iota.ultralight.http.protocol + '://' + configuration.iota.ultralight.http.host + ':' +
        configuration.iota.ultralight.http.port + '/iot/d?i=' + element.device_id + '&k=' +
        getDeviceAPIKey(element);
      json = false;
      body = getUltraLightPayload(element);
    } else if (element.protocol === 'JSON::HTTP') {
      contentType = 'application/json';
      url = configuration.iota.json.http.protocol + '://' + configuration.iota.json.http.host + ':' +
        configuration.iota.json.http.port + '/iot/json?i=' + element.device_id + '&k=' + getDeviceAPIKey(element);
      json = true;
      body = getJSONPayload(element);
    } else {
      emitError(new fdsErrors.ProtocolNotSupported('The provided protocol (\'' +
        element.protocol + '\') is not supported'));
      return null;
    }
  }

  var options = {
    method: 'POST',
    url: url,
    rejectUnauthorized: false,
    headers: {
      'Content-Type': contentType,
      'Accept': 'application/json',
      'Fiware-Service': configuration.domain && configuration.domain.service,
      'Fiware-ServicePath': configuration.domain && configuration.domain.subservice,
      'X-Auth-Token': configuration.authentication && configuration.authentication.token
    },
    json: json,
    body: body
  };
  return options;
}

/**
 * MQTT publications handler
 * @param  {Object} request The MQTT publication
 * @param  {Error}  err     Error, if any
 * @param  {[type]} result  Result of the operation
 */
function onMQTTPublication(request, err, result) {
  emitResponse(err, request, result);
  process.nextTick(checkPendingInvocations);
  nextTick();
}

/**
 * Returns the update job name associated to certain entity and attributes
 * @param  {Object} element    An entity or device
 * @param  {Array}  attributes An array of attributes
 * @return {String}            The job name
 */
function getJobName(element, attributes) {
  /* jshint camelcase: false */
  var jobName = '';
  var entityOrDeviceName = element.entity_name || element.object_id;
  jobName += (entityOrDeviceName + ': ');
  for (var ii = 0; ii < attributes.length; ii++) {
    if (ii > 0) {
      jobName += ', ';
    }
    jobName += attributes[ii].name;
  }
  return jobName;
  /* jshint camelcase: true */
}

/**
 * Updates the attributes associated to certain element (device or entity)
 * @param  {Object} elementType The element type
 * @param  {Object} element     The element information
 * @param  {Array}  attributes  The attributes to update
 */
function update(elementType, element, attributes) {
  updatesProcessed++;
  if (maximumNotRespondedUpdateRequests >= 0) {
    if ((updatesRequested - updatesResponded) > maximumNotRespondedUpdateRequests ||
      (updatesProcessed - delayedUpdateRequests - updatesRequested) > (maximumNotRespondedUpdateRequests + 1)) {
      delayedUpdateRequests++;
      var jobName = getJobName(element, attributes);
      var reScheduledJob = scheduler.scheduleJob(
        jobName, new Date(Date.now() + delay), update.bind(null, elementType, element, attributes));
      updateJobs.push(reScheduledJob);
      return;
    }
  }
  var mqttProtocol, mqttHost, mqttPort, mqttUser, mqttPassword, mqttURL, mqttTopic, mqttPayload, mqttRequest;
  if (elementType === 'entity' ||
    (elementType === 'device' &&
      (element.protocol === 'UltraLight::HTTP' || element.protocol === 'JSON::HTTP'))) {
    var requestOptions = getRequestOptions(elementType, element, attributes);
    if (requestOptions) {
      request(requestOptions, function(err, response, body) {
        emitResponse(err, requestOptions, body, response);
        updatesResponded++;
        process.nextTick(checkPendingInvocations);
        nextTick();
      });
      emitRequest(requestOptions);
      updatesRequested++;
    }
  } else if (element.protocol === 'UltraLight::MQTT' || element.protocol === 'JSON::MQTT') {
    if (element.protocol === 'UltraLight::MQTT') {
      mqttProtocol = configuration.iota.ultralight.mqtt.protocol;
      mqttHost = configuration.iota.ultralight.mqtt.host;
      mqttPort = configuration.iota.ultralight.mqtt.port;
      mqttUser = configuration.iota.ultralight.mqtt.user;
      mqttPassword = configuration.iota.ultralight.mqtt.password;
    } else if (element.protocol === 'JSON::MQTT') {
      mqttProtocol = configuration.iota.json.mqtt.protocol;
      mqttHost = configuration.iota.json.mqtt.host;
      mqttPort = configuration.iota.json.mqtt.port;
      mqttUser = configuration.iota.json.mqtt.user;
      mqttPassword = configuration.iota.json.mqtt.password;
    }
    mqttURL = mqttProtocol + '://' + mqttHost + ':' + mqttPort;
    mqttTopic = getMQTTTopic(element);
    mqttPayload = (element.protocol === 'UltraLight::MQTT') ?
      getUltraLightPayload(element) : JSON.stringify(getJSONPayload(element));
    mqttRequest = {
      url: mqttURL,
      topic: mqttTopic,
      payload: mqttPayload
    };
    if (!mqttClient || !isMQTTClientConnected) {
      if (mqttUser && mqttPassword) {
        mqttClient = mqtt.connect(
          mqttURL,
          {
            username: mqttUser,
            password: mqttPassword
          }
        );
      } else {
        mqttClient = mqtt.connect(mqttURL);
      }
      mqttClient.on('error', function onMQTTClientError(ev) {
        emitError(ev);
      });
      mqttClient.on('connect', function onMQTTClientConnect() {
        isMQTTClientConnected = true;
        mqttClient.removeListener('connect', onMQTTClientConnect);
        emitRequest(mqttRequest);
        mqttClient.publish(mqttTopic, mqttPayload, onMQTTPublication.bind(null, mqttRequest));
      });
    } else {
      emitRequest(mqttRequest);
      mqttClient.publish(getMQTTTopic(element), getUltraLightPayload(element),
        onMQTTPublication.bind(null, mqttRequest));
    }
  }
}

/**
 * Schedules the jobs associated to the update of the attributes associated to certain element (device or entity)
 * @param  {String} elementType The element type
 * @param  {Object} element     The element
 */
function scheduleJobs4Element(elementType, element) {
  var schedules = {};
  var attributes = (elementType === 'device' ? element.attributes : element.active);
  var scheduleObj;
  if (attributes && attributes.length > 0) {
    attributes.forEach(function(attribute) {
      addAttribute2Schedule(schedules, attribute.schedule || element.schedule, attribute);
    });
  } else if (element.staticAttributes) {
    schedules[element.schedule] = schedules[element.schedule] || [];
  }
  for (var schedule in schedules) {
    if (schedules.hasOwnProperty(schedule)) {
      scheduleObj = null;
      if (schedule.charAt(0) === '{') {
        scheduleObj = JSON.parse(schedule);
        scheduleObj.start = new Date(scheduleObj.start);
        scheduleObj.end = new Date(scheduleObj.end);
      }
      var jobName = getJobName(element, schedules[schedule]);
      var updateJob = scheduler.scheduleJob(
        jobName,
        schedule === 'once' ? new Date(Date.now() + 500) : scheduleObj || schedule,
        update.bind(null, elementType, element, schedules[schedule])
      );
      updateJobs.push(updateJob);
      emitScheduled(scheduleObj || schedule, elementType, element, schedules[schedule]);    }
  }
}

/**
 * Schedules jobs to update the entities
 */
function scheduleJobs() {
  if (configuration.entities) {
    configuration.entities.forEach(function(entity) {
      /* jshint camelcase: false */
      if (entity.entity_name) {
      /* jshint camelcase: true */
        scheduleJobs4Element('entity', entity);
      } else if (entity.count) {
        for (var ii = 1; ii <= entity.count; ii++) {
          var generatedEntity = generateEntity(entity, ii);
          scheduleJobs4Element('entity', generatedEntity);
        }
      }
    });
  }
  if (configuration.devices) {
    configuration.devices.forEach(function(device) {
      /* jshint camelcase: false */
      if (device.device_id) {
      /* jshint camelcase: true */
        scheduleJobs4Element('device', device);
      } else if (device.count) {
        for (var ii = 1; ii <= device.count; ii++) {
          var generatedDevice = generateDevice(device, ii);
          scheduleJobs4Element('device', generatedDevice);
        }
      }
    });
  }
  areJobsScheduled = true;
  nextTick();
}

/**
 * Requests an authorization tokens
 * @param  {Function} callback The callback
 */
function requestToken(callback) {
  var tokenRequestOptions;
  if (configuration.authentication.provider === 'keystone') {
    tokenRequestOptions = {
      method: 'POST',
      url: configuration.authentication.protocol + '://' + configuration.authentication.host + ':' +
        configuration.authentication.port + '/v3/auth/tokens',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      json: true,
      body: {
        auth: {
          identity: {
            methods: [
              'password'
            ],
            password: {
              user: {
                domain: {
                  name: configuration.domain.service
                },
                name: configuration.authentication.user,
                password: configuration.authentication.password
              }
            }
          },
          scope: {
            project: {
              domain: {
                name: configuration.domain.service
              },
              name: configuration.domain.subservice
            }
          }
        }
      }
    };
  } else if (configuration.authentication.provider === 'fiware-lab') {
    tokenRequestOptions = {
      method: 'POST',
      url: configuration.authentication.protocol + '://' + configuration.authentication.host + ':' +
        configuration.authentication.port + '/token',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      json: true,
      body: {
        username: configuration.authentication.user,
        password: configuration.authentication.password
      }
    };
  }

  request(tokenRequestOptions, function(err, response, body) {
    var error;
    if (err) {
      error = err;
    } else if (response.statusCode.toString().charAt(0) !== '2') {
      error = new fdsErrors.TokenNotAvailable('Authorization token could not be generated due to error (code: ' +
        (body && body.error && body.error.code) + ', title: ' + (body && body.error && body.error.title) +
        ', message: ' + (body && body.error && body.error.message) + ')');
    }
    if (error) {
      emitError(error);
    }
    process.nextTick(callback.bind(null, error, response, body));
    nextTick();
  });
  emitTokenRequest(tokenRequestOptions);
}

/**
 * Token received handler
 * @param  {Object} err      The error, if any
 * @param  {Object} response The response
 * @param  {Object} body     The response body
 */
function onTokenResponse(err, response, body) {
  /* jshint camelcase: false */
  if (err || response.statusCode.toString().charAt(0) !== '2') {
    end();
  } else {
    var token,
        expires_at;
    if (configuration.authentication.provider === 'keystone') {
      token = response.headers['x-subject-token'];
      expires_at = fromDate ?
        new Date(Date.now() + (new Date(body.token.expires_at).getTime() - new Date(body.token.issued_at).getTime())) :
        new Date(body.token.expires_at);
    } else if (configuration.authentication.provider === 'fiware-lab') {
      token = body;
      expires_at = new Date(Date.now + 3600000);
    }
    emitTokenResponse(expires_at);
    configuration.authentication.token = token;
    var scheduleDate = new Date(expires_at.getTime() - 60000);
    if (configuration.authentication.retry) {
      scheduler.scheduleJob(scheduleDate,
        async.retry.bind(null, configuration.authentication.retry, requestToken, onTokenResponse));
    } else {
      scheduler.scheduleJob(scheduleDate, requestToken.bind(null, onTokenResponse));
    }
    emitTokenRequestScheduled(scheduleDate);
    if (!areJobsScheduled) {
      scheduleJobs();
    }
    nextTick();
  }
  /* jshint camelcase: true */
}

/**
 * Transpiles a simulation configuration into another simulation configuration resolving the possible import()
 * directives
 * @param  {Object}   configuration The input simulation configuration
 * @param  {Function} callback      The callback
 */
function transpile(configuration, callback) {
  emitInfo('Starting the simulation configuration transpiling...');
  fiwareDeviceSimulatorTranspiler.transpile(configuration, function(err, newConfiguration) {
    if (err) {
      return process.nextTick(callback.bind(null, err));
    }
    emitInfo('Simulation configuration transpiling successfully completed!');
    return process.nextTick(callback.bind(null, err, newConfiguration));
  });
}

/**
 * Set the global variables to be passed amongs the attribute-function-interpolator interpolators
 * @param  {Object}   configuration The simulation configuration
 * @param  {Function} callback      The callback
 */
function setGlobals(configuration, callback) {
  global.fdsGlobals = configuration.globals;
  process.nextTick(callback.bind(null, null, configuration));
}

/**
 * Imports the packages included in the require property of the simulation configuration
 * @param  {Object}   configuration The simulation configuration
 * @param  {Function} callback      The callback
 */
function importPackages(configuration, callback) {
  if (configuration.require) {
    emitInfo('Requiring the following NPM packages: ' + configuration.require);
    npmInstall(
      configuration.require,
      {
        cache: true,
        silent: true
      },
      function(err) {
        var error;
        if (err) {
          error = new fdsErrors.PackageNotImported('Some of the packages included in the \'require\' list (' +
            configuration.require + ') could not be imported');
        }
        emitInfo('NPM packages (' + configuration.require + ') successfully required and available!');
        delete configuration.require;
        return process.nextTick(callback.bind(null, error, configuration));
      }
    );
  } else {
    process.nextTick(callback.bind(null, null, configuration));
  }
}

/**
 * Starts a simulation according to certain simulation configuration
 * @param  {Object}       config   A JSON simulation configuration Object
 * @param  {Date}         fromDate The starting date for a fast-forward simulation
 * @param  {Date}         toDate   The ending date for a fast-forward simulation
 * @param  {Number}       interval The interval in milliseconds to show progress information for a fast-forward
 *                                 simulation
 * @param  {Number}       margin   The maximun number of update requests for which no response has been received before
 *                                 applying a delay
 * @param  {Number}       delay    The delay in milliseconds between update requests for a fast-forward simulation
 * @return {EventEmitter}          EventEmitter instance to notify the following events:
 *                                   - "token-request": Whenever a new authorization token is requested. No event
 *                                   object is passed as additional information for this event occurrence.
 *                                   - "token-response": Whenever a new authorization token is received. The passed
 *                                   event includes the following properties:
 *                                     - {Date} expires_at The expiration date
 *                                   - "token-request-scheduled": Whenever a new authorization token request is
 *                                   scheduled. The passed event includes the following properties:
 *                                     - {Date} scheduled_at The scheduled date
 *                                   - "update-scheduled": Whenever a new entity update is scheduled. The passed event
 *                                   includes the following properties:
 *                                     - {String} schedule   The schedule
 *                                     - {Object} entity     Information about the entity to be updated
 *                                     - {Array}  attributes The attributes to be updated
 *                                   - "update-request": Whenever a new entity update is requested.
 *                                     - {Object} request Details about the update request
 *                                   - "update-response": Whenever a new entity update response is received.
 *                                     - {Object} request  Details about the update request
 *                                     - {Object} response The body of the received update response
 *                                   - "error": Whenever an error happens
 *                                     - {Error}  error The error
 *                                     - {Object} request The optional associated request (optional)
 *                                   - "stop": Whenever the simulation is stopped. No event object is passed as
 *                                   additional information for this event occurrence.
 *                                   - "end": Whenever the simulation ends. No event object is passed as additional
 *                                   information for this event occurrence.
 */
function start(config, theFromDate, theToDate, interval, margin, theDelay) {
  realFromDate = new time.Date();
  updatesProcessed = 0;
  updatesRequested = 0;
  updatesResponded = 0;
  delayedUpdateRequests = 0;
  errorUpdateRequests = 0;
  isEnded = false;
  stopProgressInfo();
  cancelAllJobs();
  async.waterfall([
    // Needed to be able to return the eventEmitter and start emitting events
    function(callback) {
      return process.nextTick(callback);
    },
    async.apply(transpile, config),
    fiwareDeviceSimulatorValidator.validateConfiguration,
    setGlobals,
    importPackages
  ], function(err, newConfig) {
    if (err) {
      process.nextTick(function notifySimulationConfigurationError() {
        emitError(err);
        end();
      });
    } else {
      emitInfo('Simulation started...');
      startProgressInfo(interval);
      if (theFromDate) {
        clock = lolex.install(theFromDate.getTime());
      }
      configuration = newConfig;
      maximumNotRespondedUpdateRequests = margin;
      delay = theDelay;
      fromDate = theFromDate;
      toDate = theToDate;
      if (configuration.authentication) {
        if (configuration.authentication.retry) {
          process.nextTick(
            async.retry.bind(null, configuration.authentication.retry, requestToken, onTokenResponse));
          nextTick();
        } else {
          process.nextTick(requestToken.bind(null, onTokenResponse));
          nextTick();
        }
      } else {
        process.nextTick(scheduleJobs);
        nextTick();
      }
    }
  });
  return eventEmitter;
}

module.exports = {
  start: start,
  stop: stop
};
