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

  // The universal constraints apply to every validation type
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

  var booleanConstraints = buildConstraints({ });
  var stringConstraints = buildConstraints(
    {
      mustNotBeEmpty: validateBooleanConstraint,
      regexPattern: validateRegexPatternConstraint,
      minimumLength: validateMinimumLengthConstraint,
      maximumLength: validateMaximumLengthConstraint
    }
  );
  var integerConstraints = buildConstraints(
    {
      minimumValue: validateMinimumIntegerValueConstraint,
      minimumValueExclusive: validateMinimumExclusiveIntegerValueConstraint,
      maximumValue: validateMaximumIntegerValueConstraint,
      maximumValueExclusive: validateMaximumExclusiveIntegerValueConstraint
    }
  );
  var floatConstraints = buildConstraints(
    {
      minimumValue: validateMinimumFloatValueConstraint,
      minimumValueExclusive: validateMinimumExclusiveFloatValueConstraint,
      maximumValue: validateMaximumFloatValueConstraint,
      maximumValueExclusive: validateMaximumExclusiveFloatValueConstraint
    }
  );
  var enumConstraints = buildConstraints({ predefinedValues: validateEnumPredefinedValuesConstraint });
  var attachmentReferenceConstraints = buildConstraints(
    {
      supportedExtensions: validateAttachmentRefArrayConstraint,
      supportedContentTypes: validateAttachmentRefArrayConstraint,
      maximumSize: validateAttachmentRefMaximumSizeConstraint
    }
  );

  validatePropertyDefinitions(docPropertyValidatorDefinitions);

  function validatePropertyDefinitions(propertyDefinitions) {
    for (var propertyName in propertyDefinitions) {
      var propertyDefinition = propertyDefinitions[propertyName];
      if (isAnObject(propertyDefinition)) {
        validatePropertyDefinition(propertyName, propertyDefinition);
      } else {
        addValidationError(propertyName, 'is not an object');
      }
    }
  }

  function validatePropertyDefinition(propertyName, propertyDefinition) {
    var propertyType = propertyDefinition.type;
    if (isValueUndefined(propertyType)) {
      addValidationError(propertyName, 'does not declare a "type"');

      return;
    }

    if (typeof(propertyType) === 'string') {
      switch (propertyType) {
        case 'string':
          validateItemConstraints(propertyName, propertyDefinition, stringConstraints);
          break;
        case 'integer':
          validateItemConstraints(propertyName, propertyDefinition, integerConstraints);
          break;
        case 'float':
          validateItemConstraints(propertyName, propertyDefinition, floatConstraints);
          break;
        case 'boolean':
          validateItemConstraints(propertyName, propertyDefinition, booleanConstraints);
          break;
        case 'datetime':
          break;
        case 'date':
          break;
        case 'enum':
          if (isValueUndefined(propertyDefinition.predefinedValues)) {
            addValidationError(propertyName, 'does not declare a "predefinedValues" constraint');
          }
          validateItemConstraints(propertyName, propertyDefinition, enumConstraints);
          break;
        case 'attachmentReference':
          if (docDefinition.allowAttachments !== true) {
            addValidationError(propertyName, 'cannot be applied when the document\'s "allowAttachments" property is not enabled');
          }
          validateItemConstraints(propertyName, propertyDefinition, attachmentReferenceConstraints);
          break;
        case 'array':
          break;
        case 'object':
          break;
        case 'hashtable':
          break;
        default:
          addValidationError(propertyName, 'declares an invalid "type": "' + propertyType + '"');
          break;
      }
    } else if (typeof(propertyType) !== 'function') {
      addValidationError(propertyName, 'declares a "type" that is neither a string nor a function');
    }
  }

  function validateBooleanConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (typeof(constraintValue) !== 'boolean' && typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not a boolean or a function');
    }
  }

  function validateRegexPatternConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (!(constraintValue instanceof RegExp) && typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not a regular expression or a function');
    }
  }

  function validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue, minimumValue) {
    if (!isInteger(constraintValue) && typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not an integer or a function');
    } else if (isInteger(minimumValue) && constraintValue < minimumValue) {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is less than the minimum: ' + minimumValue);
    }
  }

  function validateMinimumLengthConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue, 0);

    if (constraintValue === 0 && itemValidatorDefinition.mustNotBeEmpty === true) {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint of zero, which is directly contradicated by the "mustNotBeEmpty" constraint');
    }
  }

  function validateMaximumLengthConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue, 1);

    if (isInteger(constraintValue) && isInteger(itemValidatorDefinition.minimumLength) && constraintValue < itemValidatorDefinition.minimumLength) {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is less than the value of the "minimumLength" constraint');
    }
  }

  function validateMinimumIntegerValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMinimumExclusiveIntegerValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (!isValueUndefined(itemValidatorDefinition.minimumValue)) {
      addValidationError(itemName, 'declares both "minimumValue" and "minimumValueExclusive" constraints');
    }
  }

  function validateMaximumIntegerValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (typeof(constraintValue === 'number')) {
      if (typeof(itemValidatorDefinition.minimumValue) === 'number' && constraintValue < itemValidatorDefinition.minimumValue) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is less than the value of the "minimumValue" constraint');
      } else if (typeof(itemValidatorDefinition.minimumValueExclusive) === 'number' && constraintValue <= itemValidatorDefinition.minimumValueExclusive) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not greater than the value of the "minimumValueExclusive" constraint');
      }
    }
  }

  function validateMaximumExclusiveIntegerValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (typeof(constraintValue === 'number')) {
      if (typeof(itemValidatorDefinition.minimumValue) === 'number' && constraintValue <= itemValidatorDefinition.minimumValue) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not greater than the value of the "minimumValue" constraint');
      } else if (typeof(itemValidatorDefinition.minimumValueExclusive) === 'number' && constraintValue <= itemValidatorDefinition.minimumValueExclusive + 1) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not at least two greater than the value of the "minimumValueExclusive" constraint');
      }
    }

    if (!isValueUndefined(itemValidatorDefinition.maximumValue)) {
      addValidationError(itemName, 'declares both "maximumValue" and "maximumValueExclusive" constraints');
    }
  }

  function validateFloatConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (typeof(constraintValue) !== 'number' && typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not a number or a function');
    }
  }

  function validateMinimumFloatValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateFloatConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMinimumExclusiveFloatValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateFloatConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (!isValueUndefined(itemValidatorDefinition.minimumValue)) {
      addValidationError(itemName, 'declares both "minimumValue" and "minimumValueExclusive" constraints');
    }
  }

  function validateMaximumFloatValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateFloatConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (typeof(constraintValue === 'number')) {
      if (typeof(itemValidatorDefinition.minimumValue) === 'number' && constraintValue < itemValidatorDefinition.minimumValue) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is less than the value of the "minimumValue" constraint');
      } else if (typeof(itemValidatorDefinition.minimumValueExclusive) === 'number' && constraintValue <= itemValidatorDefinition.minimumValueExclusive) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not greater than the value of the "minimumValueExclusive" constraint');
      }
    }
  }

  function validateMaximumExclusiveFloatValueConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateFloatConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (typeof(constraintValue === 'number')) {
      if (typeof(itemValidatorDefinition.minimumValue) === 'number' && constraintValue <= itemValidatorDefinition.minimumValue) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not greater than the value of the "minimumValue" constraint');
      } else if (typeof(itemValidatorDefinition.minimumValueExclusive) === 'number' && constraintValue <= itemValidatorDefinition.minimumValueExclusive) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not greater than the value of the "minimumValueExclusive" constraint');
      }
    }

    if (!isValueUndefined(itemValidatorDefinition.maximumValue)) {
      addValidationError(itemName, 'declares both "maximumValue" and "maximumValueExclusive" constraints');
    }
  }

  function validateEnumPredefinedValuesConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (constraintValue instanceof Array) {
      if (constraintValue.length < 1) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is empty');
      }

      for (var predefinedValueIndex = 0; predefinedValueIndex < constraintValue.length; predefinedValueIndex++) {
        var predefinedValue = constraintValue[predefinedValueIndex];
        if (typeof(predefinedValue) !== 'string' && !isInteger(predefinedValue)) {
          addValidationError(itemName, 'declares a "' + constraintName + '" constraint that specifies a value that is not a string or an integer: ' + JSON.stringify(predefinedValue));
        }
      }
    } else if (typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not an array or a function');
    }
  }

  function validateAttachmentRefArrayConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (constraintValue instanceof Array) {
      if (constraintValue.length < 1) {
        addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is empty');
      }

      for (var elementIndex = 0; elementIndex < constraintValue.length; elementIndex++) {
        var elementValue = constraintValue[elementIndex];
        if (typeof(elementValue) !== 'string') {
          addValidationError(itemName, 'declares a "' + constraintName + '" constraint that specifies a value that is not a string: ' + JSON.stringify(elementValue));
        }
      }
    } else if (typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is not an array or a function');
    }
  }

  function validateAttachmentRefMaximumSizeConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateIntegerConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue, 1);

    if (typeof(constraintValue === 'number') &&
        docDefinition.attachmentConstraints &&
        typeof(docDefinition.attachmentConstraints.maximumTotalSize) === 'number' &&
        constraintValue > docDefinition.attachmentConstraints.maximumTotalSize) {
      addValidationError(itemName, 'declares a "' + constraintName + '" constraint that is greater than the value of the document type\'s "attachmentConstraints.maximumTotalSize" constraint');
    }
  }

  function validateRequiredConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    validateBooleanConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue);

    if (constraintValue === true && (itemValidatorDefinition.mustNotBeNull === true || itemValidatorDefinition.mustNotBeMissing)) {
      addValidationError(itemName, 'should not enable the "required" constraint when either "mustNotBeNull" or "mustNotBeNull" are also enabled');
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
      addValidationError(itemName, 'should not enable the "' + constraintName + '" constraint when any of ' + otherConstraintsString + ' are also enabled');
    }
  }

  function validateMustEqualConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (!isValueNullOrUndefined(constraintValue) && !isValueUndefined(itemValidatorDefinition.mustEqualStrict)) {
      addValidationError(itemName, 'declares both "mustEqual" and "mustEqualStrict" constraints');
    }

    validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMustEqualStrictConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (constraintValue === null) {
      if (itemValidatorDefinition.required === true) {
        addValidationError(itemName, 'declares that it must equal null but also that it is required');
      } else if (itemValidatorDefinition.mustNotBeNull === true) {
        addValidationError(itemName, 'declares that it must equal null but also that it must not be null');
      }
    }

    validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue);
  }

  function validateMustEqualConstraintType(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (!isValueNullOrUndefined(constraintValue) && typeof(constraintValue) !== 'function' && typeof(itemValidatorDefinition) !== 'function') {
      switch (itemValidatorDefinition.type) {
        case 'string':
          if (typeof(constraintValue) !== 'string') {
            addValidationError(itemName, 'declares that it must equal a value that is not a string');
          }
          break;
        case 'integer':
          if (!isInteger(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not an integer');
          }
          break;
        case 'float':
          if (typeof(constraintValue) !== 'number') {
            addValidationError(itemName, 'declares that it must equal a value that is not a number');
          }
          break;
        case 'boolean':
          if (typeof(constraintValue) !== 'boolean') {
            addValidationError(itemName, 'declares that it must equal a value that is not a boolean');
          }
          break;
        case 'datetime':
          if (!(constraintValue instanceof Date) && !isIso8601DateTimeString(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not a datetime');
          }
          break;
        case 'date':
          if (!(constraintValue instanceof Date) && !isIso8601DateString(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not a date');
          }
          break;
        case 'enum':
          if (itemValidatorDefinition.predefinedValues instanceof Array) {
            if (itemValidatorDefinition.predefinedValues.indexOf(constraintValue) < 0) {
              addValidationError(itemName, 'declares that it must equal a value that is not in the list of predefined values');
            }
          } else if (typeof(constraintValue) !== 'string' && !isInteger(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not a string or integer');
          }
          break;
        case 'attachmentReference':
          if (typeof(constraintValue) !== 'string') {
            addValidationError(itemName, 'declares that it must equal a value that is not a string');
          }
          break;
        case 'array':
          if (!(constraintValue instanceof Array)) {
            addValidationError(itemName, 'declares that it must equal a value that is not an array');
          }
          break;
        case 'object':
          if (!isAnObject(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not an object');
          }
          break;
        case 'hashtable':
          if (!isAnObject(constraintValue)) {
            addValidationError(itemName, 'declares that it must equal a value that is not an object');
          }
          break;
      }
    }
  }

  function validateCustomValidationConstraint(itemName, itemValidatorDefinition, constraintName, constraintValue) {
    if (typeof(constraintValue) !== 'function') {
      addValidationError(itemName, 'declares a value that is not a function');
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
      } else {
        addValidationError(itemName, 'includes an unsupported constraint: "' + itemConstraintName + '"');
      }
    }
  }

  function addValidationError(itemName, message) {
    validationErrors.push('the "propertyValidators" entry "' + itemName + '" ' + message);
  }

  function buildConstraints(itemConstraints) {
    var constraints = { };
    for (var itemConstraintName in itemConstraints) {
      constraints[itemConstraintName] = itemConstraints[itemConstraintName];
    }

    for (var universalConstraintName in universalConstraints) {
      constraints[universalConstraintName] = universalConstraints[universalConstraintName];
    }

    return constraints;
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
