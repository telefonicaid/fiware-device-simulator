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
var deasync = require('deasync');
var _eval = require('eval');
var request = require('request');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

var domainConf, contextBrokerConf;

var VARIABLE_RE = /\${{[^{}]+}{[^{}]+}}/g;
var ENTITY_ATTRIBUTE_RE = /{[^{}]+}/g;
var STATE_RE = /\/\*\s*[^:]+:\s*(.*)\s*\*\//;

/**
 * Returns the entity-attribute map for the passed spec
 * @param  {string} spec The spec
 * @return {Object}      The entity-attribute map
 */
function getEntityAttributeMap(spec) {
  var entityAttributeMap = {};
  var variableMatches = spec.match(VARIABLE_RE);
  if (!variableMatches) {
    return entityAttributeMap;
  }
  spec.match(VARIABLE_RE).forEach(function(specMatch) {
    var entityName, attributeName;
    var entry = specMatch.match(ENTITY_ATTRIBUTE_RE);
    entityName = entry[0].substring(1, entry[0].length - 1);
    attributeName = entry[1].substring(1, entry[1].length - 1);
    entityAttributeMap[entityName] = entityAttributeMap[entityName] || [];
    if (entityAttributeMap[entityName].indexOf(attributeName) === - 1) {
      entityAttributeMap[entityName].push(attributeName);
    }
  });
  return entityAttributeMap;
}

/**
 * Sends a HTTP request
 * @param  {String}   token          The authorization token
 * @param  {Object}   requestOptions The request options
 * @param  {Function} callback       The callback
 */
function sendRequest(token, requestOptions, callback) {
  requestOptions.headers['X-Auth-Token'] = token;
  request(requestOptions, callback);
}

/**
 * Returns the entity name from an entity name and possible type pair
 * @param  {String} entity The entity name and possible type pair
 * @return {String}        The entity name
 */
function getEntityName(entity) {
  var entityName;
  if (entity.indexOf(':#:') === -1) {
    entityName = entity;
  } else {
    entityName = entity.substring(0, entity.indexOf(':#:'));
  }
  return entityName;
}

/**
 * Returns the entity type (if any) from an entity name and possible type pair
 * @param  {String} entity The entity name and possible type pair
 * @return {String}        The entity type or undefined if no type
 */
function getEntityType(entity) {
  var entityType;
  if (entity.indexOf(':#:') !== -1) {
    entityType = entity.substring(entity.indexOf(':#:') + 3);
  }
  return entityType;
}

/**
 * Returns the request options from a entity-attribute map
 * @param  {Object} domainConf         The domain configuration
 * @param  {Object} contextBrokerConf  The Context Broker configuration
 * @param  {Object} entityAttributeMap The entity-attribute map
 * @return {Array}                     The request options array
 */
function getRequestOptions(domainConf, contextBrokerConf, entityAttributeMap) {
  var body,
      requestOptions = [],
      entityName,
      entityType;

  var entities = Object.getOwnPropertyNames(entityAttributeMap);

  entities.forEach(function(entity) {
    entityName = getEntityName(entity);
    entityType = getEntityType(entity);
    body = {
      entities: [
        {
          id: entityName,
          isPattern: 'false'
        }
      ]
    };
    if (entityType) {
      body.entities[0].type = entityType;
    }
    entityAttributeMap[entity].forEach(function(attribute) {
      body.attributes = body.attributes || [];
      body.attributes.push(attribute);
    });

    requestOptions.push(
      {
        method: 'POST',
        url: contextBrokerConf.protocol + '://' + contextBrokerConf.host + ':' + contextBrokerConf.port +
          '/v1/queryContext',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Fiware-Service': domainConf.service,
          'Fiware-ServicePath': domainConf.subservice
        },
        json: true,
        body: body
      }
    );
  });
  return requestOptions;
}

/**
 * Returns the attribute value from the received responses
 * @param  {Array}  responses The array of responses
 * @param  {String} entity    The entity name and optional type
 * @param  {String} attribute The attribute name
 * @return {Object}           The attribute value
 */
function getAttributeValue(responses, entity, attribute) {
  var entityName = getEntityName(entity);
  var entityType = getEntityType(entity);

  for (var ii = 0; ii < responses.length; ii++) {
    if (responses[ii].body.contextResponses[0].contextElement.id === entityName &&
      (entityType ? responses[ii].body.contextResponses[0].contextElement.type === entityType : true)) {
      for (var jj = 0; jj < responses[ii].body.contextResponses[0].contextElement.attributes.length; jj++) {
        if (responses[ii].body.contextResponses[0].contextElement.attributes[jj].name === attribute) {
          return responses[ii].body.contextResponses[0].contextElement.attributes[jj].value;
        }
      }
    }
  }
}

/**
 * Checks if there has been an error when getting the attibute values
 * @param  {Array}   responseArray Array of responsees obtained from the Context Broker
 * @return {Boolean}               True if there has been any error, false otherwise
 */
function checkError(responseArray) {
  for (var ii = 0; ii < responseArray.length; ii++) {
    if (parseInt(responseArray[ii].statusCode, 10) !== 200 ||
      (responseArray[ii].body.errorCode && parseInt(responseArray[ii].body.errorCode.code, 10) !== 200)) {
        return true;
    }
  }
  return false;
}

/**
 * Composes the state map from the state specification included in the interpolator specification
 * @param  {String} spec The interpolator specification
 * @return {Object}      The generated state map
 */
