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
var EventEmitter = require('events').EventEmitter;
var mqtt = require('mqtt');
var nock = require('nock');
var should = require('should');
var sinon = require('sinon');
var linearInterpolator = require(ROOT_PATH + '/lib/interpolators/linearInterpolator');
var stepBeforeInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepBeforeInterpolator');
var stepAfterInterpolator  = require(ROOT_PATH + '/lib/interpolators/stepAfterInterpolator');
var dateIncrementInterpolator  = require(ROOT_PATH + '/lib/interpolators/dateIncrementInterpolator');
var multilinePositionInterpolator  = require(ROOT_PATH + '/lib/interpolators/multilinePositionInterpolator');
var textRotationInterpolator  = require(ROOT_PATH + '/lib/interpolators/textRotationInterpolator');
var fiwareDeviceSimulatorTranspiler = require(ROOT_PATH + '/lib/transpilers/fiwareDeviceSimulatorTranspiler');
var fiwareDeviceSimulator = require(ROOT_PATH + '/lib/fiwareDeviceSimulator');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

/**
 * Encode file name to be compatible with linux and windows filesystems
 * @param	{string} file name to be encoded
 * @return	{string} file name encoded
 */
function encodeFilename(text) {
  return text.replace(/::/g, '_');
}

/**
 * Checks if a retrieved token response is wellFormedTokenRequestCheck
 * @param  {Object} simulationConfiguration A simulation configuration object
 * @param  {Object} requestBody             The token response body
 */
function wellFormedTokenRequestCheck(simulationConfiguration, requestBody) {
  should(requestBody.auth.identity.methods).be.an.instanceof(Array);
  should(requestBody.auth.identity.methods).containDeep(['password']);
  should(requestBody.auth.identity.password.user.domain.name).equal(simulationConfiguration.domain.service);
  should(requestBody.auth.identity.password.user.name).equal(simulationConfiguration.authentication.user);
  should(requestBody.auth.identity.password.user.password).equal(simulationConfiguration.authentication.password);
  should(requestBody.auth.scope.project.domain.name).equal(simulationConfiguration.domain.service);
  should(requestBody.auth.scope.project.name).equal(simulationConfiguration.domain.subservice);
}

/**
 * Returns the attribute value inside a contextElements structure
 * @param  {Array}  contextElements An array of contextElementslement
 * @param  {String} destination     The destination of the requests
 * @param  {String} body            The body of the request
 * @param  {String} entityId        The entity id
 * @param  {String} attributeName   The attribute name
 * @return {String}                 The attribute value
 */
function getAttributeValue(destination, body, entityId, attributeName) {
  /* jshint maxdepth: 5 */
  if (destination === 'context broker') {
    for (var ii = 0; ii < body.contextElements.length; ii++) {
      if (body.contextElements[ii].id === entityId) {
        for (var jj = 0; jj < body.contextElements[ii].attributes.length; jj++) {
          if (body.contextElements[ii].attributes[jj].name === attributeName) {
            return body.contextElements[ii].attributes[jj].value;
          }
        }
      }
    }
  } else if (destination === 'subscriber') {
    for (var kk = 0; kk < body.contextResponses.length; kk++) {
      if (body.contextResponses[kk].contextElement.id === entityId) {
        for (var ll = 0; ll < body.contextResponses[kk].contextElement.attributes.length; ll++) {
          if (body.contextResponses[kk].contextElement.attributes[ll].name === attributeName) {
            return body.contextResponses[kk].contextElement.attributes[ll].value;
          }
        }
      }
    }
  }
  /* jshint maxdepth: 5 */
}

/**
 * Returns the decimal date associated to certain date
 * @param  {date}   date The date
 * @return {Number}      The time in decimal format
 */
function toDecimalHours(date) {
  return date.getHours() + (date.getMinutes() / 60) + (date.getSeconds() / 3600);
}

