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

var simulationConfiguration;

/**
 * Checks if an array of entities is included in the simulation configuration
 * @param  {Object}  simulationConfiguration The simulation configuration object
 * @return {Boolean}                         True if an array of entities is included, false otherwise
 */
function isEntities(simulationConfiguration) {
  if (simulationConfiguration.entities && Array.isArray(simulationConfiguration.entities)) {
    return true;
  }
  return false;
}

/**
 * Checks if the globals information is valid
 * @param  {Object}   simulationConfiguration The simulation configuration object
 * @param  {Function} callback                The callback
 */
function validateGlobals(simulationConfiguration, callback) {
  if (simulationConfiguration.globals) {
    if (typeof simulationConfiguration.globals !== 'object') {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The \'require\' configuration information ' +
          'is not an array of NPM packages names'));
    }
  }
  return setImmediate(callback);
}

/**
 * Checks if the require information is valid
 * @param  {Object}   simulationConfiguration The simulation configuration object
 * @param  {Function} callback                The callback
 */
function validateRequire(simulationConfiguration, callback) {
  if (simulationConfiguration.require) {
    if (Array.isArray(simulationConfiguration.require)) {
      for (var ii = 0; ii < simulationConfiguration.require.length; ii++) {
        if (typeof simulationConfiguration.require[ii] !== 'string') {
          return callback(new fdsErrors.SimulationConfigurationNotValid('The \'require\' configuration information ' +
            'is not an array of NPM packages names'));
        }
      }
      return setImmediate(callback);
    } else {
      return callback(new fdsErrors.SimulationConfigurationNotValid('The \'require\' configuration information ' +
        'is not an array of NPM packages names'));
    }
  }
  return setImmediate(callback);
}

/**
 * Checks if the domain information is included
 * @param  {Object}   simulationConfiguration The simulation configuration object
 * @param  {Function} callback                The callback
 */
function validateDomain(simulationConfiguration, callback) {
  if (isEntities(simulationConfiguration)) {
    if (!simulationConfiguration.domain) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No domain configuration information ' +
        '(the \'domain\' property is mandatory if \'entities\' are included)'));
    }
    if (!simulationConfiguration.domain.service) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No service in the domain configuration ' +
        'information (the \'domain.service\' property is mandatory if \'entities\' are included)'));
    }
    if (!simulationConfiguration.domain.subservice) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No subservice in the domain configuration ' +
        'information (the \'domain.subservice\' property is mandatory if \'entities\' are included)'));
    }
  }
  setImmediate(callback);
}

/**
 * Validate the context broker or subscriber configuration information
 * @param  {Object}   simulationConfiguration The simulation configuration
 * @param  {Function} callback                The callback
 */