function generateStateMap(spec) {
  var stateMap = {},
      stateRegExpResult = STATE_RE.exec(spec),
      stateVariables,
      stateVariablesArray;
  if (stateRegExpResult && stateRegExpResult.length >= 1) {
    stateVariables = stateRegExpResult[1];
    if (stateVariables) {
      stateVariablesArray = stateVariables.split(',');
      stateVariablesArray.forEach(function(variable) {
        if (variable.indexOf('=') !== -1) {
          stateMap[variable.trim().substring(0, variable.trim().indexOf('=')).trim()] =
            JSON.parse(variable.trim().substring(variable.trim().indexOf('=') + 1));
        } else {
          stateMap[variable.trim()] = null;
        }
      });
    }
  }
  return stateMap;
}
module.exports = function(interpolationSpec, theDomainConf, theContextBrokerConf){
  var entityAttributeMap,
      requestOptions,
      stateMap;

  domainConf = theDomainConf;
  contextBrokerConf = theContextBrokerConf;

  /**
   * Returns the variable map to be passed to the Javascript code to evaluated
   * @return {Object} The variable map
   */
  function getVariableMap() {
    var variableMap = {}, globalNames, stateMapNames;
    globalNames = Object.getOwnPropertyNames(global.fdsGlobals);
    globalNames.forEach(function(globalName) {
      variableMap[globalName] = global.fdsGlobals[globalName];
    });
    stateMapNames = Object.getOwnPropertyNames(stateMap);
    stateMapNames.forEach(function(stateMapEntry) {
      variableMap[stateMapEntry] = stateMap[stateMapEntry];
    });
    return variableMap;
  }

  /**
   * Process the evaluated value returned by the Javascript code
   * @param  {Object} evaluatedValue The evaluated value
   * @return {Object}                The post-processed evaluated value
   */
  function processEvaluatedValue(evaluatedValue) {
    var globalNames, stateMapNames;
    if (typeof evaluatedValue === 'object') {
      if (evaluatedValue.state && typeof evaluatedValue.state === 'object') {
        if (evaluatedValue.state.globals) {
          globalNames = Object.getOwnPropertyNames(evaluatedValue.state.globals);
          globalNames.forEach(function(globalName) {
            global.fdsGlobals[globalName] = evaluatedValue.state.globals[globalName];
          });
          delete evaluatedValue.state.globals;
        }
        stateMapNames = Object.getOwnPropertyNames(evaluatedValue.state);
        stateMapNames.forEach(function(stateMapEntry) {
          stateMap[stateMapEntry] = evaluatedValue.state[stateMapEntry];
        });
      }
      if (evaluatedValue.result || evaluatedValue.result === 0 || evaluatedValue.result === false) {
        evaluatedValue = evaluatedValue.result;
      }
    }
    return evaluatedValue;
  }
  /**
   * Returns the new interpolated value asynchronously
   * @return {Object} The new interpolated value
   */
  function attributeFunctionInterpolator(token, callback) {
    var evalStr = interpolationSpec,
        evalStrAux;

    async.map(requestOptions, sendRequest.bind(null, token), function(err, responseArray) {
      if (err || checkError(responseArray)) {
        return callback(
          new fdsErrors.ValueResolutionError('Error when getting some attribute value from the Context Broker ' +
            'for an attribute-function-interpolator resolution with spec: \'' + interpolationSpec + '\''));
      }
      var entities = Object.getOwnPropertyNames(entityAttributeMap);
      entities.forEach(function(entity) {
        entityAttributeMap[entity].forEach(function(attribute) {
          // String.replace() global replace can only be done with a regular expression so we loop until no more changes
          evalStrAux = null;
          while (evalStrAux !== evalStr) {
            evalStrAux = evalStr;
            evalStr = evalStr.replace(new RegExp('${{' + entity + '}{' + attribute + '}}', 'g').source,
              getAttributeValue(responseArray, entity, attribute));
          }
        });
      });

      var evaluatedValue;
      try {
        if (evalStr.indexOf('module.exports') !== -1) {
          global.SimulationDate = Date;
          global.fdsGlobals = global.fdsGlobals || {};
          var variableMap = getVariableMap();
          evaluatedValue = _eval(evalStr, variableMap, true);
          evaluatedValue = processEvaluatedValue(evaluatedValue);
        } else {
          /* jshint evil: true */
          evaluatedValue = eval(evalStr);
          /* jshint evil: false */
        }
      } catch (exception) {
        return callback(
          new fdsErrors.ValueResolutionError('Error when evaluating the Javascript code ' +
            'for an attribute-function-interpolator resolution with spec: \'' + interpolationSpec + '\''));
      }
      callback(null, evaluatedValue);
    });
  }

  if (typeof interpolationSpec !== 'string') {
    try {
      interpolationSpec = JSON.stringify(interpolationSpec);
    } catch (exception) {
      throw new fdsErrors.ValueResolutionError('Error when evaluating the Javascript code ' +
        'for an attribute-function-interpolator resolution with spec: \'' + interpolationSpec + '\'');
    }
  }
  entityAttributeMap = getEntityAttributeMap(interpolationSpec);
  stateMap = generateStateMap(interpolationSpec);
  requestOptions = getRequestOptions(domainConf, contextBrokerConf, entityAttributeMap);
  return deasync(attributeFunctionInterpolator);
};
