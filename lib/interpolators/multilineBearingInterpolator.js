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
var turfLineString = require('turf-linestring');
var turfLineDistance = require('@turf/line-distance');
var turfPoint = require('turf-point');
var turfBearing = require('@turf/bearing');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');

module.exports = function(interpolationObjectOrSpec){
  var interpolationObject,
      distanceUnits,
      line,
      lineDistance,
      lineSections = [],
      lineSectionDistances = [],
      isError = false;

  /**
   * Validates the coordinates property value
   * @param  {Array}   coordinates The coordinates array
   * @return {Boolean}             True if the coordinates array is valid, false otherwise
   */
  function isValidCoordinates(coordinates) {
    var lineSectionCoordinates,
        lineSection;
    if (!Array.isArray(coordinates)) {
      return false;
    }
    for (var ii = 0; ii < coordinates.length; ii++) {
      if (!Array.isArray(coordinates[ii]) || (coordinates[ii].length !== 2) ||
        (typeof coordinates[ii][0] !== 'number') || (typeof coordinates[ii][1] !== 'number')) {
        return false;
      }
      if (ii === coordinates.length - 1) {
        break;
      }
      lineSectionCoordinates = [];
      lineSectionCoordinates.push(coordinates[ii], coordinates[ii + 1]);
      lineSection = turfLineString(lineSectionCoordinates);
      lineSections.push(lineSection);
      lineSectionDistances.push(turfLineDistance(lineSection));
    }
    line = turfLineString(coordinates);
    lineDistance = turfLineDistance(line, distanceUnits);
    return true;
  }

  /**
   * Validates the interpolation object
   * @param  {Object}  interpolationObject The interpolation object to validate
   * @return {Boolean}                     True if the interpolation object is valid, false otherwise
   */
  function isValidInterpolationObject(interpolationObject) {
    if (!interpolationObject.coordinates || !isValidCoordinates(interpolationObject.coordinates)) {
      return false;
    }
    if (!interpolationObject.speed || (typeof interpolationObject.speed !== 'object') ||
      (typeof interpolationObject.speed.value !== 'number') ||
      ((interpolationObject.speed.units !== 'km/h') && (interpolationObject.speed.units !== 'mi/h'))) {
      return false;
    }
    distanceUnits = (interpolationObject.speed.units === 'km/h' ? 'kilometers' : 'miles');
    if (!interpolationObject.time || (typeof interpolationObject.time.from !== 'number') ||
      (typeof interpolationObject.time.to !== 'number')) {
      return false;
    }
    return true;
  }

  /**
   * Returns the new interpolated bearing for the passed decimal hours
   * @param  {Number} decimalHours The decimal hours
   * @return {Object}              The new interpolated bearing
   */
  function multilineBearingInterpolator(decimalHours) {
    var traveledDistance,
        accumulatedDistance = 0;
    if (decimalHours < interpolationObject.time.from) {
      traveledDistance = 0;
      } else if (decimalHours > interpolationObject.time.to) {
      traveledDistance = interpolationObject.speed.value *
        (interpolationObject.time.to - interpolationObject.time.from);
    }
    traveledDistance =
      traveledDistance || interpolationObject.speed.value * (decimalHours - interpolationObject.time.from);
    traveledDistance = traveledDistance % lineDistance;
    for (var ii = 0; ii < lineSectionDistances.length; ii++) {
      accumulatedDistance += lineSectionDistances[ii];
      if (accumulatedDistance >= traveledDistance) {
        return turfBearing(
          turfPoint(lineSections[ii].geometry.coordinates[0]),
          turfPoint(lineSections[ii].geometry.coordinates[1]));
      }
    }
  }

  if (typeof interpolationObjectOrSpec === 'object') {
    interpolationObject = interpolationObjectOrSpec;
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should include the following properties: "coordinates" ' +
        '(array of points (array of 2 floats or integers), "speed" (an object with a "value" (number) property and a ' +
        '"units" ("km/h" or "mi/h") property), a "time" (an object with a "from" (decimal hours) and "to" ' +
        '(decimal hours) properties) and an optional "return" (with possible values "geo:json" or "geo:point"))');
    }
  } else {
    try {
      interpolationObject = JSON.parse(interpolationObjectOrSpec);
    } catch(exception) {
      isError = true;
    }
    if (isError || !isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should include the following properties: "coordinates" ' +
        '(array of points (array of 2 floats or integers), "speed" (an object with a "value" (number) property and a ' +
        '"units" ("km/h" or "mi/h") property), a "time" (an object with a "from" (decimal hours) and "to" ' +
        '(decimal hours) properties) and an optional "return" (with possible values "geo:json" or "geo:point"))');
    }
  }
  return multilineBearingInterpolator;
};