function validateContextBrokerOrSubscriberConfiguration(simulationConfiguration, callback) {
  if (isEntities(simulationConfiguration)) {
    if (!simulationConfiguration.contextBroker && !simulationConfiguration.subscriber) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No context broker or subscriber configuration ' +
        'information (the \'contextBroker\' or the \'subscriber\' property is mandatory if \'entities\' ' +
        'are included)'));
    }
    if (simulationConfiguration.contextBroker) {
      if (!simulationConfiguration.contextBroker.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No protocol in the context broker ' +
          'configuration information (the \'contextBroker.protocol\' property is mandatory if \'entities\' ' +
          'are included)'));
      }
      if (!simulationConfiguration.contextBroker.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No host in the context broker configuration ' +
          'information (the \'contextBroker.host\' property is mandatory if \'entities\' are included)'));
      }
      if (!simulationConfiguration.contextBroker.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No port in the context broker configuration ' +
          'information (the \'contextBroker.port\' property is mandatory if \'entities\' are included)'));
      }
      if (!simulationConfiguration.contextBroker.ngsiVersion) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No NGSI version in the context broker ' +
          'configuration information (the \'contextBroker.nsgiVersion\' property is mandatory if \'entities\' are ' +
          'included)'));
      }
      if (simulationConfiguration.contextBroker.ngsiVersion !== '1.0' &&
        simulationConfiguration.contextBroker.ngsiVersion !== '2.0') {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The NGSI version in the context broker ' +
          'configuration information (\'' + simulationConfiguration.contextBroker.ngsiVersion + '\') is ' +
          'not supported'));
      }
    } else {
      if (!simulationConfiguration.subscriber.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No protocol in the subscriber configuration ' +
          'information (the \'subscriber.protocol\' property is mandatory if \'entities\' are included and no ' +
          '\'contextBroker\' configuration information is provided)'));
      }
      if (!simulationConfiguration.subscriber.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No host in the subscriber configuration ' +
          'information (the \'subscriber.host\' property is mandatory if \'entities\' are included and no ' +
          '\'contextBroker\' configuration information is provided)'));
      }
      if (!simulationConfiguration.subscriber.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No port in the subscriber configuration ' +
          'information (the \'subscriber.port\' property is mandatory if \'entities\' are included and no ' +
          '\'contextBroker\' configuration information is provided)'));
      }
      if (!simulationConfiguration.subscriber.path && simulationConfiguration.subscriber.path !== '') {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No path in the subscriber configuration ' +
          'information (the \'subscriber.path\' property is mandatory if \'entities\' are included and no ' +
          '\'contextBroker\' configuration information is provided)'));
      }
      if (!simulationConfiguration.subscriber.ngsiVersion) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No ngsiVersion in the subscriber ' +
          'configuration information (the \'subscriber.ngsiVersion\' property is mandatory if \'entities\' ' +
          'are included and no \'contextBroker\' configuration information is provided)'));
      }
      if (simulationConfiguration.subscriber.ngsiVersion !== '1.0') {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The NGSI version in the subscriber ' +
          'configuration information (\'' + simulationConfiguration.subscriber.ngsiVersion + '\') is not supported'));
      }
    }
  }
  setImmediate(callback);
}

/**
 * Validates the authentication configuration information
 * @param  {Object}   simulationConfiguration The simulation configuration
 * @param  {Function} callback                The callback
 */
function validateAuthenticationConfiguration(simulationConfiguration, callback) {
  if (simulationConfiguration.authentication) {
    if (!simulationConfiguration.authentication.provider ||
      (simulationConfiguration.authentication.provider !== 'keystone' &&
        simulationConfiguration.authentication.provider !== 'fiware-lab')) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('Invalid or no provider in the authentication ' +
        'configuration information (the \'authentication.provider\' property is mandatory) ' +
        '(accepted values: "keystone" and "fiware-lab")'));
    }
    if (!simulationConfiguration.authentication.protocol) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No protocol in the authentication configuration ' +
        'information (the \'authentication.protocol\' property is mandatory)'));
    }
    if (!simulationConfiguration.authentication.host) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No host in the authentication configuration ' +
        'information (the \'authentication.host\' property is mandatory)'));
    }
    if (!simulationConfiguration.authentication.port) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No port in the authentication configuration ' +
        'information (the \'authentication.port\' property is mandatory)'));
    }
    if (!simulationConfiguration.authentication.user) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No user in the authentication ' +
        'configuration information (the \'authentication.user\' property is mandatory)'));
    }
    if (!simulationConfiguration.authentication.password) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No password in the authentication ' +
        'configuration information (the \'authentication.password\' property is mandatory)'));
    }
    if (simulationConfiguration.authentication.retry) {
      if (isNaN(simulationConfiguration.authentication.retry.times)) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('Invalid or no times in the authentication ' +
          'retry configuration information (the \'authentication.retry.times\' property is mandatory and should be ' +
          'a number)'));
      }
      if (isNaN(simulationConfiguration.authentication.retry.interval)) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('Invalid or no interval in the authentication ' +
          'retry configuration information (the \'authentication.retry.interval\' property is mandatory and should ' +
          'be a number)'));
      }
    }
  }
  setImmediate(callback);
}

