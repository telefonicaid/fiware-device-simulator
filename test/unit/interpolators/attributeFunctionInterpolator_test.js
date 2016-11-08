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
var nock = require('nock');
var fdsErrors = require(ROOT_PATH + '/lib/errors/fdsErrors');
var attributeFunctionInterpolator = require(ROOT_PATH + '/lib/interpolators/attributeFunctionInterpolator');

var ATTRIBUTE_VALUE_1 = 111;
var ATTRIBUTE_VALUE_2 = 222;
var ATTRIBUTE_VALUE_3 = 333;

describe('attributeFunctionInterpolator tests', function() {
  var attributeFunctionInterpolatorFunction,
      domain = {
        service: 'theService',
        subservice: '/theSubService'
      },
      contextBroker = {
        protocol: 'https',
        host: 'localhost',
        port: 1026,
        ngsiVersion: '1.0'
      },
      token = '9148f6f23c3e40c5b8b28766c50dffb5',
      contextBrokerNock = nock(
        contextBroker.protocol + '://' + contextBroker.host + ':' + contextBroker.port,
        {
          reqheaders: {
            'Fiware-Service': domain.service,
            'Fiware-ServicePath': domain.subservice
          }
        }
      );

  beforeEach(function() {
    contextBrokerNock.post('/v1/queryContext').reply(200, function(uri, requestBody) {
      if (requestBody.entities[0].id === 'EntityId1') {
        return {
          contextResponses: [
            {
              contextElement: {
                type: 'Entity',
                isPattern: 'false',
                id: 'EntityId1',
                attributes: [
                  {
                    name: 'AttributeName11',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_1
                  },
                  {
                    name: 'AttributeName12',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_1 * 2
                  }
                ]
              },
              statusCode: {
                code: 200,
                reasonPhrase: 'OK'
              }
            }
          ]
        };
      } else if (requestBody.entities[0].id === 'EntityId2' && requestBody.entities[0].type === 'Entity2') {
        return {
          contextResponses: [
            {
              contextElement: {
                type: 'Entity2',
                isPattern: 'false',
                id: 'EntityId2',
                attributes: [
                  {
                    name: 'AttributeName21',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_2
                  },
                  {
                    name: 'AttributeName22',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_2 * 2
                  }
                ]
              },
              statusCode: {
                code: 200,
                reasonPhrase: 'OK'
              }
            }
          ]
        };
      } else if (requestBody.entities[0].id === 'EntityId2') {
        return {
          contextResponses: [
            {
              contextElement: {
                type: 'Entity',
                isPattern: 'false',
                id: 'EntityId2',
                attributes: [
                  {
                    name: 'AttributeName21',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_3
                  },
                  {
                    name: 'AttributeName22',
                    type: 'Number',
                    value: ATTRIBUTE_VALUE_3 * 2
                  }
                ]
              },
              statusCode: {
                code: 200,
                reasonPhrase: 'OK'
              }
            }
          ]
        };
      }
    });
  });

  it('should throw an error if ReferenceError is forced via the interpolation specification as a string',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(
          'undeclaredVariable', domain, contextBroker);
        attributeFunctionInterpolatorFunction(token);
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );

  it('should interpolate if a number is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(666, domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(666);
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if a number is passed as a string as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('666', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(666);
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if a string is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('\"some-text\"', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal('some-text');
      done();
    } catch(exception) {
      should(exception).be.an.instanceof(fdsErrors.InvalidInterpolationSpec);
      done();
    }
  });

  it('should interpolate if an array is passed as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator([1, 2, 3], domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).containEql(1);
      should(attributeFunctionInterpolatorFunction(token)).containEql(2);
      should(attributeFunctionInterpolatorFunction(token)).containEql(3);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should interpolate if an array is passed as a string as the interpolation specification', function(done) {
    try {
      attributeFunctionInterpolatorFunction = attributeFunctionInterpolator('[1, 2, 3]', domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).containEql(1);
      should(attributeFunctionInterpolatorFunction(token)).containEql(2);
      should(attributeFunctionInterpolatorFunction(token)).containEql(3);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should interpolate if a reference to an entity attribute (without entity type) is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId1}{AttributeName11}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if a reference to an entity attribute (with entity type) is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId2:#:Entity2}{AttributeName21}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_2);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if an addition to a reference to an entity attribute (without entity type) is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId1}{AttributeName11}} + 111', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1 + 111);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if an addition to a reference to an entity attribute (with entity type) is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('${{EntityId2:#:Entity2}{AttributeName21}} + 111', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_2 + 111);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if a function invocation on a reference to an entity attribute (without entity type) ' +
     'is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('Math.pow(${{EntityId1}{AttributeName11}}, 2);', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(Math.pow(ATTRIBUTE_VALUE_1, 2));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if a function invocation on a reference to an entity attribute (with entity type) ' +
     'is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('Math.pow(${{EntityId2:#:Entity2}{AttributeName21}}, 2);',
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(Math.pow(ATTRIBUTE_VALUE_2, 2));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if the addition of references to distinct entity\'s attributes (without entity type) ' +
     'is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            '${{EntityId1}{AttributeName11}} + ${{EntityId1}{AttributeName12}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1 + (ATTRIBUTE_VALUE_1 * 2));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if the addition of references to distinct entity\'s attributes (with entity type) ' +
     'is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            '${{EntityId1}{AttributeName11}} + ${{EntityId2:#:Entity2}{AttributeName22}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1 + (ATTRIBUTE_VALUE_2 * 2));
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if the addition of references to attributes of distinct entities attributes ' +
     '(without entity type) is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            '${{EntityId1}{AttributeName11}} + ${{EntityId2}{AttributeName21}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1 + ATTRIBUTE_VALUE_3);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should interpolate if the addition of references to attributes of distinct entities attributes ' +
     '(with entity type) is passed as the interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            '${{EntityId1}{AttributeName11}} + ${{EntityId2:#:Entity2}{AttributeName21}}', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(ATTRIBUTE_VALUE_1 + ATTRIBUTE_VALUE_2);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should throw an error if a invalid Javascript code with a reference to an entity attribute is passed as the ' +
     'interpolation specification',
    function(done) {
      try {
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator('Math.pow(${{EntityId1}{AttributeName11}}, 2', domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(Math.pow(ATTRIBUTE_VALUE_1, 2));
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );

  it('should interpolate if packages are required in the interpolation specification', function(done) {
    try {
      var
      attributeFunctionInterpolatorFunction =
        attributeFunctionInterpolator(
          'var linearInterpolator = require("' + ROOT_PATH + '/lib/interpolators/linearInterpolator"); ' +
          'module.exports = linearInterpolator([[0,0],[10,10]])(5);',
          domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(5);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should throw an error if the packages required in the interpolation specification are not available',
    function(done) {
      try {
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            'var linearInterpolator = require("' + ROOT_PATH + '/lib/interpolators/NON-EXISTENT"); ' +
            'module.exports = linearInterpolator([[0,0],[10,10]])(5);',
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(5);
        done(new Error('It should throw an ValueResolutionError error'));
        done();
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );

  it('should make available the simulator date if module.exports is used in the interpolation specification',
    function(done) {
      try {
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            'module.exports = new SimulationDate();',
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token).getFullYear()).equal(new Date().getFullYear());
        should(attributeFunctionInterpolatorFunction(token).getMonth()).equal(new Date().getMonth());
        should(attributeFunctionInterpolatorFunction(token).getDate()).equal(new Date().getDate());
        should(attributeFunctionInterpolatorFunction(token).getDay()).equal(new Date().getDay());
        should(attributeFunctionInterpolatorFunction(token).getHours()).equal(new Date().getHours());
        should(attributeFunctionInterpolatorFunction(token).getMinutes()).equal(new Date().getMinutes());
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should pass the state and interpolate if it is used in the interpolation specification', function(done) {
    try {
      var attributeFunctionInterpolatorSpec =
      '/* state: stateful1, stateful2 */ var linearInterpolator = require("' + ROOT_PATH +
        '/lib/interpolators/linearInterpolator"); ' +
        'module.exports = { ' +
          'result: linearInterpolator([[0,0],[10,10]])(5) + (stateful1 = (stateful1 ? ++stateful1 : 1)) + ' +
            '(stateful2 = (stateful2 ? ++stateful2 : 1)),' +
          'state: { stateful1: stateful1, stateful2: stateful2}' +
        ' };';
      var
      attributeFunctionInterpolatorFunction =
        attributeFunctionInterpolator(
          attributeFunctionInterpolatorSpec,
          domain, contextBroker);
      should(attributeFunctionInterpolatorFunction(token)).equal(7);
      should(attributeFunctionInterpolatorFunction(token)).equal(9);
      should(attributeFunctionInterpolatorFunction(token)).equal(11);
      done();
    } catch(exception) {
      done(exception);
    }
  });

  it('should initiate (as a number), pass the state and interpolate if it is used in the interpolation specification',
    function(done) {
      try {
        var attributeFunctionInterpolatorSpec =
        '/* state: stateful1 = 5, stateful2 */ var linearInterpolator = require("' + ROOT_PATH +
          '/lib/interpolators/linearInterpolator"); ' +
          'module.exports = { ' +
            'result: linearInterpolator([[0,0],[10,10]])(5) + stateful1 + ' +
              '(stateful2 = (stateful2 ? ++stateful2 : 1)),' +
            'state: { stateful1: ++stateful1, stateful2: stateful2}' +
          ' };';
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(11);
        should(attributeFunctionInterpolatorFunction(token)).equal(13);
        should(attributeFunctionInterpolatorFunction(token)).equal(15);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should initiate (as a string), pass the state and interpolate if it is used in the interpolation specification',
    function(done) {
      try {
        var attributeFunctionInterpolatorSpec =
        '/* state: stateful1 = 5, stateful2 =\"tralara\" */ var linearInterpolator = require("' + ROOT_PATH +
          '/lib/interpolators/linearInterpolator"); ' +
          'module.exports = { ' +
            'result: linearInterpolator([[0,0],[10,10]])(5) + (stateful2 === \"tralara\" ? stateful1 : 0),' +
            'state: { stateful1: ++stateful1, stateful2: \"\"}' +
          ' };';
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(10);
        should(attributeFunctionInterpolatorFunction(token)).equal(5);
        should(attributeFunctionInterpolatorFunction(token)).equal(5);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should initiate (as an array), pass the state and interpolate if it is used in the interpolation specification',
    function(done) {
      try {
        var attributeFunctionInterpolatorSpec =
        '/* state: stateful1 = [5], stateful2 */ var linearInterpolator = require("' + ROOT_PATH +
          '/lib/interpolators/linearInterpolator"); ' +
          'module.exports = { ' +
            'result: linearInterpolator([[0,0],[10,10]])(5) + stateful1[0] + ' +
              '(stateful2 = (stateful2 ? ++stateful2 : 1)),' +
            'state: { stateful1: [++stateful1], stateful2: stateful2}' +
          ' };';
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(11);
        should(attributeFunctionInterpolatorFunction(token)).equal(13);
        should(attributeFunctionInterpolatorFunction(token)).equal(15);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should initiate (as an array), pass the state and interpolate if it is used in the interpolation specification',
    function(done) {
      try {
        var attributeFunctionInterpolatorSpec =
        '/* state: stateful1 = {\"value\": 5}, stateful2 */ var linearInterpolator = require("' + ROOT_PATH +
          '/lib/interpolators/linearInterpolator"); ' +
          'module.exports = { ' +
            'result: linearInterpolator([[0,0],[10,10]])(5) + stateful1.value + ' +
              '(stateful2 = (stateful2 ? ++stateful2 : 1)),' +
            'state: { stateful1: {\"value\": ++stateful1.value}, stateful2: stateful2}' +
          ' };';
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction(token)).equal(11);
        should(attributeFunctionInterpolatorFunction(token)).equal(13);
        should(attributeFunctionInterpolatorFunction(token)).equal(15);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should pass a global number state variable between interpolators with distinct specifications',
    function(done) {
      global.fdsGlobals = {
        numberVar: 666
      };
      try {
        var attributeFunctionInterpolatorSpec1 =
        'var newNumber = numberVar + 1; module.exports = { result: newNumber, ' +
          'state: { globals: { numberVar: newNumber}}};';
        var
        attributeFunctionInterpolatorFunction1 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec1,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction1(token)).equal(667);
        var attributeFunctionInterpolatorSpec2 =
        'var newNumber = numberVar + 1; module.exports = { result: newNumber, ' +
          'state: { globals: { numberVar: newNumber}}};';
        var
        attributeFunctionInterpolatorFunction2 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec2,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction2(token)).equal(668);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should pass a global string state variable between interpolators with distinct specifications',
    function(done) {
      global.fdsGlobals = {
        textVar: 'some'
      };
      try {
        var attributeFunctionInterpolatorSpec1 =
        'var newText = textVar + \"text\"; module.exports = { result: newText, ' +
          'state: { globals: { textVar: newText}}};';
        var
        attributeFunctionInterpolatorFunction1 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec1,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction1(token)).equal('sometext');
        var attributeFunctionInterpolatorSpec2 =
        'var newText = textVar + \"here\"; module.exports = { result: newText, ' +
          'state: { globals: { textVar: newText}}};';
        var
        attributeFunctionInterpolatorFunction2 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec2,
            domain, contextBroker);
        should(attributeFunctionInterpolatorFunction2(token)).equal('sometexthere');
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should pass a global array state variable between interpolators with distinct specifications',
    function(done) {
      global.fdsGlobals = {
        arrayVar: [1, 2, 3]
      };
      try {
        var attributeFunctionInterpolatorSpec1 =
          'arrayVar.push(4); var newArray = arrayVar; module.exports = { result: newArray, ' +
            'state: { globals: { arrayVar: newArray}}};';
        var
        attributeFunctionInterpolatorFunction1 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec1,
            domain, contextBroker);
        var result = attributeFunctionInterpolatorFunction1(token);
        should(result.length).equal(4);
        should(result).containEql(4);
        var attributeFunctionInterpolatorSpec2 =
          'arrayVar.push(5); var newArray = arrayVar; module.exports = { result: newArray, ' +
            'state: { globals: { arrayVar: newArray}}};';
        var
        attributeFunctionInterpolatorFunction2 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec2,
            domain, contextBroker);
        result = attributeFunctionInterpolatorFunction2(token);
        should(result.length).equal(5);
        should(result).containEql(5);
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should pass a global object state variable between interpolators with distinct specifications',
    function(done) {
      global.fdsGlobals = {
        objectVar: {
          property1: 'value1'
        }
      };
      try {
        var attributeFunctionInterpolatorSpec1 =
          'objectVar.property2 = \"value2\"; var newObject = objectVar; module.exports = { result: newObject, ' +
            'state: { globals: { objectVar: newObject}}};';
        var
        attributeFunctionInterpolatorFunction1 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec1,
            domain, contextBroker);
        var result = attributeFunctionInterpolatorFunction1(token);
        should(result).containEql({property1: 'value1'});
        should(result).containEql({property2: 'value2'});
        var attributeFunctionInterpolatorSpec2 =
        'objectVar.property3 = \"value3\"; var newObject = objectVar; module.exports = { result: newObject, ' +
          'state: { globals: { objectVar: newObject}}};';
        var
        attributeFunctionInterpolatorFunction2 =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec2,
            domain, contextBroker);
        result = attributeFunctionInterpolatorFunction2(token);
        should(result).containEql({property1: 'value1'});
        should(result).containEql({property2: 'value2'});
        should(result).containEql({property3: 'value3'});
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should combine local and global state variables in interpolators with the same specification',
    function(done) {
      global.fdsGlobals = {
        objectVar: {
          property1: 'value1'
        }
      };
      try {
        var attributeFunctionInterpolatorSpec =
          '/* state: localVar = \"localVar\" */ ' +
          'localVar = localVar + \"2\"; ' +
          'objectVar.property1 = objectVar.property1 + localVar; ' +
          'module.exports = { ' +
            'result: objectVar, ' +
            'state: { localVar: localVar, globals: { objectVar: objectVar}}' +
          '};';
        var
        attributeFunctionInterpolatorFunction =
          attributeFunctionInterpolator(
            attributeFunctionInterpolatorSpec,
            domain, contextBroker);
        var result = attributeFunctionInterpolatorFunction(token);
        should(result).containEql({property1: 'value1localVar2'});
        result = attributeFunctionInterpolatorFunction(token);
        should(result).containEql({property1: 'value1localVar2localVar22'});
        done();
      } catch(exception) {
        done(exception);
      }
    }
  );

  it('should throw an error if the Context Broker responds with an error',
    function(done) {
      nock.restore();
      contextBrokerNock.post('/v1/queryContext').reply(404);
      try {
        attributeFunctionInterpolatorFunction = attributeFunctionInterpolator(
          '${{InexistentEntityId}{InexistentAttributeName}}', domain, contextBroker);
        attributeFunctionInterpolatorFunction(token);
        done(new Error('It should throw an ValueResolutionError error'));
      } catch(exception) {
        should(exception).be.an.instanceof(fdsErrors.ValueResolutionError);
        done();
      }
    }
  );
});
