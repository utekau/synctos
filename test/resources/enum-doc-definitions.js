{
  enumDoc: {
    typeFilter: function(doc, oldDoc) {
      return doc._id === 'enumDoc';
    },
    channels: { write: 'write' },
    propertyValidators: {
      staticEnumProp: {
        type: 'enum',
        predefinedValues: [ 'value1', 2 ]
      },
      dynamicPredefinedValues: {
        type: 'array'
      },
      dynamicEnumProp: {
        type: 'enum',
        predefinedValues: function(doc, oldDoc, value, oldValue) {
          return doc.dynamicPredefinedValues;
        }
      }
    }
  }
}