/**
 * Checks if an JSON HTTP device is included
 * @param  {array}   devices The array of devices to check
 * @return {Boolean}         True if an UltraLight JSON device is included, false otherwise
 */
function isJSONHTTPDevice(devices) {
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'JSON::HTTP') {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if a JSON HTTP device is included with no API key
 * @param  {Array}   devices The array of devices
 * @return {Boolean}         True if a JSON HTTP device is included with no API key
 */
function isJSONHTTPDeviceWithNoAPIKey(devices) {
  /* jshint camelcase: false */
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'JSON::HTTP' && !devices[ii].api_key) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if an JSON MQTT device is included
 * @param  {array}   devices The array of devices to check
 * @return {Boolean}         True if an UltraLight JSON device is included, false otherwise
 */
function isJSONMQTTDevice(devices) {
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'JSON::MQTT') {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if a JSON MQTT device is included with no API key
 * @param  {Array}   devices The array of devices
 * @return {Boolean}         True if a JSON MQTT device is included with no API key
 */
function isJSONMQTTDeviceWithNoAPIKey(devices) {
  /* jshint camelcase: false */
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'JSON::MQTT' && !devices[ii].api_key) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if an UltraLight HTTP device is included
 * @param  {array}   devices The array of devices to check
 * @return {Boolean}         True if an UltraLight HTTP device is included, false otherwise
 */
function isUltraLightHTTPDevice(devices) {
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'UltraLight::HTTP') {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if a UltraLight HTTP device is included with no API key
 * @param  {Array}   devices The array of devices
 * @return {Boolean}         True if a UltraLight HTTP device is included with no API key
 */
function isUltraLightHTTPDeviceWithNoAPIKey(devices) {
  /* jshint camelcase: false */
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'UltraLight::HTTP' && !devices[ii].api_key) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if an UltraLight MQTT device is included
 * @param  {array}   devices The array of devices to check
 * @return {Boolean}         True if an UltraLight MQTT device is included, false otherwise
 */
function isUltraLightMQTTDevice(devices) {
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'UltraLight::MQTT') {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if a UltraLight MQTT device is included with no API key
 * @param  {Array}   devices The array of devices
 * @return {Boolean}         True if a UltraLight MQTT device is included with no API key
 */
function isUltraLightMQTTDeviceWithNoAPIKey(devices) {
  /* jshint camelcase: false */
  for (var ii = 0; ii < devices.length; ii++) {
    if (devices[ii].protocol === 'UltraLight::MQTT' && !devices[ii].api_key) {
      return true;
    }
  }
  return false;
}

/**
 * Validates the IoT Agent configuration information
 * @param  {Object}   simulationConfiguration The simulation configuration
 * @param  {Function} callback                The callback
 */
function validateIoTAConfiguration(simulationConfiguration, callback) {
  /* jshint camelcase: false */
  if (Array.isArray(simulationConfiguration.devices) && simulationConfiguration.devices.length) {
    if (!simulationConfiguration.iota) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('No IoT Agent configuration information (the ' +
        '\'iota\' property is mandatory)'));
    }
    if (isUltraLightHTTPDevice(simulationConfiguration.devices)) {
      if (!simulationConfiguration.iota.ultralight) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No UltraLight IoT Agent configuration ' +
          'information (the \'iota.ultralight\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.http) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP configuration information for the ' +
          'UltraLight IoT Agent (the \'iota.ultralight.http\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.http.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP protocol in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.http.protocol\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.http.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP host in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.http.host\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.http.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP port in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.http.port\' property is mandatory)'));
      }
      if (isUltraLightHTTPDeviceWithNoAPIKey(simulationConfiguration.devices) &&
        !simulationConfiguration.iota.ultralight.api_key) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No API key in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.api_key\' property is mandatory if UltraLight HTTP ' +
          'devices are include with no specific API key information)'));
      }
    } else if (isUltraLightMQTTDevice(simulationConfiguration.devices)) {
      if (!simulationConfiguration.iota.ultralight) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No UltraLight IoT Agent configuration ' +
          'information (the \'iota.ultralight\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.mqtt) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT configuration information for the ' +
          'UltraLight IoT Agent (the \'iota.ultralight.mqtt\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.mqtt.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT protocol in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.mqtt.protocol\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.mqtt.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT host in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.mqtt.host\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.ultralight.mqtt.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT port in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.mqtt.port\' property is mandatory)'));
      }
      if (isUltraLightMQTTDeviceWithNoAPIKey(simulationConfiguration.devices) &&
        !simulationConfiguration.iota.ultralight.api_key) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No API key in the UltraLight IoT Agent ' +
          'configuration information (the \'iota.ultralight.api_key\' property is mandatory if UltraLight MQTT ' +
          'devices are include with no specific API key information)'));
      }
    } else if (isJSONHTTPDevice(simulationConfiguration.devices)) {
      if (!simulationConfiguration.iota.json) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No JSON IoT Agent configuration ' +
          'information (the \'iota.json\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.http) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP configuration information for the ' +
          'JSON IoT Agent (the \'iota.json.http\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.http.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP protocol in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.http.protocol\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.http.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP host in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.http.host\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.http.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No HTTP port in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.http.port\' property is mandatory)'));
      }
      if (isJSONHTTPDeviceWithNoAPIKey(simulationConfiguration.devices) &&
        !simulationConfiguration.iota.json.api_key) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No API key in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.api_key\' property is mandatory if JSON HTTP devices are ' +
          'include with no specific API key information)'));
      }
    } else if (isJSONMQTTDevice(simulationConfiguration.devices)) {
      if (!simulationConfiguration.iota.json) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No JSON IoT Agent configuration ' +
          'information (the \'iota.json\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.mqtt) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT configuration information for the ' +
          'JSON IoT Agent (the \'iota.ultralight.mqtt\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.mqtt.protocol) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT protocol in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.mqtt.protocol\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.mqtt.host) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT host in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.mqtt.host\' property is mandatory)'));
      }
      if (!simulationConfiguration.iota.json.mqtt.port) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No MQTT port in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.mqtt.port\' property is mandatory)'));
      }
      if (isJSONMQTTDeviceWithNoAPIKey(simulationConfiguration.devices) &&
        !simulationConfiguration.iota.json.api_key) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('No API key in the JSON IoT Agent ' +
          'configuration information (the \'iota.json.api_key\' property is mandatory if JSON MQTT ' +
          'devices are include with no specific API key information)'));
      }
    }
  }
  setImmediate(callback);
}

