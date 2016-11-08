/*
 * Copyright 2016 Telefónica Investigación y Desarrollo, S.A.U
 *
 * This file is part of the Short Time Historic (STH) component
 *
 * STH is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * STH is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with STH.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with: [german.torodelvalle@telefonica.com]
 */

'use strict';

var ROOT_PATH = require('app-root-path');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

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
  return (interpolationArray.length > 0) && interpolationArray.every(interpolatorArrayValidator);
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

module.exports = function(interpolationArrayOrSpec) {
  var interpolationArray;

  /**
   * Step-after interpolation function
   * @param  {Number} input The input to return its associated interporlated value
   * @return {Number}       The interpolated value associated to the provided input
   */
  function stepAfterInterpolator(input) {
    if (input >= interpolationArray[interpolationArray.length - 1][0]) {
      return interpolationArray[interpolationArray.length - 1][1];
    } else if (input <= interpolationArray[0][0]) {
      return interpolationArray[0][1];
    } else {
      for (var ii = 0; ii < interpolationArray.length - 1; ii++) {
        if (interpolationArray[ii][0] <= input && interpolationArray[ii + 1][0] > input) {
          return interpolationArray[ii][1];
        }
      }
    }
  }

  if (Array.isArray(interpolationArrayOrSpec) && isValidInterpolationArray(interpolationArrayOrSpec)) {
    interpolationArray = interpolationArrayOrSpec;
  } else if (typeof interpolationArrayOrSpec === 'string') {
    try {
      interpolationArray = JSON.parse(interpolationArrayOrSpec);
    } catch(exception) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
        interpolationArrayOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
    }
    if (!isValidInterpolationArray(interpolationArray)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
        interpolationArrayOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
    }
  } else {
    throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation array or specification (' +
      interpolationArrayOrSpec + ') is not valid (it should be an array of arrays of 2 number elements)');
  }
  interpolationArray.sort(sortInterpolationArray);
  return stepAfterInterpolator;
};
