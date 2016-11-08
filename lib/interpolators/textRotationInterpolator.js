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
 * Checkes if the text probability array is valid
 * @param  {Array}   textProbabilityArray The text probability array
 * @return {Boolean}                      True if the text probability array is valid, false otherwise
 */
function isValidTextProbabilityArray(textProbabilityArray) {
  var accumulator = 0;
  if (!Array.isArray(textProbabilityArray)) {
    return false;
  }
  for (var ii = 0; ii < textProbabilityArray.length; ii++) {
    if (!Array.isArray(textProbabilityArray[ii]) || textProbabilityArray[ii].length !== 2 ||
      isNaN(textProbabilityArray[ii][0]) || (typeof textProbabilityArray[ii][1] !== 'string')) {
      return false;
    }
    accumulator += textProbabilityArray[ii][0];
  }
  if (accumulator !== 100) {
    return false;
  }
  return true;
}

/**
 * Validates the interpolation object
 * @param  {Object}  interpolationObject The interpolation object to validate
 * @return {Boolean}                     True if the interpolation object is valid, false otherwise
 */
function isValidInterpolationObject(interpolationObject) {
  if (!interpolationObject.units) {
    return false;
  } else if(['seconds', 'minutes', 'hours', 'days', 'dates', 'months', 'years'].indexOf(
    interpolationObject.units) === -1) {
      return false;
  } else if (!interpolationObject.text || !Array.isArray(interpolationObject.text)) {
    return false;
  }
  for (var ii = 0; ii < interpolationObject.text.length; ii++) {
    if (!Array.isArray(interpolationObject.text[ii]) || (interpolationObject.text[ii].length !== 2) ||
      isNaN(interpolationObject.text[ii][0]) ||
      ((typeof interpolationObject.text[ii][1] !== 'string') &&
        !isValidTextProbabilityArray(interpolationObject.text[ii][1]))) {
      return false;
    }
  }
  return true;
}

/**
 * Sorts the text array in ascending order
 * @param  {Array}  entryA Firt entry to compare
 * @param  {Array}  entryB Second entry to compare
 * @return {Number}        Negative number if entryA should go before entryB, possitive number if entryA should go
 *                         after entryB and 0 if they should be left unchanged
 */
function sortTextArray(entryA, entryB) {
  return entryA[0] - entryB[0];
}

module.exports = function(interpolationObjectOrSpec){
  var interpolationObject;

  /**
   * Returns the interpolated text from an text probabilities array
   * @param  {Array}  textProbabilities The text probabilities array
   * @return {String}                   The interpolated text
   */
  function getProbabilisticText(textProbabilities) {
    var accumulated = textProbabilities[0][0];
    var randomNumber = Math.random() * 100;
    if (randomNumber <= accumulated) {
      return textProbabilities[0][1];
    }
    for (var ii = 0; ii < textProbabilities.length - 1; ii++) {
      if (randomNumber > accumulated &&
        randomNumber <= (accumulated + textProbabilities[ii + 1][0])) {
        return textProbabilities[ii + 1][1];
      }
      accumulated += textProbabilities[ii + 1][0];
    }
    return textProbabilities[textProbabilities.length - 1][1];
  }

  /**
   * Returns the interpolated value for certain entry in the selected units
   * @param  {Number} entry The entry to interpolated
   * @return {String}       The interpolated text
   */
  function getInterpolatedText(entry) {
    if (entry < interpolationObject.text[0][0]) {
      return null;
    }
    for (var ii = 0; ii < interpolationObject.text.length - 1; ii++) {
      if (entry >= interpolationObject.text[ii][0] && entry < interpolationObject.text[ii + 1][0]) {
        if (typeof interpolationObject.text[ii][1] === 'string') {
          return interpolationObject.text[ii][1];
        } else {
          return getProbabilisticText(interpolationObject.text[ii][1]);
        }
      }
    }
    if (typeof interpolationObject.text[interpolationObject.text.length - 1][1] === 'string') {
      return interpolationObject.text[interpolationObject.text.length - 1][1];
    } else {
      return getProbabilisticText(interpolationObject.text[interpolationObject.text.length - 1][1]);
    }
  }

  /**
   * Returns the new interpolated position for the passed decimal hours
   * @param  {Number} decimalHours The decimal hours
   * @return {String}              The new interpolated text
   */
  function textRotationInterpolator(date) {
    switch (interpolationObject.units) {
      case 'seconds':
        return getInterpolatedText(date.getUTCSeconds());
      case 'minutes':
        return getInterpolatedText(date.getUTCMinutes());
      case 'hours':
        return getInterpolatedText(date.getUTCHours());
      case 'days':
        return getInterpolatedText(date.getUTCDay());
      case 'dates':
        return getInterpolatedText(date.getUTCDate());
      case 'months':
        return getInterpolatedText(date.getUTCMonth());
      case 'years':
        return getInterpolatedText(date.getUTCFullYear());
    }
  }

  if (typeof interpolationObjectOrSpec === 'object') {
    interpolationObject = interpolationObjectOrSpec;
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should include the following properties: "units" ' +
        '(string including the following accepted values: "seconds", "minutes", "hours", "days", "dates", "months" ' +
        'and "years"), "text" (an array of 2 elements arrays including a number as the first element and a string ' +
        'or a probability text array of 2 elements arrays including a number as the first element and some string as ' +
        'the second one (the addition of the first elements should be 100))');
    }
  } else {
    try {
      interpolationObject = JSON.parse(interpolationObjectOrSpec);
    } catch(exception) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should include the following properties: "units" ' +
        '(string including the following accepted values: "seconds", "minutes", "hours", "days", "dates", "months" ' +
        'and "years"), "text" (an array of 2 elements arrays including a number as the first element and a string ' +
        'or a probability text array of 2 elements arrays including a number as the first element and some string as ' +
        'the second one (the addition of the first elements should be 100))');
    }
    if (!isValidInterpolationObject(interpolationObject)) {
      throw new fdsErrors.InvalidInterpolationSpec('The provided interpolation object or specification (' +
        interpolationObjectOrSpec + ') is not valid (it should include the following properties: "units" ' +
        '(string including the following accepted values: "seconds", "minutes", "hours", "days", "dates", "months" ' +
        'and "years"), "text" (an array of 2 elements arrays including a number as the first element and a string ' +
        'or a probability text array of 2 elements arrays including a number as the first element and some string as ' +
        'the second one (the addition of the first elements should be 100))');
    }
  }
  interpolationObject.text.sort(sortTextArray);
  return textRotationInterpolator;
};