/**
 * Validates schedules
 * @param  {String}   schedule    The schedule to validate
 * @param  {String}   parentType  The associated parent element type
 * @param  {Number}   parentIndex The associated parent element index
 * @param  {Function} callback    The callback
 */
function validateSchedule(schedule, parentType, parentIndex, callback) {
  var err;
  var scheduleRegExp = new RegExp(
    '(^once$|^(\\*\\/[0-9]+\\s+|\\*\\s+|([0-9]+(\\,|\\-)?[0-9]*)+[0-9]+\\s+|[0-9]+\\s+){5}' +
      '(\\*\\/[0-9]+|\\*|([0-9]+(\\,|\\-)?[0-9]*)+[0-9]+|[0-9]+))',
    'g');

  if (typeof schedule === 'string') {
    if (schedule && !scheduleRegExp.test(schedule)) {
      err = new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
        'at array index position ' + parentIndex + ' includes an invalid schedule: \'' + schedule + '\'');
    }
  } else if (typeof schedule === 'object' && typeof schedule.rule === 'string' && !scheduleRegExp.test(schedule.rule)) {
    err = new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes an invalid schedule: \'' + schedule + '\'');
  }
  return callback(err);
}

/**
 * Validates values
 * @param  {String}   value          The value
 * @param  {String}   attributeType  The associated attribute type
 * @param  {Number}   attributeIndex The associated attribute number
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Function} callback       The callback
 */
