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
var fiwareDeviceSimulatorTranspiler = require(ROOT_PATH + '/lib/transpilers/fiwareDeviceSimulatorTranspiler');

describe('fiwareDeviceSimulatorTranspiler tests', function() {
  it('should not import anything if no template is included', function() {
    fiwareDeviceSimulatorTranspiler.transpile(
      {
        should: 'not-transform-anything'
      },
      function(err, newConfiguration) {
        should(err).equal(null);
        should(newConfiguration).containEql({should: 'not-transform-anything'});
      }
    );
  });

  it('should throw an error if a template cannot be resolved', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          property: 'import(inexistent-template)'
        },
        function(err) {
          should(err).be.an.instanceof(fdsErrors.SimulationConfigurationNotValid);
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import a string template if defined in the exports property', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          exports: {
            template: 'template-value'
          },
          property: 'import(template)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 'template-value'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import a string template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          property: 'import(test/unit/templates/template-string)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 'template-value'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import a number template if defined in the exports property', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          exports: {
            template: 666
          },
          property: 'import(template)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 666});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import a number template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          property: 'import(test/unit/templates/template-number)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration).containEql({property: 666});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import an array template if defined in the exports property', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          exports: {
            template: [1, 2, 3]
          },
          property: 'import(template)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql(1);
          should(newConfiguration.property).containEql(2);
          should(newConfiguration.property).containEql(3);
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import an array template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          property: 'import(test/unit/templates/template-array)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql(1);
          should(newConfiguration.property).containEql(2);
          should(newConfiguration.property).containEql(3);
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import an object template if defined in the exports property', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          exports: {
            template: {
              'property1': 'value1',
              'property2': 'value2',
              'property3': 'value3'
            }
          },
          property: 'import(template)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql({property1: 'value1'});
          should(newConfiguration.property).containEql({property2: 'value2'});
          should(newConfiguration.property).containEql({property3: 'value3'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import an object template if defined in an external template file', function(done) {
    try{
      fiwareDeviceSimulatorTranspiler.transpile(
        {
          property: 'import(test/unit/templates/template-object)'
        },
        function(err, newConfiguration) {
          should(err).equal(null);
          should(newConfiguration.property).containEql({property1: 'value1'});
          should(newConfiguration.property).containEql({property2: 'value2'});
          should(newConfiguration.property).containEql({property3: 'value3'});
          done();
        }
      );
    } catch (exception) {
      done(exception);
    }
  });

  it('should import the template value if the entity condition is satified if defined in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-name',
                schedule: 'import(template)'
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].schedule).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import the template value if the entity condition is satified if defined in an external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-name',
                schedule: 'import(test/unit/templates/template-entity-condition)'
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].schedule).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the entity condition is not satified if defined in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-NAME',
                schedule: 'import(template)'
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].schedule).equal('import(template)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the entity condition is not satified if defined in an ' +
     'external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-NAME',
                schedule: 'import(test/unit/templates/template-entity-condition)'
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].schedule).equal(
              'import(test/unit/templates/template-entity-condition)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import the template value of an attribute if the entity condition is satified if defined ' +
     'in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(template)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import the template value of an attribute if the entity condition is satified if defined ' +
     'in an external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(test/unit/templates/template-entity-condition)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import the template value of an attribute if the attribute condition is satified if defined ' +
     'in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(template)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import the template value of an attribute if the attribute condition is satified if defined ' +
     'in an external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(test/unit/templates/template-attribute-condition)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('the-content');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the attribute condition is not satified in the entity part ' +
     'if defined in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-NAME',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(template)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('import(template)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the attribute condition is not satified in the entity part ' +
     'if defined in an external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-NAME',
                active: [
                  {
                    name: 'the-attribute-name',
                    value: 'import(test/unit/templates/template-attribute-condition)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal(
              'import(test/unit/templates/template-attribute-condition)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the attribute condition is not satified in the attribute part ' +
     'if defined in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              template: [
                {
                  'content': 'the-content',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-NAME',
                    value: 'import(template)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal('import(template)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should not import the template value if the attribute condition is not satified in the attribute part ' +
     'if defined in an external template file',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-name',
                active: [
                  {
                    name: 'the-attribute-NAME',
                    value: 'import(test/unit/templates/template-attribute-condition)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].active[0].value).equal(
              'import(test/unit/templates/template-attribute-condition)');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import correctly a complex simulation configuration file using templates if defined ' +
     'in the exports property',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            exports: {
              'template-1': [
                {
                  'content': 'the-entity-type',
                  'condition': '${{entity_name==the-.*-name}}'
                }
              ],
              'template-2': [
                {
                  'content': 'not-matching',
                  'condition': '${{entity_name==the-.*-NAME}}'
                },
                {
                  'content': 'the-entity-schedule',
                  'condition': '${{entity_name==the-.*-name}}'
                }
              ],
              'template-3': [
                {
                  'content': 'the-attribute-type',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-name}}'
                }
              ],
              'template-4': [
                {
                  'content': 'not-matching',
                  'condition': '${{entity_name==the-.*-NAME}{name==the-.*-name}}'
                },
                {
                  'content': 'not-matching',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-NAME}}'
                },
                {
                  'content': 'the-attribute-value',
                  'condition': '${{entity_name==the-.*-name}{name==the-.*-name}}'
                }
              ]
            },
            entities: [
              {
                entity_name: 'the-entity-name',
                type: 'import(template-1)',
                schedule: 'import(template-2)',
                active: [
                  {
                    name: 'the-attribute-name',
                    type: 'import(template-3)',
                    value: 'import(template-4)'
                  },
                  {
                    name: 'the-attribute-name',
                    type: 'import(template-3)',
                    value: 'import(template-4)'
                  }
                ]
              },
              {
                entity_name: 'the-entity-name',
                type: 'import(template-1)',
                schedule: 'import(template-2)',
                active: [
                  {
                    name: 'the-attribute-name',
                    type: 'import(template-3)',
                    value: 'import(template-4)'
                  },
                  {
                    name: 'the-attribute-name',
                    type: 'import(template-3)',
                    value: 'import(template-4)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].type).equal('the-entity-type');
            should(newConfiguration.entities[0].schedule).equal('the-entity-schedule');
            should(newConfiguration.entities[0].active[0].type).equal('the-attribute-type');
            should(newConfiguration.entities[0].active[0].value).equal('the-attribute-value');
            should(newConfiguration.entities[0].active[1].type).equal('the-attribute-type');
            should(newConfiguration.entities[0].active[1].value).equal('the-attribute-value');
            should(newConfiguration.entities[1].type).equal('the-entity-type');
            should(newConfiguration.entities[1].schedule).equal('the-entity-schedule');
            should(newConfiguration.entities[1].active[0].type).equal('the-attribute-type');
            should(newConfiguration.entities[1].active[0].value).equal('the-attribute-value');
            should(newConfiguration.entities[1].active[1].type).equal('the-attribute-type');
            should(newConfiguration.entities[1].active[1].value).equal('the-attribute-value');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );

  it('should import correctly a complex simulation configuration file using templates if defined ' +
     'in external template files',
    function (done) {
      /* jshint camelcase: false */
      try{
        fiwareDeviceSimulatorTranspiler.transpile(
          {
            entities: [
              {
                entity_name: 'the-entity-name',
                type: 'import(test/unit/templates/template-type-entity-condition)',
                schedule: 'import(test/unit/templates/template-schedule-entity-condition)',
                active: [
                  {
                    name: 'the-attribute-name',
                    type: 'import(test/unit/templates/template-type-attribute-condition)',
                    value: 'import(test/unit/templates/template-value-attribute-condition)'
                  },
                  {
                    name: 'the-attribute-name',
                    type: 'import(test/unit/templates/template-type-attribute-condition)',
                    value: 'import(test/unit/templates/template-value-attribute-condition)'
                  }
                ]
              },
              {
                entity_name: 'the-entity-name',
                type: 'import(test/unit/templates/template-type-entity-condition)',
                schedule: 'import(test/unit/templates/template-schedule-entity-condition)',
                active: [
                  {
                    name: 'the-attribute-name',
                    type: 'import(test/unit/templates/template-type-attribute-condition)',
                    value: 'import(test/unit/templates/template-value-attribute-condition)'
                  },
                  {
                    name: 'the-attribute-name',
                    type: 'import(test/unit/templates/template-type-attribute-condition)',
                    value: 'import(test/unit/templates/template-value-attribute-condition)'
                  }
                ]
              }
            ]
          },
          function(err, newConfiguration) {
            should(err).equal(null);
            should(newConfiguration.entities[0].type).equal('the-entity-type');
            should(newConfiguration.entities[0].schedule).equal('the-entity-schedule');
            should(newConfiguration.entities[0].active[0].type).equal('the-attribute-type');
            should(newConfiguration.entities[0].active[0].value).equal('the-attribute-value');
            should(newConfiguration.entities[0].active[1].type).equal('the-attribute-type');
            should(newConfiguration.entities[0].active[1].value).equal('the-attribute-value');
            should(newConfiguration.entities[1].type).equal('the-entity-type');
            should(newConfiguration.entities[1].schedule).equal('the-entity-schedule');
            should(newConfiguration.entities[1].active[0].type).equal('the-attribute-type');
            should(newConfiguration.entities[1].active[0].value).equal('the-attribute-value');
            should(newConfiguration.entities[1].active[1].type).equal('the-attribute-type');
            should(newConfiguration.entities[1].active[1].value).equal('the-attribute-value');
            done();
          }
        );
      } catch (exception) {
        done(exception);
      }
      /* jshint camelcase: true */
    }
  );
});
