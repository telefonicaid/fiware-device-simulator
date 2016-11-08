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
var dateIncrementInterpolator = require(ROOT_PATH + '/lib/interpolators/dateIncrementInterpolator');

describe('dateIncrementInterpolator tests', function() {
  var dateIncrementInterpolatorFunction;

  it('should throw an error if a number is passed instead of a valid specification', function(done) {
    try {
      dateIncrementInterpolatorFunction = dateIncrementInterpolator(666);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if a number as a string is passed instead of a valid specification', function(done) {
    try {
      dateIncrementInterpolatorFunction = dateIncrementInterpolator('666');
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an Array is passed instead of a valid specification', function(done) {
    try {
      dateIncrementInterpolatorFunction = dateIncrementInterpolator([1,2,3]);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an Array is passed as a string instead of a valid specification', function(done) {
    try {
      dateIncrementInterpolatorFunction = dateIncrementInterpolator('[1,2,3]');
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an object with no origin property is passed instead of a valid specification',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator({increment: 0});
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no increment property is passed instead of a valid specification',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator({origin: 'now'});
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with an invalid origin property is passed instead of a valid specification',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator(
          {origin: 'not-convertible-to-date-or-now', increment: 0});
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no origin property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator('{"increment": 0}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no increment property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator('{"origin": "now"}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with an invalid origin property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator(
          '{"origin": "not-convertible-to-date-or-now", "increment": 0}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should interpolate for now without increment if valid interpolation specification is passed as an object',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator({origin: 'now', increment: 0});
        should(new Date(dateIncrementInterpolatorFunction()).getTime()).lessThanOrEqual(new Date(Date.now() + 2000));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for a date without increment if valid interpolation specification is passed as an object',
    function(done) {
      try {
        dateIncrementInterpolatorFunction = dateIncrementInterpolator({origin: '2016-10-20T13:00:00Z', increment: 0});
        should(new Date(dateIncrementInterpolatorFunction()).getTime()).lessThanOrEqual(
          new Date('2016-10-20T13:00:00Z').getTime() + 2000);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for a date with increment if valid interpolation specification is passed as an object',
    function(done) {
      try {
        dateIncrementInterpolatorFunction =
          dateIncrementInterpolator({origin: '2016-10-20T13:00:00Z', increment: 60});
        should(new Date(dateIncrementInterpolatorFunction()).getTime()).lessThanOrEqual(
          new Date('2016-10-20T13:01:00Z').getTime() + 2000);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );
});