function validateValue(value, attributeType, attributeIndex, parentType, parentIndex, callback) {
  if (!value && (value !== 0 && value !== false)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration information ' +
      'at array index position ' + parentIndex + ' includes ' +
      (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
      attributeIndex + ' missing the value property'));
  }
  if (typeof value === 'string') {
    if (value.indexOf('time-linear-interpolator(') === 0) {
      try {
        linearInterpolator(value.substring('time-linear-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time linear interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('time-random-linear-interpolator(') === 0) {
      try {
        randomLinearInterpolator(value.substring('time-random-linear-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time random linear interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('time-step-before-interpolator(') === 0) {
      try {
        stepBeforeInterpolator(value.substring('time-step-before-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time step before interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('time-step-after-interpolator(') === 0) {
      try {
        stepAfterInterpolator(value.substring('time-step-after-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid time step after interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('date-increment-interpolator(') === 0) {
      try {
        dateIncrementInterpolator(value.substring('date-increment-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid date increment interpolator: \'' + value + '\', due to error: ' + err));
      }
    } else if (value.indexOf('multiline-position-interpolator(') === 0) {
      try {
        multilinePositionInterpolator(value.substring('multiline-position-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid multiline position interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('multiline-bearing-interpolator(') === 0) {
      try {
        multilineBearingInterpolator(value.substring('multiline-bearing-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid multiline bearing interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('text-rotation-interpolator(') === 0) {
      try {
        textRotationInterpolator(value.substring('text-rotation-interpolator('.length, value.length - 1));
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid text rotation interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    } else if (value.indexOf('attribute-function-interpolator(') === 0) {
      try {
        attributeFunctionInterpolator(
          value.substring('attribute-function-interpolator('.length, value.length - 1),
          simulationConfiguration.domain,
          simulationConfiguration.contextBroker
        );
      } catch(err) {
        return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
          'information at array index position ' + parentIndex + ' includes ' +
          (attributeType === 'static' ? 'a staticAttributes' : 'an active') + ' attribute at array index position ' +
          attributeIndex + ' with an invalid attribute function interpolator: \'' + value + '\', due to error: ' +
          err));
      }
    }
  }
  setImmediate(callback);
}

/**
 * Validates a metadata entry
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {String}   attributeStr   The attribute type descriptive text
 * @param  {Number}   attributeIndex The attribute index
 * @param  {Object}   metadata       The metadata to validate
 * @param  {Number}   metadataIndex  The metadata index
 * @param  {Function} callback       The callback
 */
function validateMetadata(parentType, parentIndex, attributeStr, attributeIndex, metadata, metadataIndex, callback) {
  if (!metadata.name) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
      'information at array index position ' + parentIndex + ' includes ' +
      attributeStr + ' at array index position ' +
      attributeIndex + ' including a metadata entry at array index position ' + metadataIndex +
      ' missing the name property'));
  }
  if (!metadata.type) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
      'information at array index position ' + parentIndex + ' includes ' +
      attributeStr + ' at array index position ' +
      attributeIndex + ' including a metadata entry at array index position ' + metadataIndex +
      ' missing the type property'));
  }
  if (!metadata.value && (metadata.value !== 0 && metadata.value !== false)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
      'information at array index position ' + parentIndex + ' includes ' +
      attributeStr + ' at array index position ' +
      attributeIndex + ' including a metadata entry at array index position ' + metadataIndex +
      ' missing the value property'));
  }
  setImmediate(callback);
}

/**
 * Validates an attribute
 * @param  {String}   attributeType  The attribute type
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Object}   attribute      The attribute to validate
 * @param  {Number}   attributeIndex The index of the attribute to validate
 * @param  {Function} callback       The callback
 */
function validateAttribute(attributeType, parentType, parentIndex, attribute, attributeIndex, callback) {
  /* jshint camelcase: false */
  var attributeStr;
  switch (attributeType) {
    case 'active':
      attributeStr = 'an active attribute';
      break;
    case 'attribute':
      attributeStr = 'an attribute';
      break;
    case 'static':
      attributeStr = 'a static attribute';
      break;
  }
  if (attributeType === 'active' || attributeType === 'static') {
    if (!attribute.name) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
        'information at array index position ' + parentIndex + ' includes ' +
        attributeStr + ' at array index position ' +
        attributeIndex + ' missing the name property'));
    }
    if (!attribute.type) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
        'information at array index position ' + parentIndex + ' includes ' +
        attributeStr + ' at array index position ' +
        attributeIndex + ' missing the type property'));
    }
  } else {
    if (!attribute.object_id) {
      return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
        'information at array index position ' + parentIndex + ' includes ' +
        attributeStr + ' at array index position ' +
        attributeIndex + ' missing the object_id property'));
    }
  }

  async.series([
    async.apply(validateValue, attribute.value, attributeType, attributeIndex, parentType, parentIndex),
    async.apply(validateSchedule, attribute.schedule, parentType, parentIndex)
  ], function(err) {
    if (err) {
      return callback(err);
    } else {
      if (attribute.metadata) {
        if (!Array.isArray(attribute.metadata)) {
          return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
            'information at array index position ' + parentIndex + ' includes ' +
            attributeStr + ' at array index position ' +
            attributeIndex + ' including a metadata property which is not an array'));
        } else {
          async.eachOfSeries(attribute.metadata, async.apply(validateMetadata, parentType, parentIndex, attributeStr,
            attributeIndex), callback);
        }
      } else {
        setImmediate(callback);
      }
    }
  });
}

/**
 * Validates an array of attributes
 * @param  {Array}    attributes     Array of attributes to validate
 * @param  {String}   attributesType Type of the attributes to validate
 * @param  {String}   parentType     The associated parent element type
 * @param  {Number}   parentIndex    The associated parent element index
 * @param  {Function} callback       The callback
 */
function validateAttributes(attributes, attributesType, parentType, parentIndex, callback) {
  if (attributes) {
    if (Array.isArray(attributes)) {
      async.eachOfSeries(attributes, async.apply(validateAttribute, attributesType, parentType, parentIndex), callback);
    } else {
      var attributeStr;
      switch (attributesType) {
        case 'active':
          attributeStr = 'an active';
          break;
        case 'attribute':
          attributeStr = 'an attributes';
          break;
        case 'static':
          attributeStr = 'a staticAttributes';
          break;
      }
      return callback(new fdsErrors.SimulationConfigurationNotValid('The ' + parentType + ' configuration ' +
        'information at array index position ' + parentIndex + ' includes ' +
        attributeStr + ' property which is not an array'));
    }
  } else {
    setImmediate(callback);
  }
}

/**
 * Validates a device
 * @param  {Object}   deviceConfiguration The device configuration information
 * @param  {Number}   index               The element index
 * @param  {Function} callback            The callback
 */
function validateDeviceConfiguration(deviceConfiguration, index, callback) {
  /* jshint camelcase: false */
  if (!deviceConfiguration.device_id && !deviceConfiguration.count) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The devices configuration information ' +
      'at array index position ' + index + ' should include an device_id or count properties'));
  }
  if (!deviceConfiguration.protocol) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The devices configuration information ' +
      'at array index position ' + index + ' should include a protocol properties'));
  }
  if (deviceConfiguration.protocol !== 'UltraLight::HTTP' && deviceConfiguration.protocol !== 'UltraLight::MQTT' &&
    deviceConfiguration.protocol !== 'JSON::HTTP' && deviceConfiguration.protocol !== 'JSON::MQTT') {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The devices configuration information ' +
      'at array index position ' + index + ' includes a not supported protocol (\'' + deviceConfiguration.protocol +
      '\')'));
  }
  if (!deviceConfiguration.attributes || deviceConfiguration.attributes.length === 0) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The devices configuration information ' +
      'at array index position ' + index + ' misses attributes configuration information'));
  }
  async.series([
    async.apply(validateSchedule, deviceConfiguration.schedule, 'device', index),
    async.apply(validateAttributes, deviceConfiguration.attributes, 'attribute', 'device', index)
  ], callback);
}

