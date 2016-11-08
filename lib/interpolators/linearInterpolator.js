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
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var linearInterpolator = require('linear-interpolator');

/**
 * Validates the entries of an interpolation array
 * @param  {Array}   entry The entry to Validates
 * @return {Boolean}       True if the entry is valid, false otherwise
 */
function interpolatorArrayValidator(entry) {
  return Array.isArray(entry) && (entry.length === 2) &&
    (typeof entry[0] === 'number') && (typeof entry[1] === 'number');
}

/**
 * Checks if the provided interpolation array is a valid once
 * @param  {Array}   interpolationArray The interpolation array
 * @return {Boolean}                    True if the interpolation array is valid, false otherwise
 */
function isValidInterpolationArray(interpolationArray) {
  var interpolationArrayObject = interpolationArray;
  if (typeof interpolationArray === 'string' &&
    interpolationArray.charAt(0) === '[' && interpolationArray.charAt(interpolationArray.length -1) === ']') {
      try {
        interpolationArrayObject = JSON.parse(interpolationArray);
      } catch(exception) {
        return false;
      }
    }
  return Array.isArray(interpolationArrayObject) && interpolationArrayObject.every(interpolatorArrayValidator);
}

/**
 * Sorts the interpolation array according to the entries on the X-axis
 * @param  {Array}  entryA First entry to compare
 * @param  {Array}  entryB Second entry to compare
 * @return {Number}        Negative number if entryA should go before entryB, possitive number if entryA should go
 *                         after entryB and 0 if they should be left unchanged
 */
function sortInterpolationArray(entryA, entryB) {
  return entryA[0] - entryB[0];
}

/**
 * Checks if the provided interpolation object is a valid once
 * @param  {Object}  interpolationObject The interpolation object
 * @return {Boolean}                     True if the interpolation object is valid, false otherwise
 */
function isValidInterpolationObject(interpolationObject) {
  return (interpolationObject.spec && isValidInterpolationArray(interpolationObject.spec) &&
    interpolationObject.return && (interpolationObject.return.type === 'float' ||
      interpolationObject.return.type === 'integer') &&
    ((interpolationObject.return.type === 'integer') ?
      ['ceil', 'floor', 'round'].indexOf(interpolationObject.return.rounding) !== -1 :
      true));
}

module.exports = function(interpolationObjectOrSpec) {
  var interpolationObject, interpolationArray, originalLinearInterpolator;

  /**
   * Final linear interpolator
   * @param  {Number} input A float number between 0 and 24 corresponding to the decimal hours
   * @return {Number}       Float or integer number according to the specification
   */
  function finalLinearInterpolator(input) {
    var output = originalLinearInterpolator(input);
    if (interpolationObject.return.type === 'float') {
      return output;
    } else {
      // In this case: interpolationObject.return.type === 'integer'
      switch (interpolationObject.return.rounding) {
        case 'ceil':
          return Math.ceil(output);
        case 'floor':
          return Math.floor(output);
        case 'round':
          return Math.round(output);
      }
    }
  }

  if (Array.isArray(interpolationObjectOrSpec)) {
    if (isValidInterpolationArray(interpolationObjectOrSpec)) {
      interpolationArray = interpolationObjectOrSpec;
    } else {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
    }
  } else if (typeof interpolationObjectOrSpec === 'string' && interpolationObjectOrSpec.charAt(0) === '[' &&
    interpolationObjectOrSpec.charAt(interpolationObjectOrSpec.length - 1) === ']') {
      try {
        interpolationArray = JSON.parse(interpolationObjectOrSpec);
      } catch(exception) {
        throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
          interpolationObjectOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
      }
      if (!isValidInterpolationArray(interpolationArray)) {
        throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
          interpolationObjectOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
      }
  } else if (typeof interpolationObjectOrSpec === 'object') {
    if (isValidInterpolationObject(interpolationObjectOrSpec)) {
      interpolationObject = interpolationObjectOrSpec;
    } else {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "spec" and ' +
          '"return" properties, where the "return" property is an object including the "type" property and, ' +
          'in case "type" is equal to "integer" a "rounding" property)');
    }
  } else  {
    try {
      interpolationObject = JSON.parse(interpolationObjectOrSpec);
    } catch(exception) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
    }
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "spec" and ' +
          '"return" properties, where the "return" property is an object including the "type" property and, ' +
          'in case "type" is equal to "integer" a "rounding" property)');
    }
  }

  if (interpolationArray) {
    interpolationObject = {
      spec: interpolationArray,
      return: {
        type: 'float'
      }
    };
  }
  interpolationObject = interpolationObject || interpolationObjectOrSpec;
  if (typeof interpolationObject.spec === 'string') {
    try {
      interpolationObject.spec = JSON.parse(interpolationObject.spec);
    }
    catch(exception) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
    }
  }
  interpolationArray = interpolationObject.spec.sort(sortInterpolationArray);
  originalLinearInterpolator = linearInterpolator(interpolationArray);
  return finalLinearInterpolator;
};
