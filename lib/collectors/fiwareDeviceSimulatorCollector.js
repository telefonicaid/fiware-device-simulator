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

var _eval = require('eval');

module.exports = function(spec) {
  /**
   * Returns the Object (Array | Iterable | Object) including the entities, attributes and metadata using a
   * NGSIv2-like structure
   * @param  {Object} externalData The external data from which to generate the Object
   *                               (Array | Iterable | Object) to return
   * @return {Object}              The Object (Array | Iterable | Object) for the provided external data
   */
  function collect(external) {
    var scope = {
      external: external
    };
    return _eval(spec, scope, true);
  }
  return {
    collect: collect
  };
};
