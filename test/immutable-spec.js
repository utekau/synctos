var expect = require('expect.js');
var simple = require('simple-mock');
var fs = require('fs');

// Load the contents of the sync function file into a global variable called syncFunction
eval('var syncFunction = ' + fs.readFileSync('build/resources/test-immutable-sync-function.js').toString());

// Placeholders for stubbing built-in Sync Gateway support functions.
// More info: http://developer.couchbase.com/mobile/develop/guides/sync-gateway/sync-function-api-guide/index.html
var requireAccess;
var channel;

describe('Immutable validation parameter', function() {
  beforeEach(function() {
    requireAccess = simple.stub();
    channel = simple.stub();
  });

  describe('array type validation', function() {
    it('can replace a document with an immutable array where the simple type elements have not changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9 ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9 ]
      };

      syncFunction(doc, oldDoc);

      verifyDocumentReplaced();
    });

    it('can replace a document with an immutable array where the nested complex type elements have not changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ [ 'foobar', 3, false ], [ 45.9 ], [ ], null, { foo: 'bar' } ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ [ 'foobar', 3, false ], [ 45.9 ], [ ], undefined, { foo: 'bar' } ]
      };

      syncFunction(doc, oldDoc);

      verifyDocumentReplaced();
    });

    it('can create a document with an immutable array where the old document does not exist', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ [ 'foobar', 3, false ], [ 45.9 ], [ ], { foo: 'bar' } ]
      };

      syncFunction(doc);

      verifyDocumentCreated();
    });

    it('can create a document with an immutable array where the old document was deleted', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ [ 'foobar', 3, false ], [ 45.9 ], [ ], { foo: 'bar' } ]
      };
      var oldDoc = { _id: 'immutableDoc', _deleted: true };

      syncFunction(doc, oldDoc);

      verifyDocumentCreated();
    });

    it('can delete a document with an immutable array', function() {
      var doc = { _id: 'immutableDoc', _deleted: true };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9 ]
      };

      syncFunction(doc, oldDoc);

      verifyDocumentDeleted();
    });

    it('cannot replace a document with an immutable array where the elements are not equal', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ null ] ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ] ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array where a nested object is not equal', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ], { foo: 'bar' } ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ], { bar: 'baz' } ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array where one is a subset of the other', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, { } ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, { }, [ ] ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array where nested complex type elements are not the same type', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, { } ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ] ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array where the element order has changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ [ ], 'foobar', 3, false, 45.9 ]
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ] ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array when it is missing in the new document', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: null
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ] ]
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable array when it is missing in the old document', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableArrayProp: [ 'foobar', 3, false, 45.9, [ ] ]
      };
      var oldDoc = { _id: 'immutableDoc' };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableArrayProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });
  });

  describe('object type validation', function() {
    it('can replace a document with an immutable object where the simple type properties have not changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myIntegerProp: 8,
          myBooleanProp: true,
          myFloatProp: 88.92
        }
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myIntegerProp: 8,
          myBooleanProp: true,
          myFloatProp: 88.92
        }
      };

      syncFunction(doc, oldDoc);

      verifyDocumentReplaced();
    });

    it('can replace a document with an immutable object where the nested complex type elements have not changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ null ], { } ],
          myObjectProp: { foo: 'bar', baz: 73, qux: [ ] }
        }
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ null ], { } ],
          myObjectProp: { foo: 'bar', baz: 73, qux: [ ] }
        }
      };

      syncFunction(doc, oldDoc);

      verifyDocumentReplaced();
    });

    it('can replace a document with an immutable object where the property order has changed', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myIntegerProp: 8,
          myStringProp: 'foobar'
        }
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myIntegerProp: 8
        }
      };

      syncFunction(doc, oldDoc);

      verifyDocumentReplaced();
    });

    it('can create a document with an immutable object where the old document does not exist', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ null ] ],
          myObjectProp: { foo: 'bar', baz: 73 }
        }
      };

      syncFunction(doc);

      verifyDocumentCreated();
    });

    it('can create a document with an immutable object where the old document was deleted', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ null ] ],
          myObjectProp: { foo: 'bar', baz: 73 }
        }
      };
      var oldDoc = { _id: 'immutableDoc', _deleted: true };

      syncFunction(doc, oldDoc);

      verifyDocumentCreated();
    });

    it('can delete a document with an immutable object', function() {
      var doc = { _id: 'immutableDoc', _deleted: true };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ null ] ],
          myObjectProp: { foo: 'bar', baz: 73 }
        }
      };

      syncFunction(doc, oldDoc);

      verifyDocumentDeleted();
    });

    it('cannot replace a document with an immutable object when the properties are not equal', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ { foo: 'bar' } ] ],
          myObjectProp: { foo: 'bar', baz: 73 }
        }
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myArrayProp: [ 'foobar', 3, false, 45.9, [ { } ] ],
          myObjectProp: { foo: 'bar', baz: 73 }
        }
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableObjectProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable object when a property is missing', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myBooleanProp: true,
          myFloatProp: 88.92
        }
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myIntegerProp: 8,
          myBooleanProp: true,
          myFloatProp: 88.92
        }
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableObjectProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable object when it is missing in the new document', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: null
      };
      var oldDoc = {
        _id: 'immutableDoc',
        immutableObjectProp: {
          myStringProp: 'foobar',
          myBooleanProp: true,
          myFloatProp: 88.92
        }
      };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableObjectProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });

    it('cannot replace a document with an immutable object when it is missing in the old document', function() {
      var doc = {
        _id: 'immutableDoc',
        immutableObjectProp: { }
      };
      var oldDoc = { _id: 'immutableDoc' };

      expect(syncFunction).withArgs(doc, oldDoc).to.throwException(function(ex) {
        expect(ex.forbidden).to.contain('Invalid immutableDoc document');
        expect(ex.forbidden).to.contain('value of item "immutableObjectProp" may not be modified');
        expect(numberOfValidationErrors(ex.forbidden)).to.be(1);
      });

      verifyDocumentWriteDenied();
    });
  });
});

function verifyDocumentWriteAccepted(expectedChannel) {
  expect(requireAccess.callCount).to.equal(1);
  expect(requireAccess.calls[0].arg).to.contain(expectedChannel);

  expect(channel.callCount).to.equal(1);
  expect(channel.calls[0].arg).to.contain(expectedChannel);
}

function verifyDocumentCreated() {
  verifyDocumentWriteAccepted('add');
}

function verifyDocumentReplaced() {
  verifyDocumentWriteAccepted('replace');
}

function verifyDocumentDeleted() {
  verifyDocumentWriteAccepted('remove');
}

function verifyDocumentWriteDenied() {
  expect(requireAccess.callCount).to.equal(1);
  expect(channel.callCount).to.equal(0);
}

function numberOfValidationErrors(message) {
  return message.split(';').length;
}
