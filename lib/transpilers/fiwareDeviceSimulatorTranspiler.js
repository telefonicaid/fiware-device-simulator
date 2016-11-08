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

var ROOT_PATH = require('app-root-path');
var path = require('path');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

/**
 * The original simulation configuration file
 */
var originalConfigurationObj;

/**
 * Error, if any, during the composition
 */
var error;

/**
 * Entity condition flag
 * @type {Number}
 */
var ENTITY_CONDITION = 1;

/**
 * Attribute condition flag
 * @type {Number}
 */
var ATTRIBUTE_CONDITION = 2;

/**
 * Attribute condition regular expresion
 * @type {RegExp}
 */
var attributeConditionRegExp = /\$\{\{.+\}\{.+\}\}/g;

/**
 * Entity condition regular expression
 * @type {RegExp}
 */
var entityConditionRegExp = /\$\{\{[^\}]+\}\}/g;

/**
 * Map of matches and associated count
 * @type {Object}
 */
var matchCounterMap = {};

/**
 * Returns the type of a condition
 * @param  {String} condition The condition
 * @return {Number}           The condition type
 */
function getConditionType(condition) {
  if (new RegExp(entityConditionRegExp).test(condition)) {
    return ENTITY_CONDITION;
  } else if (new RegExp(attributeConditionRegExp).test(condition)) {
    return ATTRIBUTE_CONDITION;
  }
}

/**
 * Returns true if the match satisfies the condition
 * @param  {String} match     The match
 * @param  {String} condition The condition
 * @return {Boolean}          True if the match satisfies the condition, false otherwise
 */
function matchesCondition(match, condition) {
  /* jshint maxdepth: 9 */
  var currentEntity,
      currentAttribute,
      entityProperties,
      attributeProperties,
      entityProperty,
      entityRegExp,
      entityValue,
      attributeProperty,
      attributeRegExp,
      attributeValue;
  var matchCounter = 0;
  var matchWithoutQuotes = match.substring(1, match.length - 1);
  var conditionType = getConditionType(condition);
  for (var ii = 0; ii < originalConfigurationObj.entities.length; ii++) {
    currentEntity = originalConfigurationObj.entities[ii];
    entityProperties = Object.getOwnPropertyNames(originalConfigurationObj.entities[ii]);
    for (var jj = 0; jj < entityProperties.length; jj++) {
      if (originalConfigurationObj.entities[ii][entityProperties[jj]] === matchWithoutQuotes) {
        matchCounter += 1;
        if (matchCounter >= matchCounterMap[match]) {
          if (conditionType === ENTITY_CONDITION) {
            entityProperty = condition.substring(3, condition.indexOf('=='));
            entityRegExp = condition.substring(condition.indexOf('==') + 2, condition.length - 2);
            entityValue = originalConfigurationObj.entities[ii][entityProperty];
            if (new RegExp(entityRegExp).test(entityValue)) {
              return true;
            }
            return false;
          }
          return false;
        }
      }
      if (Array.isArray(originalConfigurationObj.entities[ii][entityProperties[jj]])) {
        for (var kk = 0; kk < originalConfigurationObj.entities[ii][entityProperties[jj]].length; kk++) {
          currentAttribute = originalConfigurationObj.entities[ii][entityProperties[jj]][kk];
          attributeProperties =
            Object.getOwnPropertyNames(originalConfigurationObj.entities[ii][entityProperties[jj]][kk]);
          for (var ll = 0; ll < attributeProperties.length; ll++) {
            if (originalConfigurationObj.entities[ii][entityProperties[jj]][kk][attributeProperties[ll]] ===
              matchWithoutQuotes) {
              matchCounter += 1;
              if (matchCounter >= matchCounterMap[match]) {
                if (conditionType === ENTITY_CONDITION) {
                  entityProperty = condition.substring(3, condition.indexOf('=='));
                  entityRegExp = condition.substring(condition.indexOf('==') + 2, condition.length - 2);
                  entityValue = originalConfigurationObj.entities[ii][entityProperty];
                  if (new RegExp(entityRegExp).test(entityValue)) {
                    return true;
                  }
                  return false;
                } else if (conditionType === ATTRIBUTE_CONDITION) {
                  entityProperty = condition.substring(3, condition.indexOf('=='));
                  entityRegExp = condition.substring(condition.indexOf('==') + 2, condition.indexOf('}{'));
                  entityValue = originalConfigurationObj.entities[ii][entityProperty];
                  attributeProperty = condition.substring(condition.indexOf('}{') + 2, condition.lastIndexOf('=='));
                  attributeRegExp = condition.substring(condition.lastIndexOf('==') + 2, condition.length - 2);
                  attributeValue = originalConfigurationObj.entities[ii][entityProperties[jj]][kk][attributeProperty];
                  if (new RegExp(entityRegExp).test(entityValue) && new RegExp(attributeRegExp).test(attributeValue)) {
                    return true;
                  }
                  return false;
                }
                return false;
              }
            }
          }
        }
      }
    }
  }
  /* jshint maxdepth: 5 */
}

