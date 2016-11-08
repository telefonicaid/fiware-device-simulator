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

var should = require('should');

var ROOT_PATH = require('app-root-path');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var stepBeforeInterpolator = require(ROOT_PATH + '/lib/interpolators/stepBeforeInterpolator');

describe('stepBeforeInterpolator tests', function() {
  var stepBeforeInterpolatorFunction;

  it('should throw an error if a number is passed instead of a valid specification', function(done) {
    try {
      stepBeforeInterpolatorFunction = stepBeforeInterpolator(666);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if a number as a string is passed instead of a valid specification', function(done) {
    try {
      stepBeforeInterpolatorFunction = stepBeforeInterpolator('666');
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if a one level Array is passed instead of a valid specification', function(done) {
    try {
      stepBeforeInterpolatorFunction = stepBeforeInterpolator([1,2,3]);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if a one level Array is passed as a string instead of a valid specification',
    function(done) {
      try {
        stepBeforeInterpolatorFunction = stepBeforeInterpolator('[1,2,3]');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an invalid two level Array is passed instead of a valid specification',
    function(done) {
      try {
        stepBeforeInterpolatorFunction = stepBeforeInterpolator([[1], [2], [3]]);
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an invalid two level Array is passed as a string instead of a valid specification',
    function(done) {
      try {
        stepBeforeInterpolatorFunction = stepBeforeInterpolator('[[1],[2],[3]]');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should interpolate if valid interpolation specification is passed as an array',
    function(done) {
      try {
        stepBeforeInterpolatorFunction = stepBeforeInterpolator([[1,1],[5,5],[10,10]]);
        should(stepBeforeInterpolatorFunction(1)).equal(1);
        should(stepBeforeInterpolatorFunction(2.5)).equal(5);
        should(stepBeforeInterpolatorFunction(5)).equal(5);
        should(stepBeforeInterpolatorFunction(7.5)).equal(10);
        should(stepBeforeInterpolatorFunction(10)).equal(10);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );
});