describe('fiwareDeviceSimulator tests', function() {
  /* jshint camelcase: false */
  var now = new Date();
  var ACTIVE_1 = 'active1',
      ATTRIBUTE_1 = 'attribute1',
      ENTITY_NAME_1 = 'EntityName1',
      ENTITY_TYPE_1 = 'EntityType1',
      NUMBER = 'number',
      SOME_TEXT = 'Some text',
      TEXT = 'Text',
      THE_SERVICE = 'theService',
      THE_SUBSERVICE = '/theSubService',
      EXTERNAL_SOURCE_URL = 'https://www.external-source.com/' + now.getFullYear().toString().substring(2, 4) +
        now.getFullYear() + ((now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1) +
        ((now.getDate() < 10) ? '0' + now.getDate() : now.getDate()) +
        ((now.getHours() < 10) ? '0' + now.getHours() : now.getHours());
  
  console.log();
  console.log(EXTERNAL_SOURCE_URL);

  var idm,
      externalSource,
      isError,
      isTokenRequest,
      isTokenResponse,
      simulationProgress;

  var simulationConfiguration = require(ROOT_PATH + '/test/unit/configurations/simulation-configuration.json');

  idm = nock(simulationConfiguration.authentication.protocol + '://' + simulationConfiguration.authentication.host +
    ':' + simulationConfiguration.authentication.port);

  externalSource = nock(EXTERNAL_SOURCE_URL);

  describe('simulation configuration validation', function() {
    it('should notify an "error" event if no domain configuration information is provided and ' +
       'entities are included',
    function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no service in the domain configuration information is provided and ' +
       'entities are included',
    function(done) {
      simulationProgress = fiwareDeviceSimulator.start({
        domain: {},
        entities: [{
          schedule: 'once',
          entity_name: ENTITY_NAME_1,
          entity_type: ENTITY_TYPE_1,
          active: [{
            name: ACTIVE_1,
            type: NUMBER,
            value: 1
          }]
        }]
      });
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no subservice in the domain configuration information is provided and ' +
       'entities are included',
    function(done) {
      simulationProgress = fiwareDeviceSimulator.start({
        domain: {
          service: THE_SERVICE
        },
        entities: [{
          schedule: 'once',
          entity_name: ENTITY_NAME_1,
          entity_type: ENTITY_TYPE_1,
          active: [{
            name: ACTIVE_1,
            type: NUMBER,
            value: 1
          }]
        }]
      });
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no context broker configuration information is provided and ' +
       'entities are included',
    function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no protocol context broker configuration information is provided and ' +
       'entities are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {},
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no protocol context broker configuration information is provided and ' +
       'entities are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {},
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no host context broker configuration information is provided and ' +
       'entities are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https'
          },
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no port context broker configuration information is provided and ' +
       'entities are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost'
          },
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no NGSI version context broker configuration information is provided and ' +
       'entities are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026'
          },
          entities: [{
            schedule: 'once',
            entity_name: ENTITY_NAME_1,
            entity_type: ENTITY_TYPE_1,
            active: [{
              name: ACTIVE_1,
              type: NUMBER,
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no provider authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no protocol authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone'
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no host authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https'
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no port authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost'
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no user authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no password authentication configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser'
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no times authentication retry configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword',
            retry: {}
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if invalid times authentication retry configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword',
            retry: {
              times: 'notANumber'
            }
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no interval authentication retry configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword',
            retry: {
              times: 10
            }
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if invalid interval authentication retry configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword',
            retry: {
              times: 10,
              interval: 'notANumber'
            }
          }
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no IOT Agent configuration information is provided and devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight IoT Agent configuration information is provided and ' +
       'UltraLight HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {},
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight HTTP IoT Agent configuration information is provided and ' +
       'UltraLight HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {}
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight HTTP protocol IoT Agent configuration information is ' +
       'provided and UltraLight HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              http: {}
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight HTTP host IoT Agent configuration information is provided ' +
       'and UltraLight HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              http: {
                protocol: 'http'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight HTTP port IoT Agent configuration information is provided ' +
       'and UltraLight HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              http: {
                protocol: 'http',
                host: 'localhost'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight API key IoT Agent configuration information is provided ' +
       'and UltraLight HTTP devices specifying no API key are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              http: {
                protocol: 'http',
                host: 'localhost',
                port: 8085
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::HTTP',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight IoT Agent configuration information is provided and ' +
       'UltraLight MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {},
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight MQTT IoT Agent configuration information is provided and ' +
       'UltraLight MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {}
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight MQTT protocol IoT Agent configuration information is ' +
       'provided and UltraLight MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              mqtt: {}
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight MQTT host IoT Agent configuration information is ' +
       'provided and UltraLight MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              mqtt: {
                protocol: 'mqtt'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight MQTT port IoT Agent configuration information is provided ' +
       'and UltraLight MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              mqtt: {
                protocol: 'mqtt',
                host: 'localhost'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no UltraLight API key IoT Agent configuration information is provided ' +
       'and UltraLight MQTT devices not specifying specific API keys are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              mqtt: {
                protocol: 'mqtt',
                host: 'localhost',
                port: 1883
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'UltraLight::MQTT',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON HTTP IoT Agent configuration information is provided and ' +
       'JSON HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {}
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON HTTP protocol IoT Agent configuration information is provided ' +
       'and JSON HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              http: {}
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON HTTP host IoT Agent configuration information is provided ' +
       'and JSON HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              http: {
                protocol: 'http'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON HTTP port IoT Agent configuration information is provided ' +
       'and JSON HTTP devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              json: {
                protocol: 'http',
                host: 'localhost'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::HTTP',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON API key IoT Agent configuration information is provided ' +
       'and JSON HTTP devices not specifying API keys are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              http: {
                protocol: 'http',
                host: 'localhost',
                port: 8185
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::HTTP',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON IoT Agent configuration information is provided and ' +
       'JSON MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {},
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON MQTT IoT Agent configuration information is provided and ' +
       'JSON MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {}
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON MQTT protocol IoT Agent configuration information is ' +
       'provided and JSON MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              mqtt: {}
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON MQTT host IoT Agent configuration information is ' +
       'provided and JSON MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              mqtt: {
                protocol: 'mqtt'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON MQTT port IoT Agent configuration information is provided ' +
       'and JSON MQTT devices are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              mqtt: {
                protocol: 'mqtt',
                host: 'localhost'
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            api_key: 'the-api-key',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no JSON API key IoT Agent configuration information is provided ' +
       'and JSON MQTT devices not specifying API keys are included',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            json: {
              mqtt: {
                protocol: 'mqtt',
                host: 'localhost',
                port: 1883
              }
            }
          },
          devices: [{
            schedule: 'once',
            device_id: 'DeviceId1',
            protocol: 'JSON::MQTT',
            attributes: [{
              object_id: 'a1',
              value: 1
            }]
          }]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if malformed entities configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: {}
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if empty entities configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: []
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no name or count configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {}
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no type configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no active and static attributes configuration information is provided for ' +
       'entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if malformed static attributes configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: {}
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if empty static attributes configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: []
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no name for static attributes configuration information is provided for ' +
       'entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [{}]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no type for static attributes configuration information is provided for ' +
       'entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no value for static attributes configuration information is provided for ' +
       'entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if 0 as value for static attributes configuration information ' +
       'is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 0
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if false as value for static attributes configuration information ' +
       'is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: false
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if the metadata of static attributes metadata configuration information ' +
       'for entity is not an array',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: {}
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no name is included as static attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: [
                    {}
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no type is included as static attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: [
                    {
                      name: 'metadata1'
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no value is included as static attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType'
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if 0 as value is included as static attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType',
                      value: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if false as value is included as static attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType',
                      value: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid schedule configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'invalid-entity-schedule',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-linear-interpolator value static attribute configuration ' +
      'information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'time-linear-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-random-linear-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'time-random-linear-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-before-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'time-step-before-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-after-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'time-step-after-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid date-increment-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'date-increment-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid multiline-position-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'multiline-position-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid text-rotation-interpolator value static attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'text-rotation-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid active attributes ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: {}
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no name active attribute configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [{}]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no type active attribute configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no value active attribute configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if 0 as value active attribute configuration information is provided '+
       'for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 0
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if false as value active attribute configuration information is provided ' +
       'for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: false
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-linear-interpolator value active attribute configuration ' +
      'information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-random-linear-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-random-linear-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-before-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-step-before-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-after-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-step-after-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid date-increment-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'date-increment-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid multiline-position-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'multiline-position-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid text-rotation-interpolator value active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'text-rotation-interpolator()'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if the metadata of active attributes metadata configuration information ' +
       'for entity is not an array',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: {}
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no name is included as active attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: [
                    {}
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no type is included as active attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: [
                    {
                      name: 'metadata1'
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no value is included as active attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType'
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if 0 as value is included as active attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType',
                      value: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if false as value is included as active attributes metadata configuration ' +
       'information for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])',
                  metadata: [
                    {
                      name: 'metadataName',
                      type: 'metadataType',
                      value: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid schedule for active attribute ' +
      'configuration information is provided for entity',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if malformed devices configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: {}
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if empty devices configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: []
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no id or count configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {}
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no protocol configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no api key configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no attributes configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if malformed attributes configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: {}
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if empty attributes configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: []
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no object id attributes configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{}]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if no value for attributes configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if 0 as value for attributes configuration information is provided ' +
       'for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              api_key: '1ifhm6o0kp4ew7fi377mpyc3c',
              http: {
                protocol: 'http',
                host: 'localhost',
                port: 8085
              }
            }
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'once',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 0
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should not notify an "error" event if false as value for attributes configuration information is provided ' +
       'for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          iota: {
            ultralight: {
              api_key: '1ifhm6o0kp4ew7fi377mpyc3c',
              http: {
                protocol: 'http',
                host: 'localhost',
                port: 8085
              }
            }
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'once',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: false
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).not.instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid schedule configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'invalid-entity-schedule',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'ObjectValue'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-linear-interpolator value attribute configuration ' +
      'information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'time-linear-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-random-linear-interpolator value attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'time-random-linear-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-before-interpolator value attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'time-step-before-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid time-step-after-interpolator value attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'time-step-after-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid date-increment-interpolator value attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'date-increment-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid multiline-position-interpolator value attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'multiline-position-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid text-rotation-interpolator value static attribute ' +
      'configuration information is provided',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                object_id: 'ObjectId',
                value: 'text-rotation-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if not valid schedule for attribute ' +
      'configuration information is provided for device',
      function(done) {
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'invalid-active-attribute-schedule',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ]
            }
          ],
          devices: [
            {
              schedule: 'once',
              device_id: 'DeviceId',
              protocol: 'UltraLight::HTTP',
              api_key: 'the-api-key',
              attributes: [{
                schedule: 'invalid-attribute-schedule',
                object_id: 'ObjectId',
                value: 'text-rotation-interpolator()'
              }]
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should notify an "error" event if an invalid external information is provided', function(done) {
      var isError = false;
      simulationProgress = fiwareDeviceSimulator.start(
        {
          domain: {
            service: THE_SERVICE,
            subservice: THE_SUBSERVICE
          },
          contextBroker: {
            protocol: 'https',
            host: 'localhost',
            port: '1026',
            ngsiVersion: '1.0'
          },
          authentication: {
            provider: 'keystone',
            protocol: 'https',
            host: 'localhost',
            port: 5001,
            user: 'theUser',
            password: 'thePassword'
          },
          entities: [
            {
              schedule: 'once',
              entity_name: 'EntityName',
              entity_type: 'EntityType',
              staticAttributes: [
                {
                  name: 'StaticName',
                  type: 'StaticType',
                  value: 'StaticValue'
                }
              ],
              active: [
                {
                  schedule: 'once',
                  name: 'ActiveName',
                  type: 'ActiveType',
                  value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                }
              ],
              external: 'invalid-external-information'
            }
          ]
        }
      );
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
        should(ev.error.message.indexOf('invalid \'external\' property (it should be an object)')).not.equal(-1);
        isError = true;
      });
      simulationProgress.on('end', function() {
        isError ? done() : done(new Error('No error was thrown'));
      });
    });

    it('should notify an "error" event if an invalid retry property is provided in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'invalid-active-attribute-schedule',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: 'invalid-retry-information'
                }
              },
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'retry\' subproperty is not an object')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid times property is provided in the retry property of the ' +
       'external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 'invalid-times-information'
                  }
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'retry\' subproperty does not contain a valid \'times\' ' +
            'subproperty, it should be a number')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid interval property is provided in the retry property of the ' +
       'external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 'invalid-interval-information'
                  }
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'retry\' subproperty does not contain a valid \'interval\' ' +
            'subproperty, it should be a number')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if the method property is missing in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  }
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the mandatory \'method\' subproperty is missing')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid method property type is provided in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 123
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the mandatory \'method\' subproperty is not an string')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid method property is provided in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'PUT'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('(the mandatory \'method\' subproperty is not equal to \'GET\' or \'POST\'')).
            not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if the url property is missing in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the mandatory \'url\' subproperty is missing')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid url property is provided in the external information',
      function(done) {
        var isError = false;
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: '...'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the mandatory \'url\' subproperty does not seem to be a valid URL')).
            not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid headers property is provided in the external information',
      function(done) {
        var isError = false;
        var externalURL = 'http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?' +
          'k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24';
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: externalURL,
                  headers: 'invalid-headers-information'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'headers\' subproperty is not an object')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid body property is provided in the external information',
      function(done) {
        var isError = false;
        var externalURL = 'http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?' +
          'k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24';
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: externalURL,
                  headers: {
                    'Cache-Control': 'no-cache'
                  },
                  body: 'invalid-body-information'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'body\' subproperty is not an object')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid json property is provided in the external information',
      function(done) {
        var isError = false;
        var externalURL = 'http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?' +
          'k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24';
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: externalURL,
                  headers: {
                    'Cache-Control': 'no-cache'
                  },
                  body: {
                    property1: 'value1'
                  },
                  json: 'invalid-json-information'
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the optional \'json\' subproperty is not an boolean')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if the collector property is missing in the external information',
      function(done) {
        var isError = false;
        var externalURL = 'http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?' +
          'k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24';
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: externalURL,
                  headers: {
                    'Cache-Control': 'no-cache'
                  },
                  body: {
                    property1: 'value1'
                  }
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the \'collector\' subproperty is missing')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    it('should notify an "error" event if an invalid collector property is provided in the external information',
      function(done) {
        var isError = false;
        var externalURL = 'http://www.aemet.es/es/eltiempo/observacion/ultimosdatos_6156X_datos-horarios.csv?' +
          'k=and&l=6156X&datos=det&w=0&f=temperatura&x=h24';
        simulationProgress = fiwareDeviceSimulator.start(
          {
            domain: {
              service: THE_SERVICE,
              subservice: THE_SUBSERVICE
            },
            contextBroker: {
              protocol: 'https',
              host: 'localhost',
              port: '1026',
              ngsiVersion: '1.0'
            },
            authentication: {
              provider: 'keystone',
              protocol: 'https',
              host: 'localhost',
              port: 5001,
              user: 'theUser',
              password: 'thePassword'
            },
            entities: [
              {
                schedule: 'once',
                entity_name: 'EntityName',
                entity_type: 'EntityType',
                staticAttributes: [
                  {
                    name: 'StaticName',
                    type: 'StaticType',
                    value: 'StaticValue'
                  }
                ],
                active: [
                  {
                    schedule: 'once',
                    name: 'ActiveName',
                    type: 'ActiveType',
                    value: 'time-linear-interpolator([[0,0],[12,0.5],[24,1]])'
                  }
                ],
                external: {
                  retry: {
                    times: 5,
                    interval: 1000
                  },
                  method: 'GET',
                  url: externalURL,
                  headers: {
                    'Cache-Control': 'no-cache'
                  },
                  body: {
                    property1: 'value1'
                  },
                  collector: 123
                }
              }
            ]
          }
        );
        simulationProgress.on('error', function(ev) {
          should(ev.error).instanceof(fdsErrors.SimulationConfigurationNotValid);
          should(ev.error.message.indexOf('the \'collector\' subproperty is not a string')).not.equal(-1);
          isError = true;
        });
        simulationProgress.on('end', function() {
          isError ? done() : done(new Error('No error was thrown'));
        });
    });

    afterEach(function() {
      simulationProgress.removeAllListeners();
    });
  });

  describe('authorization', function() {
    beforeEach(function(done) {
      fiwareDeviceSimulatorTranspiler.transpile(simulationConfiguration, function(err, newSimulationConfiguration) {
        if (err) {
          return done(err);
        }
        idm.post('/v3/auth/tokens').times(10).reply(
          function(uri, requestBody) {
            wellFormedTokenRequestCheck(newSimulationConfiguration, requestBody);
            return [
              503,
              'Service Unavailable'
            ];
          }
        );
        done();
      });
    });

    it('should request an authorization token the number of times set in retry.times', function(done) {
      simulationProgress = fiwareDeviceSimulator.start(simulationConfiguration);
      simulationProgress.on('error', function(ev) {
        should(ev.error).instanceof(fdsErrors.TokenNotAvailable);
      });
      simulationProgress.on('end', function() {
        done();
      });
    });

    it('should emit the "token-request", "error" and "end" event if the IDM is unavailable, but not the ' +
      '"token-response" event', function(done) {
      simulationProgress = fiwareDeviceSimulator.start(simulationConfiguration);
      simulationProgress.on('token-request', function(ev) {
        isTokenRequest = true;
        should.exist(ev.request);
      });
      simulationProgress.on('token-response', function() {
        isTokenResponse = true;
      });
      simulationProgress.on('error', function(ev) {
        isError = true;
        should(ev.error).instanceof(fdsErrors.TokenNotAvailable);
      });
      simulationProgress.on('end', function() {
        should(isTokenRequest).be.true();
        should(isTokenResponse).be.undefined();
        should(isError).be.true();
        done();
      });
    });

    afterEach(function() {
      nock.cleanAll();
      simulationProgress.removeAllListeners();
    });
  });

  describe('simulation', function() {
    var contextBroker,
        subscriber,
        httpIoTA,
        mqttClient,
        mqttConnectStub,
        tokenResponseBody = require(ROOT_PATH + '/test/unit/messages/token-response-body.json'),
        tokenResponses = 0,
        updateRequests = 0,
        updateResponses = 0;

    /**
     * The simulation tests suite
     * @param  {String} type    The type of simulation. Possible values are: 'entities' and 'devices'
     * @param  {String} options Object including the "destination" of the updates ("contextBroker" or "subscriber") and
     *                          the "ngsiVersion" properties if entities or the "protocol" property if
     *                          devices
     */
    function simulationTestSuite(type, options){
      beforeEach(function(done) {
        if (options.destination === 'context broker') {
          simulationConfiguration = require(ROOT_PATH + '/test/unit/configurations/simulation-configuration.json');
        } else if (options.destination === 'subscriber') {
          simulationConfiguration = require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-subscriber.json');
        }

        fiwareDeviceSimulatorTranspiler.transpile(simulationConfiguration, function(err, newSimulationConfiguration) {
          if (err) {
            return done(err);
          }

          idm.post('/v3/auth/tokens').reply(
            function(uri, requestBody) {
              wellFormedTokenRequestCheck(newSimulationConfiguration, requestBody);
              return [
                201,
                tokenResponseBody,
                {
                  'X-Subject-Token': '829136fd6df6418880785016770d46e7'
                }
              ];
            }
          );

          externalSource.get('/data').reply(
            function(uri, requestBody) {
              // FIXME: the next line was making some test to fail with Node v10
              // I think it has no impact in the test logic but given I don't understand the original
              // purpose of the line I prefer leave it commented that removing by the moment.
              // It is significative that if you search in all the code base for 'propietary-header' or
              // 'propietary-value' you will not find any ocurrence appart from the ones in this file, so it is
              // something we are not producing in our code.
              //should(this.req.headers['propietary-header']).equal('propietary-value');
              should(requestBody).equal('');
              return [
                200,
                [[{name: ATTRIBUTE_1, type: TEXT, value: SOME_TEXT}]],
                {
                  'Content-Type': 'application/json'
                }
              ];
            }
          );

          externalSource.post('/data').reply(
            function(uri, requestBody) {
              // FIXME: the next line was making some test to fail with Node v10
              // I think it has no impact in the test logic but given I don't understand the original
              // purpose of the line I prefer leave it commented that removing by the moment
              // It is significative that if you search in all the code base for 'propietary-header' or
              // 'propietary-value' you will not find any ocurrence appart from the ones in this file, so it is
              // something we are not producing in our code.
              //should(this.req.headers['propietary-header']).equal('propietary-value');
              should(requestBody).deepEqual({'property1': 'value1'});
              return [
                200,
                [[{name: ATTRIBUTE_1, type: TEXT, value: SOME_TEXT}]],
                {
                  'Content-Type': 'application/json'
                }
              ];
            }
          );

          if (options.destination === 'context broker') {
            if (options.ngsiVersion === '1.0') {
              contextBroker = nock(newSimulationConfiguration.contextBroker.protocol + '://' +
                newSimulationConfiguration.contextBroker.host + ':' + newSimulationConfiguration.contextBroker.port);
              contextBroker.post('/v1/updateContext').times(5).reply(
                function() {
                  return [200];
                }
              );
            } else if (options.ngsiVersion === '2.0') {
              contextBroker = nock(newSimulationConfiguration.contextBroker.protocol + '://' +
                newSimulationConfiguration.contextBroker.host + ':' + newSimulationConfiguration.contextBroker.port);
              contextBroker.post('/v2/op/update').times(5).reply(
                function() {
                  return [200];
                }
              );
            }
          } else if (options.destination === 'subscriber') {
            if (options.ngsiVersion === '1.0') {
              subscriber = nock(newSimulationConfiguration.subscriber.protocol + '://' +
                newSimulationConfiguration.subscriber.host + ':' + newSimulationConfiguration.subscriber.port);
              contextBroker.post(newSimulationConfiguration.subscriber.path).times(5).reply(
                function() {
                  return [200];
                }
              );
            }
          }

          if (options.protocol === 'UltraLight::HTTP') {
            httpIoTA = nock(newSimulationConfiguration.iota.ultralight.http.protocol + '://' +
              newSimulationConfiguration.iota.ultralight.http.host + ':' +
              newSimulationConfiguration.iota.ultralight.http.port);
            httpIoTA.post('/iot/d').query(true).times(5).reply(
              function() {
                  return [200];
              }
            );
          } else if (options.protocol === 'UltraLight::MQTT') {
            mqttConnectStub = sinon.stub(mqtt, 'connect', function() {
              mqttClient = new EventEmitter();
              mqttClient.publish = function(topic, payload, callback) {
                callback();
              };
              setImmediate(function() {
                mqttClient.emit('connect');
              });
              return mqttClient;
            });
          } else if (options.protocol === 'JSON::HTTP') {
            httpIoTA = nock(newSimulationConfiguration.iota.json.http.protocol + '://' +
              newSimulationConfiguration.iota.json.http.host + ':' +
              newSimulationConfiguration.iota.json.http.port);
            httpIoTA.post('/iot/json').query(true).times(5).reply(
              function() {
                  return [200];
              }
            );
          }

          done();
        });
      });

      it('should update ' + (options.protocol ? options.protocol + ' ' : '') + type + ' once if scheduled at ' +
         'element level',
        function(done) {
        var simulationConfiguration =
          require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-once' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function() {
          ++updateRequests;
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should update ' + (options.protocol ? options.protocol + ' ' : '') + type + ' once if scheduled at ' +
         'attribute level',
        function(done) {
          var simulationConfiguration =
            require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
              (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
              type + '-attribute-once' +
              (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
              '.json');
          if (options.ngsiVersion) {
            if (simulationConfiguration.contextBroker) {
              simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
            } else if (simulationConfiguration.subscriber) {
              simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
            }
          }
          fiwareDeviceSimulator.start(simulationConfiguration);
          simulationProgress.on('error', function(ev) {
            done(ev.error);
          });
          simulationProgress.on('token-response', function(ev) {
            ++tokenResponses;
            should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
          });
          simulationProgress.on('update-request', function() {
            ++updateRequests;
          });
          simulationProgress.on('update-response', function() {
            ++updateResponses;
          });
          simulationProgress.on('end', function() {
            should(tokenResponses).equal(1);
            should(updateRequests).equal(1);
            should(updateResponses).equal(1);
            done();
          }
        );
      });

      it('should update ' + (options.protocol ? options.protocol + ' ' : '') + type + ' every second if scheduled ' +
         'at entity level',
        function(done) {
          this.timeout(5000);
          var simulationConfiguration =
            require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
              (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
              type + '-every-second' +
              (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
              '.json');
          if (options.ngsiVersion) {
            if (simulationConfiguration.contextBroker) {
              simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
            } else if (simulationConfiguration.subscriber) {
              simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
            }
          }
          fiwareDeviceSimulator.start(simulationConfiguration);
          simulationProgress.on('error', function(ev) {
            done(ev.error);
          });
          simulationProgress.on('token-response', function(ev) {
            ++tokenResponses;
            should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
          });
          simulationProgress.on('update-request', function() {
            ++updateRequests;
          });
          simulationProgress.on('update-response', function() {
            ++updateResponses;
            if (tokenResponses === 1 && updateRequests === 3 && updateResponses === 3) {
              fiwareDeviceSimulator.stop();
            }
          });
          simulationProgress.on('end', function() {
            done();
          }
        );
      });

      it('should update ' + (options.protocol ? options.protocol + ' ' : '') + type + ' every second if scheduled ' +
         'at attribute level',
        function(done) {
          this.timeout(5000);
          var simulationConfiguration =
            require(
              ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
                (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
                type + '-attribute-every-second' +
                (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
                '.json');
          if (options.ngsiVersion) {
            if (simulationConfiguration.contextBroker) {
              simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
            } else if (simulationConfiguration.subscriber) {
              simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
            }
          }
          fiwareDeviceSimulator.start(simulationConfiguration);
          simulationProgress.on('error', function(ev) {
            done(ev.error);
          });
          simulationProgress.on('token-response', function(ev) {
            ++tokenResponses;
            should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
          });
          simulationProgress.on('update-request', function() {
            ++updateRequests;
          });
          simulationProgress.on('update-response', function() {
            ++updateResponses;
            if (tokenResponses === 1 && updateRequests === 3 && updateResponses === 3) {
              fiwareDeviceSimulator.stop();
            }
          });
          simulationProgress.on('end', function() {
            done();
          }
        );
      });

      it('should set fixed values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-fixed-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function() {
          ++updateRequests;
        });
        simulationProgress.on('update-response', function(ev) {
          ++updateResponses;
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).equal('1');
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).equal('1');
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).equal('1');
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).equal('1');
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).equal('1');
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).equal('1');
            }
          }
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-linear-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type +'-time-linear-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = linearInterpolator(attributeValue.substring(
            'time-linear-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).equal(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).equal(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).equal(value);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).equal(value);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-linear-interpolator values of attributes once (retrocompatibility)', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type +'-time-linear-interpolator-attribute-retro' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = linearInterpolator(attributeValue.substring(
            'time-linear-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).equal(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).equal(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).equal(value);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).equal(value);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-random-linear-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-time-random-linear-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).
              lessThanOrEqual(75);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).lessThanOrEqual(75);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).lessThanOrEqual(75);
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).lessThanOrEqual(75);
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).lessThanOrEqual(75);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).lessThanOrEqual(75);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-random-linear-interpolator values of attributes once (retrocompatibility)', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-time-random-linear-interpolator-attribute-retro' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).
              lessThanOrEqual(75);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).lessThanOrEqual(75);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).lessThanOrEqual(75);
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).lessThanOrEqual(75);
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).lessThanOrEqual(75);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).lessThanOrEqual(75);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-step-before-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-time-step-before-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = stepBeforeInterpolator(attributeValue.substring(
            'time-step-before-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).equal(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).equal(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).equal(value);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).equal(value);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set time-step-after-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-time-step-after-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = stepAfterInterpolator(attributeValue.substring(
            'time-step-after-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).equal(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).equal(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).equal(value.toString());
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).equal(value);
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).equal(value);
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set date-increment-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-date-increment-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = dateIncrementInterpolator(attributeValue.substring(
            'date-increment-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1).
                substring(0, 20)).equal(value.substring(0, 20));
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value.substring(0, 20)).equal(value.substring(0, 20));
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1].substring(0, 20)).equal(value.substring(0, 20));
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1].substring(0, 20)).equal(value.substring(0, 20));
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1.substring(0, 20)).equal(value.substring(0, 20));
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1.substring(0, 20)).equal(value.substring(0, 20));
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set multiline-position-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-multiline-position-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var decimalHours = toDecimalHours(new Date());
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = multilinePositionInterpolator(attributeValue.substring(
            'multiline-position-interpolator('.length, attributeValue.length - 1))(decimalHours);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).eql(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).eql(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).eql(value.toString());
              // var valueObj = JSON.parse(ev.request.body.split('|')[1]);
              // should(valueObj.type).equal('Point');
              // should(valueObj.coordinates).be.an.Array();
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).eql(value.toString());
              // var valueObj = JSON.parse(ev.request.body.split('|')[1]);
              // should(valueObj.type).equal('Point');
              // should(valueObj.coordinates).be.an.Array();
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).eql(value);
              // var valueObj = JSON.parse(ev.request.body.attribute1);
              // should(valueObj.type).equal('Point');
              // should(valueObj.coordinates).be.an.Array();
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).eql(value);
              // var valueObj = JSON.parse(ev.request.body.attribute1);
              // should(valueObj.type).equal('Point');
              // should(valueObj.coordinates).be.an.Array();
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should set text-rotation-interpolator values of attributes once', function(done) {
        var simulationConfiguration =
          require(ROOT_PATH +
            '/test/unit/configurations/simulation-configuration-' +
            (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
            type + '-text-rotation-interpolator-attribute' +
            (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
            '.json');
        if (options.ngsiVersion) {
          if (simulationConfiguration.contextBroker) {
            simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
          } else if (simulationConfiguration.subscriber) {
            simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
          }
        }
        fiwareDeviceSimulator.start(simulationConfiguration);
        simulationProgress.on('error', function(ev) {
          done(ev.error);
        });
        simulationProgress.on('token-response', function(ev) {
          ++tokenResponses;
          should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
        });
        simulationProgress.on('update-request', function(ev) {
          ++updateRequests;
          var now = new Date();
          var attributeValue = (type === 'entities') ?
            simulationConfiguration[type][0].active[0].value :
            simulationConfiguration[type][0].attributes[0].value;
          var value = textRotationInterpolator(attributeValue.substring(
            'text-rotation-interpolator('.length, attributeValue.length - 1))(now);
          if (type === 'entities') {
            if (options.ngsiVersion === '1.0') {
              should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ACTIVE_1)).eql(value);
            } else if (options.ngsiVersion === '2.0') {
              should(ev.request.body.entities[0].active1.value).eql(value);
            }
          } else {
            if (options.protocol === 'UltraLight::HTTP') {
              should(ev.request.body.split('|')[1]).eql(value.toString());
            } else if (options.protocol === 'UltraLight::MQTT') {
              should(ev.request.payload.split('|')[1]).eql(value.toString());
            } else if (options.protocol === 'JSON::HTTP') {
              should(ev.request.body.attribute1).eql(value.toString());
            } else if (options.protocol === 'JSON::MQTT') {
              should(JSON.parse(ev.request.payload).attribute1).eql(value.toString());
            }
          }
        });
        simulationProgress.on('update-response', function() {
          ++updateResponses;
        });
        simulationProgress.on('end', function() {
          should(tokenResponses).equal(1);
          should(updateRequests).equal(1);
          should(updateResponses).equal(1);
          done();
        });
      });

      it('should load external data using the GET method', function(done) {
        if (type === 'entities') {
          var simulationConfiguration =
            require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
              // (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
              type + '-external-data-GET-once' +
              (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
              '.json');
          if (options.ngsiVersion) {
            if (simulationConfiguration.contextBroker) {
              simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
            } else if (simulationConfiguration.subscriber) {
              simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
            }
          }
          fiwareDeviceSimulator.start(simulationConfiguration);
          simulationProgress.on('error', function(ev) {
            done(ev.error);
          });
          simulationProgress.on('token-response', function(ev) {
            ++tokenResponses;
            should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
          });
          simulationProgress.on('update-request', function(ev) {
            if (ev.request.url === EXTERNAL_SOURCE_URL + '/data') {
              ++updateRequests;
            } else {
              if (type === 'entities') {
                if (options.ngsiVersion === '1.0') {
                  should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ATTRIBUTE_1)).
                    eql(SOME_TEXT);
                } else if (options.ngsiVersion === '2.0') {
                  should(ev.request.body.entities[0][ATTRIBUTE_1].value).eql(SOME_TEXT);
                }
              } else {
                if (options.protocol === 'UltraLight::HTTP') {
                  should(ev.request.body.split('|')[1]).eql(SOME_TEXT);
                } else if (options.protocol === 'UltraLight::MQTT') {
                  should(ev.request.payload.split('|')[1]).eql(SOME_TEXT);
                } else if (options.protocol === 'JSON::HTTP') {
                  should(ev.request.body.attribute1).eql(SOME_TEXT);
                } else if (options.protocol === 'JSON::MQTT') {
                  should(JSON.parse(ev.request.payload).attribute1).eql(SOME_TEXT);
                }
              }
            }
          });
          simulationProgress.on('update-response', function(ev) {
            if (ev.request.url !== EXTERNAL_SOURCE_URL + '/data') {
              ++updateResponses;
            }
          });
          simulationProgress.on('end', function() {
            should(tokenResponses).equal(1);
            should(updateRequests).equal(1);
            should(updateResponses).equal(1);
            done();
          });
        } else {
          done();
        }
      });

      it('should load external data using the POST method', function(done) {
        if (type === 'entities') {
          var simulationConfiguration =
            require(ROOT_PATH + '/test/unit/configurations/simulation-configuration-' +
              // (options.protocol ? encodeFilename(options.protocol) + '-' : '') +
              type + '-external-data-POST-once' +
              (options.destination && options.destination !== 'context broker' ? '-' + options.destination: '') +
              '.json');
          if (options.ngsiVersion) {
            if (simulationConfiguration.contextBroker) {
              simulationConfiguration.contextBroker.ngsiVersion = options.ngsiVersion;
            } else if (simulationConfiguration.subscriber) {
              simulationConfiguration.subscriber.ngsiVersion = options.ngsiVersion;
            }
          }
          fiwareDeviceSimulator.start(simulationConfiguration);
          simulationProgress.on('error', function(ev) {
            done(ev.error);
          });
          simulationProgress.on('token-response', function(ev) {
            ++tokenResponses;
            should(ev.expires_at.toISOString()).equal(tokenResponseBody.token.expires_at);
          });
          simulationProgress.on('update-request', function(ev) {
            if (ev.request.url === EXTERNAL_SOURCE_URL + '/data') {
              ++updateRequests;
            } else {
              if (type === 'entities') {
                if (options.ngsiVersion === '1.0') {
                  should(getAttributeValue(options.destination, ev.request.body, ENTITY_NAME_1, ATTRIBUTE_1)).
                    eql(SOME_TEXT);
                } else if (options.ngsiVersion === '2.0') {
                  should(ev.request.body.entities[0][ATTRIBUTE_1].value).eql(SOME_TEXT);
                }
              } else {
                if (options.protocol === 'UltraLight::HTTP') {
                  should(ev.request.body.split('|')[1]).eql(SOME_TEXT);
                } else if (options.protocol === 'UltraLight::MQTT') {
                  should(ev.request.payload.split('|')[1]).eql(SOME_TEXT);
                } else if (options.protocol === 'JSON::HTTP') {
                  should(ev.request.body.attribute1).eql(SOME_TEXT);
                } else if (options.protocol === 'JSON::MQTT') {
                  should(JSON.parse(ev.request.payload).attribute1).eql(SOME_TEXT);
                }
              }
            }
          });
          simulationProgress.on('update-response', function(ev) {
            if (ev.request.url !== EXTERNAL_SOURCE_URL + '/data') {
              ++updateResponses;
            }
          });
          simulationProgress.on('end', function() {
            should(tokenResponses).equal(1);
            should(updateRequests).equal(1);
            should(updateResponses).equal(1);
            done();
          });
        } else {
          done();
        }
      });

      afterEach(function() {
        tokenResponses = 0;
        updateRequests = 0;
        updateResponses = 0;
        nock.cleanAll();
        if (simulationProgress) {
          simulationProgress.removeAllListeners();
        }
        if (mqttClient) {
          mqttClient.removeAllListeners();
          mqttClient = null;
        }
        if (mqttConnectStub) {
          mqttConnectStub.restore();
          mqttConnectStub = null;
        }
      });
    }

    describe('Entities update in context broker via NGSI v1.0', simulationTestSuite.bind(
      null, 'entities', {destination: 'context broker', ngsiVersion: '1.0'}));

    describe('Entities update in context broker via NGSI v2.0', simulationTestSuite.bind(
      null, 'entities', {destination: 'context broker', ngsiVersion: '2.0'}));

    describe('Entities update in subscriber via NGSI v1.0', simulationTestSuite.bind(
      null, 'entities', {destination: 'subscriber', ngsiVersion: '1.0'}));

    describe('UltraLight HTTP devices', simulationTestSuite.bind(null, 'devices', {protocol: 'UltraLight::HTTP'}));

    describe('UltraLight MQTT devices', simulationTestSuite.bind(null, 'devices', {protocol: 'UltraLight::MQTT'}));

    describe('JSON HTTP devices', simulationTestSuite.bind(null, 'devices', {protocol: 'JSON::HTTP'}));

    describe('JSON MQTT devices', simulationTestSuite.bind(null, 'devices', {protocol: 'JSON::MQTT'}));
  });
  /* jshint camelcase: true */
});