/**
 * Validates an array of devices
 * @param  {Object}   simulationConfiguration The simulation configuration information
 * @param  {Function} callback                The callback
 */
function validateDevicesConfiguration(simulationConfiguration, callback) {
  if ((!simulationConfiguration.entities || simulationConfiguration.entities.length === 0) &&
    (!simulationConfiguration.devices || simulationConfiguration.devices.length === 0)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No entities and/or devices configuration ' +
      'information available (at least one of them is mandatory)'));
  }
  if (!simulationConfiguration.devices) {
    return setImmediate(callback);
  }
  if (!Array.isArray(simulationConfiguration.devices)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The devices ' +
      ' configuration information should be ' +
      'an array of devices configuration information'));
  }
  async.eachOfSeries(simulationConfiguration.devices, validateDeviceConfiguration, callback);
}

/**
 * Validates an entity
 * @param  {Object}   entityConfiguration The entity configuration information
 * @param  {Number}   index               The element index
 * @param  {Function} callback            The callback
 */
function validateEntityConfiguration(entityConfiguration, index, callback) {
  /* jshint camelcase: false */
  if (!entityConfiguration.entity_name && !entityConfiguration.count) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The entities configuration information ' +
      'at array index position ' + index + ' should include an entity_name or count properties'));
  }
  if (!entityConfiguration.entity_type) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The entities configuration information ' +
      ' at array index position ' + index + ' misses the entity_type property'));
  }
  if ((!entityConfiguration.staticAttributes || entityConfiguration.staticAttributes.length === 0) &&
    (!entityConfiguration.active || entityConfiguration.active.length === 0)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The entities configuration information ' +
      'at array index position ' + index + ' misses static and/or active attributes configuration information'));
  }
  async.series([
    async.apply(validateSchedule, entityConfiguration.schedule, 'entity', index),
    async.apply(validateAttributes, entityConfiguration.staticAttributes, 'static', 'entity', index),
    async.apply(validateAttributes, entityConfiguration.active, 'active', 'entity', index)
  ], callback);
}

