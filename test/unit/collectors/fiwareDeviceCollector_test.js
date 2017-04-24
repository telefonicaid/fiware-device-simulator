/*
 * Copyright 2017 Telefónica Investigación y Desarrollo, S.A.U
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

/* global describe, it */

var ROOT_PATH = require('app-root-path');
var fiwareDeviceSimulatorCollector = require(ROOT_PATH + '/lib/collectors/fiwareDeviceSimulatorCollector');
var should = require('should');

describe('fiwareDeviceSimulatorCollector', function() {
  it('should not return any value if not assigned to module.exports', function() {
    var collector = fiwareDeviceSimulatorCollector('module.exportsss = 123;');
    should(collector.collect()).deepEqual({});
  });

  it('should return a value if assigned to module.exports', function() {
    var collector = fiwareDeviceSimulatorCollector('module.exports = 123;');
    should(collector.collect()).equal(123);
  });

  it('should return the external object if assigned to module.exports', function() {
    var collector = fiwareDeviceSimulatorCollector('module.exports = external;');
    should(collector.collect({property1: 'value1'})).deepEqual({property1: 'value1'});
  });

  it('should return a value if module is required', function() {
    var collector = fiwareDeviceSimulatorCollector(
      'var ROOT_PATH = require("app-root-path");' +
      'var linearInterpolator = require(ROOT_PATH + \'/lib/interpolators/linearInterpolator\');' +
      'var interpolator = linearInterpolator({spec: [[0, 0], [10, 10]], return: {type: "float"}});' +
      'module.exports = interpolator(external.pointX);'
    );
    should(collector.collect({pointX: 2.5})).equal(2.5);
    should(collector.collect({pointX: 5})).equal(5);
    should(collector.collect({pointX: 7.5})).equal(7.5);
  });
});
