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
 * Checks if the provided interpolation object is a valid once
 * @param  {Object}  interpolationObject The interpolation object
 * @return {Boolean}                     True if the interpolation object is valid, false otherwise
 */
function isValidInterpolationObject(interpolationObject) {
  return ((interpolationObject.origin &&
    (interpolationObject.origin === 'now' || !isNaN(Date.parse(interpolationObject.origin)))) &&
    ((interpolationObject.increment !== undefined) && (typeof interpolationObject.increment === 'number')));
}

module.exports = function(interpolationObjectOrSpec) {
  var interpolationObject;

  /**
   * The date increment interpolator function
   * @return {Date} The interpolated new Date
   */
  function dateIncrementInterpolator() {
    var originDate;
    if (interpolationObject.origin === 'now') {
      originDate = new Date();
    } else {
      originDate = new Date(interpolationObject.origin);
    }
    return new Date(originDate.getTime() + (interpolationObject.increment * 1000)).toISOString();
  }

  if ((typeof interpolationObjectOrSpec === 'object')) {
    if (isValidInterpolationObject(interpolationObjectOrSpec)) {
      interpolationObject = interpolationObjectOrSpec;
    } else {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "origin" (as "now" or ' +
        'a valid date string) and "increment" (as an integer) properties)');
    }
  } else {
    interpolationObject = JSON.parse(interpolationObjectOrSpec);
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or spec (' +
        interpolationObjectOrSpec + ') is not valid (it should be an object including the "origin" (as "now" or ' +
        'a valid date string) and "increment" (as an integer) properties)');
    }
  }
  interpolationObject = interpolationObject || interpolationObjectOrSpec;
  return dateIncrementInterpolator;
};