/**
 * Returns true if the passed template value is a valid array of objects including the content and condition properties
 * @param  {Object}  templateValue The template value
 * @return {Boolean}               True if the passed template value is a valid array of objects including the content
 *                                 and condition properties, false otherwise
 */
function isTemplateValueArray(templateValue) {
  if (Array.isArray(templateValue)) {
    for (var ii = 0; ii < templateValue.length; ii++) {
      if (typeof templateValue[ii] !== 'object' || Object.getOwnPropertyNames(templateValue[ii]).length !== 2 ||
        !templateValue[ii].content || !templateValue[ii].condition) {
        return false;
      }
    }
  } else {
    return false;
  }
  return true;
}

/**
 * Replaces an import() match by its corresponding value
 * @param  {String} match The matching String
 * @return {String}       The replacing String
 */
function replacer(match) {
  var templateValue;
  var templateTag = match.substring(8, match.length - 2);
  matchCounterMap[match] = (matchCounterMap[match] ? matchCounterMap[match] + 1 : 1);
  if (originalConfigurationObj.exports && originalConfigurationObj.exports[templateTag]) {
    templateValue = originalConfigurationObj.exports[templateTag];
  } else {
    try {
      templateValue = require(ROOT_PATH + path.sep + templateTag);
    } catch(exception) {
      error = exception;
    }
  }
  if (isTemplateValueArray(templateValue)) {
    for (var ii = 0; ii < templateValue.length; ii++) {
      if (matchesCondition(match, templateValue[ii].condition)) {
        return JSON.stringify(templateValue[ii].content);
      }
    }
    return match;
  } else {
    return JSON.stringify(templateValue);
  }
}

/**
 * Asynchronously returns a new simulation configuration file after importing the corresponding templates
 * @param  {Object}   configuration The original configuration
 * @param  {Function} callback      The callback
 */
function transpile(configuration, callback) {
  var configurationStr,
      newConfigurationStr,
      newConfigurationObj;
  error = null;
  matchCounterMap = {};
  originalConfigurationObj = configuration;
  configurationStr = JSON.stringify(configuration);
  newConfigurationStr = configurationStr.replace(/"import\([^\)]+\)"/g, replacer);
  if (error) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The configuration information provided is not ' +
      'valid (some error ocurred when importing the templates: ' + error + ')'));
  }
  try {
    newConfigurationObj = JSON.parse(newConfigurationStr);
  } catch (exception) {
    return callback(new fdsErrors.SimulationConfigurationNotValid('The configuration information provided is not ' +
      'valid (some error ocurred when importing the templates: ' + exception + ')'));
  }
  delete newConfigurationObj.exports;
  return callback(null, newConfigurationObj);
}

module.exports = {
  transpile: transpile
};