/**
 * Validates an array of entities
 * @param  {Object}   simulationConfiguration The simulation configuration information
 * @param  {Function} callback                The callback
 */
function validateEntitiesConfiguration(simulationConfiguration, callback) {
  if ((!simulationConfiguration.entities || simulationConfiguration.entities.length === 0) &&
    (!simulationConfiguration.devices || simulationConfiguration.devices.length === 0)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('No entities and/or devices configuration ' +
      'information available (at least one of them is mandatory)'));
  }
  if (!simulationConfiguration.entities) {
    return setImmediate(callback);
  }
  if (!Array.isArray(simulationConfiguration.entities)) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The entities ' +
      'configuration information should be ' +
      'an array of entities configuration information'));
  }
  async.eachOfSeries(simulationConfiguration.entities, validateEntityConfiguration, callback);
}

/**
 * Validates a simulation configuration object
 * @param  {Object}   simulationConfiguration The simulation configuration object to validate
 * @param  {Function} callback                The callback
 */
function validateConfiguration(theSimulationConfiguration, callback) {
  simulationConfiguration = theSimulationConfiguration;
  async.series([
    async.apply(validateGlobals, simulationConfiguration),
    async.apply(validateRequire, simulationConfiguration),
    async.apply(validateDomain, simulationConfiguration),
    async.apply(validateContextBrokerOrSubscriberConfiguration, simulationConfiguration),
    async.apply(validateAuthenticationConfiguration, simulationConfiguration),
    async.apply(validateIoTAConfiguration, simulationConfiguration),
    async.apply(validateEntitiesConfiguration, simulationConfiguration),
    async.apply(validateDevicesConfiguration, simulationConfiguration)
  ], function(err) {
    return setImmediate(callback.bind(null, err, simulationConfiguration));
  });
}

module.exports = {
  validateConfiguration: validateConfiguration
};
