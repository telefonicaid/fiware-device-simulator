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

/**
 * Invalid interpolation specification error
 * @param {String} message Human-readable description of the error
 */
function InvalidInterpolationSpec(message) {
  Error.call(this, message);
  this.name = 'InvalidInterpolationSpec';
  this.message = message;
}
InvalidInterpolationSpec.prototype = Object.create(Error.prototype);

/**
 * NGSI version not supported error
 * @param {String} message Human-readable description of the error
 */
function NGSIVersionNotSupported(message) {
  Error.call(this, message);
  this.name = 'NGSIVersionNotSupported';
  this.message = message;
}
NGSIVersionNotSupported.prototype = Object.create(Error.prototype);

/**
 * Package not imported error
 * @param {String} message Human-readable description of the error
 */
function PackageNotImported(message) {
  Error.call(this, message);
  this.name = 'PackageNotImported';
  this.message = message;
}
PackageNotImported.prototype = Object.create(Error.prototype);

/**
 * Protocol not supported error
 * @param {String} message Human-readable description of the error
 */
function ProtocolNotSupported(message) {
  Error.call(this, message);
  this.name = 'ProtocolNotSupported';
  this.message = message;
}
ProtocolNotSupported.prototype = Object.create(Error.prototype);

/**
 * Not valid simulation configuration error
 * @param {String} message Human-readable description of the error
 */
function SimulationConfigurationNotValid(message) {
  Error.call(this);
  this.name = 'SimulationConfigurationNotValid';
  this.message = message;
}
SimulationConfigurationNotValid.prototype = Object.create(Error.prototype);

/**
 * Token not available error
 * @param {String} message Human-readable description of the error
 */
function TokenNotAvailable(message) {
  Error.call(this, message);
  this.name = 'TokenNotAvailable';
  this.message = message;
}
TokenNotAvailable.prototype = Object.create(Error.prototype);

/**
 * Some error ocurred during a value resolution
 * @param {String} message Human-readable description of the error
 */
function ValueResolutionError(message) {
  Error.call(this, message);
  this.name = 'ValueResolutionError';
  this.message = message;
}
ValueResolutionError.prototype = Object.create(Error.prototype);

module.exports = {
  InvalidInterpolationSpec: InvalidInterpolationSpec,
  NGSIVersionNotSupported: NGSIVersionNotSupported,
  PackageNotImported: PackageNotImported,
  ProtocolNotSupported: ProtocolNotSupported,
  SimulationConfigurationNotValid: SimulationConfigurationNotValid,
  TokenNotAvailable: TokenNotAvailable,
  ValueResolutionError: ValueResolutionError
};
