/**
 * Validates that the given document definition's property validator definitions conform to specifications.
 *
 * @param {Object} docDefinition The document type definition
 * @param {Object} docPropertyValidatorDefinitions The document type's property validator definitions
 *
 * @returns {string[]} An array of all problems that were identified in the property validators
 */
exports.validate = validate;

function validate(docDefinition, docPropertyValidatorDefinitions) {
  var validationErrors = [ ];

  var universalConstraints = {
    required: validateRequiredConstraint,
    mustNotBeMissing: validateBooleanConstraint,
    mustNotBeNull: validateBooleanConstraint,
    immutable: validateImmutableConstraint,
    immutableStrict: validateImmutableConstraint,
    immutableWhenSet: validateImmutableConstraint,
    immutableWhenSetStrict: validateImmutableConstraint,
    mustEqual: validateMustEqualConstraint,
    mustEqualStrict: validateMustEqualStrictConstraint,
    customValidation: validateCustomValidationConstraint
  };

  validatePropertyDefinitions(docPropertyValidatorDefinitions);

  function validatePropertyDefinitions(propertyDefinitions) {
    for (var propertyName in propertyDefinitions) {
      var propertyDefinition = propertyDefinitions[propertyName];
      if (isAnObject(propertyDefinition)) {
        validatePropertyDefinition(propertyName, propertyDefinition);
      } else {
        validationErrors.push('the "propertyValidators" entry "' + propertyName + '" is not an object');
      }
    }
  }

  function validatePropertyDefinition(propertyName, propertyDefinition) {
    var propertyType = propertyDefinition.type;
    if (isValueUndefined(propertyType)) {
      validationErrors.push('the "propertyValidators" entry "' + propertyName + '" does not declare a "type"');

      return;
    }

    // The universal constraints apply to every validation type
    validateItemConstraints(propertyName, propertyDefinition, universalConstraints);

    if (typeof(propertyType) === 'string') {
      switch (propertyType) {
        case 'string':
          break;
        case 'integer':
          break;
        case 'float':
          break;
        case 'boolean':
          break;
        case 'datetime':
          break;
        case 'date':
          break;
        case 'enum':
          break;
        case 'attachmentReference':
          break;
        case 'array':
          break;
        case 'object':
          break;
        case 'hashtable':
          break;
        default:
          validationErrors.push('the "propertyValidators" entry "' + propertyName + '" declares an invalid "type": "' + propertyType + '"');
          break;
      }
    } else if (typeof(propertyType) !== 'function') {
      validationErrors.push('the "propertyValidators" entry "' + propertyName + '" declares a "type" that is neither a string nor a function');
    }
  }

  function validateBooleanConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (typeof(constraintValue) !== 'boolean' && typeof(constraintValue) !== 'function') {
      validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares a "' + constraintName + '" constraint that is not a boolean or a function');
    }
  }

  function validateRequiredConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateBooleanConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (constraintValue === true && (itemValidatorDefinition.mustNotBeNull === true || itemValidatorDefinition.mustNotBeMissing)) {
      validationErrors.push('the "propertyValidators" entry "' + itemName + '" should not enable the "required" constraint when either "mustNotBeNull" or "mustNotBeNull" are also enabled');
    }
  }

  function validateImmutableConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateBooleanConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    var immutableConstraints = [ 'immutable', 'immutableStrict', 'immutableWhenSet', 'immutableWhenSetStrict' ];
    immutableConstraints.splice(immutableConstraints.indexOf(constraintName), 1);

    var hasImmutableConstraint0 = itemValidatorDefinition[immutableConstraints[0]] === true;
    var hasImmutableConstraint1 = itemValidatorDefinition[immutableConstraints[1]] === true;
    var hasImmutableConstraint2 = itemValidatorDefinition[immutableConstraints[2]] === true;
    if (constraintValue === true && (hasImmutableConstraint0 || hasImmutableConstraint1 || hasImmutableConstraint2)) {
      var otherConstraintsString =
        '"' + immutableConstraints[0] + '", "' + immutableConstraints[1] + '" or "' + immutableConstraints[2] + '"';
      validationErrors.push('the "propertyValidators" entry "' + itemName + '" should not enable the "' + constraintName + '" constraint when any of ' + otherConstraintsString + ' are also enabled');
    }
  }

  function validateMustEqualConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (!isValueNullOrUndefined(constraintValue) && !isValueUndefined(itemValidatorDefinition.mustEqualStrict)) {
      validationErrors.push('the "propertyValidators" entry "' + itemName + '" should not declare both "mustEqual" and "mustEqualStrict" constraints');
    }

    validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMustEqualStrictConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (constraintValue === null) {
      if (itemValidatorDefinition.required === true) {
        validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal null but also that it is required');
      } else if (itemValidatorDefinition.mustNotBeNull === true) {
        validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal null but also that it must not be null');
      }
    }

    validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (!isValueNullOrUndefined(constraintValue) && typeof(constraintValue) !== 'function' && typeof(itemValidatorDefinition) !== 'function') {
      switch (itemValidatorDefinition.type) {
        case 'string':
          if (typeof(constraintValue) !== 'string') {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a string');
          }
          break;
        case 'integer':
          if (!isInteger(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not an integer');
          }
          break;
        case 'float':
          if (typeof(constraintValue) !== 'number') {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a number');
          }
          break;
        case 'boolean':
          if (typeof(constraintValue) !== 'boolean') {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a boolean');
          }
          break;
        case 'datetime':
          if (!(constraintValue instanceof Date) && !isIso8601DateTimeString(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a datetime');
          }
          break;
        case 'date':
          if (!(constraintValue instanceof Date) && !isIso8601DateString(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a date');
          }
          break;
        case 'enum':
          if (itemValidatorDefinition.predefinedValues instanceof Array) {
            if (itemValidatorDefinition.predefinedValues.indexOf(constraintValue) < 0) {
              validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not in the list of predefined values');
            }
          } else if (typeof(constraintValue) !== 'string' && !isInteger(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a string or integer');
          }
          break;
        case 'attachmentReference':
          if (typeof(constraintValue) !== 'string') {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not a string');
          }
          break;
        case 'array':
          if (!(constraintValue instanceof Array)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not an array');
          }
          break;
        case 'object':
          if (!isAnObject(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not an object');
          }
          break;
        case 'hashtable':
          if (!isAnObject(constraintValue)) {
            validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares that it must equal a value that is not an object');
          }
          break;
      }
    }
  }

  function validateCustomValidationConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (typeof(constraintValue) !== 'function') {
      validationErrors.push('the "propertyValidators" entry "' + itemName + '" declares a value that is not a function');
    }
  }

  function validateItemConstraints(itemName, itemValidatorDefinition, constraints) {
    for (var itemConstraintName in itemValidatorDefinition) {
      if (itemConstraintName === 'type') {
        // The type constraint was already validated elsewhere
        continue;
      }

      var itemConstraintValue = itemValidatorDefinition[itemConstraintName];
      var constraintValidator = constraints[itemConstraintName];
      if (!isValueUndefined(constraintValidator)) {
        constraintValidator(itemName, itemValidatorDefinition, itemConstraintName, itemConstraintValue);
      }
    }
  }

  return validationErrors;
}

function isAnObject(value) {
  return value !== null && typeof(value) === 'object' && !(value instanceof Array);
}

function isValueUndefined(value) {
  return typeof(value) === 'undefined';
}

// Whether the given value is either null or undefined
function isValueNullOrUndefined(value) {
  return isValueUndefined(value) || value === null;
}

// Determine if a given value is an integer. Exists as a failsafe because Number.isInteger does not exist in older versions of Node.js
// (e.g. 0.10.x).
function isInteger(value) {
  if (typeof(Number.isInteger) === 'function') {
    return Number.isInteger(value);
  } else {
    return typeof(value) === 'number' && isFinite(value) && Math.floor(value) === value;
  }
}

// Check that a given value is a valid ISO 8601 format date string with optional time and time zone components
function isIso8601DateTimeString(value) {
  var regex = /^(([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))([T ]([01][0-9]|2[0-4])(:[0-5][0-9])?(:[0-5][0-9])?([\.,][0-9]{1,3})?)?([zZ]|([\+-])([01][0-9]|2[0-3]):?([0-5][0-9])?)?$/;

  return regex.test(value);
}

// Check that a given value is a valid ISO 8601 date string without time and time zone components
function isIso8601DateString(value) {
  var regex = /^(([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$/;

  return regex.test(value);
}
