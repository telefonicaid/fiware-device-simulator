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

var should = require('should');

var ROOT_PATH = require('app-root-path');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var textRotationInterpolator = require(ROOT_PATH + '/lib/interpolators/textRotationInterpolator');

describe('textRotationInterpolator tests', function() {
  var textRotationInterpolatorFunction;

  it('should throw an error if a number is passed instead of a valid specification', function(done) {
    try {
      textRotationInterpolatorFunction = textRotationInterpolator(666);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if a number as a string is passed instead of a valid specification', function(done) {
    try {
      textRotationInterpolatorFunction = textRotationInterpolator('666');
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an Array is passed instead of a valid specification', function(done) {
    try {
      textRotationInterpolatorFunction = textRotationInterpolator([1,2,3]);
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an Array is passed as a string instead of a valid specification', function(done) {
    try {
      textRotationInterpolatorFunction = textRotationInterpolator('[1,2,3]');
      done(new Error('It should throw an InvalidInterpolationSpec error'));
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should throw an error if an object with no units property is passed instead of a valid specification',
    function(done) {
      try {
        textRotationInterpolatorFunction =
          textRotationInterpolator(
            {text: [[0,'PENDING'],[15,'REQUESTED'],[30,[[50,'COMPLETED'],[50,'ERROR']]],[45,'REMOVED']]});
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no text property is passed instead of a valid specification',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator({units: 'minutes'});
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with an invalid units property is passed instead of a valid specification',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'not-valid-units',
            text: [[0,'PENDING'],[15,'REQUESTED'],[30,[[50,'COMPLETED'],[50,'ERROR']]],[45,'REMOVED']]
          }
        );
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no units property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction =
          textRotationInterpolator(
            '{"text": [[0,"PENDING"],[15,"REQUESTED"],[30,[[50,"COMPLETED"],[50,"ERROR"]]],[45,"REMOVED"]]}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with no text property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator('{"units": "minutes"}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should throw an error if an object with an invalid units property is passed instead of a valid specification ' +
     'as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "not-valid-units",' +
          '"text": [[0,"PENDING"],[15,"REQUESTED"],[30,[[50,"COMPLETED"],[50,"ERROR"]]],[45,"REMOVED"]]}');
        done(new Error('It should throw an InvalidInterpolationSpec error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
        done();
      }
    }
  );

  it('should interpolate for seconds as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'seconds',
            text: [[5,'PENDING'],[15,'REQUESTED'],[30,[[50,'COMPLETED'],[50,'ERROR']]],[45,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:05Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:10Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:15Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:20Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:30Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:35Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:45Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:55Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for seconds as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "seconds",' +
          '"text": [[5,"PENDING"],[15,"REQUESTED"],[30,[[50,"COMPLETED"],[50,"ERROR"]]],[45,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:05Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:10Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:15Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:20Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:30Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:35Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:45Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:55Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for minutes as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'minutes',
            text: [[5,'PENDING'],[15,'REQUESTED'],[30,[[50,'COMPLETED'],[50,'ERROR']]],[45,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:05:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for minutes as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "minutes",' +
          '"text": [[5,"PENDING"],[15,"REQUESTED"],[30,[[50,"COMPLETED"],[50,"ERROR"]]],[45,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:05:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T16:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for hours as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'hours',
            text: [[5,'PENDING'],[15,'REQUESTED'],[18,[[50,'COMPLETED'],[50,'ERROR']]],[22,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T05:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for hours as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "hours",' +
          '"text": [[5,"PENDING"],[15,"REQUESTED"],[18,[[50,"COMPLETED"],[50,"ERROR"]]],[22,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-20T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-20T05:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-20T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-20T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for days as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'days',
            text: [[0,'PENDING'],[2,'REQUESTED'],[4,[[50,'COMPLETED'],[50,'ERROR']]],[6,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-16T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-17T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-18T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-19T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-21T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-22T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-23T23:55:00Z'))).equal('PENDING');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for days as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "days",' +
          '"text": [[0,"PENDING"],[2,"REQUESTED"],[4,[[50,"COMPLETED"],[50,"ERROR"]]],[6,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-16T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-17T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-18T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-19T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-21T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-22T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-23T23:55:00Z'))).equal('PENDING');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for dates as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'dates',
            text: [[5,'PENDING'],[10,'REQUESTED'],[20,[[50,'COMPLETED'],[50,'ERROR']]],[30,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-05T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-07T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for dates as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "dates",' +
          '"text": [[5,"PENDING"],[10,"REQUESTED"],[20,[[50,"COMPLETED"],[50,"ERROR"]]],[30,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-10-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-10-05T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-07T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-10-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-10-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-10-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-10-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for months as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'months',
            text: [[2,'PENDING'],[4,'REQUESTED'],[7,[[50,'COMPLETED'],[50,'ERROR']]],[10,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('2016-01-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-03-01T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-04-05T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-05-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-06-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-08-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-11-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-12-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for months as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "months",' +
          '"text": [[2,"PENDING"],[4,"REQUESTED"],[7,[[50,"COMPLETED"],[50,"ERROR"]]],[10,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('2016-01-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2016-03-01T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-04-05T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2016-05-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2016-06-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-08-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2016-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2016-11-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2016-12-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for years as units if valid interpolation specification is passed as an object',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          {
            units: 'years',
            text: [[2000,'PENDING'],[2005,'REQUESTED'],[2010,[[50,'COMPLETED'],[50,'ERROR']]],[2015,'REMOVED']]
          }
        );
        should(textRotationInterpolatorFunction(new Date('1999-01-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2000-01-01T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2003-03-05T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2005-05-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2007-06-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2010-08-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2013-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2015-11-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2020-12-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate for years as units if valid interpolation specification is passed as a string',
    function(done) {
      try {
        textRotationInterpolatorFunction = textRotationInterpolator(
          '{"units": "years",' +
          '"text": [[2000,"PENDING"],[2005,"REQUESTED"],[2010,[[50,"COMPLETED"],[50,"ERROR"]]],[2015,"REMOVED"]]}'
        );
        should(textRotationInterpolatorFunction(new Date('1999-01-01T00:00:00Z'))).equal(null);
        should(textRotationInterpolatorFunction(new Date('2000-01-01T00:00:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2003-03-05T08:10:00Z'))).equal('PENDING');
        should(textRotationInterpolatorFunction(new Date('2005-05-10T15:15:00Z'))).equal('REQUESTED');
        should(textRotationInterpolatorFunction(new Date('2007-06-15T16:20:00Z'))).equal('REQUESTED');
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2010-08-20T18:30:00Z')));
        should(['COMPLETED', 'ERROR']).containEql(textRotationInterpolatorFunction(new Date('2013-10-25T19:35:00Z')));
        should(textRotationInterpolatorFunction(new Date('2015-11-30T22:45:00Z'))).equal('REMOVED');
        should(textRotationInterpolatorFunction(new Date('2020-12-31T23:55:00Z'))).equal('REMOVED');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );
});
