var testHelper = require('../src/test-helper.js');
var errorFormatter = testHelper.validationErrorFormatter;

describe('Non-null value constraint', function() {
  beforeEach(function() {
    testHelper.initSyncFunction('build/sync-functions/test-must-not-be-null-sync-function.js');
  });

  describe('with static validation', function() {
    it('allows a doc with values that are neither null nor undefined', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: '',
        integerProp: 0,
        floatProp: 0.0,
        booleanProp: false,
        datetimeProp: '1970-01-01T00:00:00.000Z',
        dateProp: '1970-01-01',
        enumProp: 0,
        attachmentReferenceProp: '',
        arrayProp: [ '' ],
        objectProp: { subProp: 0 },
        hashtableProp: { 'key': 0.0 }
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with top-level values that are undefined', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: undefined,
        integerProp: undefined,
        floatProp: undefined,
        booleanProp: undefined,
        datetimeProp: undefined,
        dateProp: undefined,
        enumProp: undefined,
        attachmentReferenceProp: undefined,
        arrayProp: undefined,
        objectProp: undefined,
        hashtableProp: undefined,
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with nested values that are undefined', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ undefined ],
        objectProp: { subProp: undefined },
        hashtableProp: { 'key': undefined },
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with top-level values that are missing', function() {
      var doc = { _id: 'staticDoc' };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with nested object property values that are missing', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ ],
        objectProp: { },
        hashtableProp: { },
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('blocks a doc with top-level values that are null', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: null,
        integerProp: null,
        floatProp: null,
        booleanProp: null,
        datetimeProp: null,
        dateProp: null,
        enumProp: null,
        attachmentReferenceProp: null,
        arrayProp: null,
        objectProp: null,
        hashtableProp: null,
      };

      testHelper.verifyDocumentNotCreated(
        doc,
        'staticDoc',
        [
          errorFormatter.mustNotBeNullValueViolation('hashtableProp'),
          errorFormatter.mustNotBeNullValueViolation('objectProp'),
          errorFormatter.mustNotBeNullValueViolation('arrayProp'),
          errorFormatter.mustNotBeNullValueViolation('attachmentReferenceProp'),
          errorFormatter.mustNotBeNullValueViolation('enumProp'),
          errorFormatter.mustNotBeNullValueViolation('dateProp'),
          errorFormatter.mustNotBeNullValueViolation('datetimeProp'),
          errorFormatter.mustNotBeNullValueViolation('booleanProp'),
          errorFormatter.mustNotBeNullValueViolation('floatProp'),
          errorFormatter.mustNotBeNullValueViolation('integerProp'),
          errorFormatter.mustNotBeNullValueViolation('stringProp')
        ]);
    });

    it('blocks a doc with nested values that are null', function() {
      var doc = {
        _id: 'staticDoc',
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ null ],
        objectProp: { subProp: null },
        hashtableProp: { 'key': null },
      };

      testHelper.verifyDocumentNotCreated(
        doc,
        'staticDoc',
        [
          errorFormatter.mustNotBeNullValueViolation('arrayProp[0]'),
          errorFormatter.mustNotBeNullValueViolation('objectProp.subProp'),
          errorFormatter.mustNotBeNullValueViolation('hashtableProp[key]')
        ]);
    });
  });

  describe('with dynamic validation', function() {
    it('allows a doc with values that are neither null nor undefined', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: '',
        integerProp: 0,
        floatProp: 0.0,
        booleanProp: false,
        datetimeProp: '1970-01-01T00:00:00.000Z',
        dateProp: '1970-01-01',
        enumProp: 0,
        attachmentReferenceProp: '',
        arrayProp: [ '' ],
        objectProp: { subProp: 0 },
        hashtableProp: { 'key': 0.0 }
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with top-level values that are either null or undefined if enforcement is disabled', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: false,
        stringProp: null,
        integerProp: undefined,
        floatProp: null,
        booleanProp: undefined,
        datetimeProp: null,
        dateProp: undefined,
        enumProp: null,
        attachmentReferenceProp: undefined,
        arrayProp: null,
        objectProp: undefined,
        hashtableProp: null
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with nested values that are either null or undefined if enforcement is disabled', function() {
      var doc = {
        _id: 'dynamicDoc',
        arrayProp: [ null ],
        objectProp: { subProp: undefined },
        hashtableProp: { 'key': null }
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with top-level values that are undefined', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: undefined,
        integerProp: undefined,
        floatProp: undefined,
        booleanProp: undefined,
        datetimeProp: undefined,
        dateProp: undefined,
        enumProp: undefined,
        attachmentReferenceProp: undefined,
        arrayProp: undefined,
        objectProp: undefined,
        hashtableProp: undefined,
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with nested values that are undefined', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ undefined ],
        objectProp: { subProp: undefined },
        hashtableProp: { 'key': undefined },
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with top-level values that are missing', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('allows a doc with nested object property values that are missing', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ ],
        objectProp: { },
        hashtableProp: { },
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('blocks a doc with top-level values that are null', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: null,
        integerProp: null,
        floatProp: null,
        booleanProp: null,
        datetimeProp: null,
        dateProp: null,
        enumProp: null,
        attachmentReferenceProp: null,
        arrayProp: null,
        objectProp: null,
        hashtableProp: null,
      };

      testHelper.verifyDocumentNotCreated(
        doc,
        'dynamicDoc',
        [
          errorFormatter.mustNotBeNullValueViolation('hashtableProp'),
          errorFormatter.mustNotBeNullValueViolation('objectProp'),
          errorFormatter.mustNotBeNullValueViolation('arrayProp'),
          errorFormatter.mustNotBeNullValueViolation('attachmentReferenceProp'),
          errorFormatter.mustNotBeNullValueViolation('enumProp'),
          errorFormatter.mustNotBeNullValueViolation('dateProp'),
          errorFormatter.mustNotBeNullValueViolation('datetimeProp'),
          errorFormatter.mustNotBeNullValueViolation('booleanProp'),
          errorFormatter.mustNotBeNullValueViolation('floatProp'),
          errorFormatter.mustNotBeNullValueViolation('integerProp'),
          errorFormatter.mustNotBeNullValueViolation('stringProp')
        ]);
    });

    it('blocks a doc with nested values that are null', function() {
      var doc = {
        _id: 'dynamicDoc',
        dynamicPropsRequired: true,
        stringProp: 'foobar',
        integerProp: -45,
        floatProp: 5.19,
        booleanProp: true,
        datetimeProp: '2017-04-10T16:10:39.773-0700',
        dateProp: '2017-04-10',
        enumProp: 2,
        attachmentReferenceProp: 'barfoo.baz',
        arrayProp: [ null ],
        objectProp: { subProp: null },
        hashtableProp: { 'key': null },
      };

      testHelper.verifyDocumentNotCreated(
        doc,
        'dynamicDoc',
        [
          errorFormatter.mustNotBeNullValueViolation('arrayProp[0]'),
          errorFormatter.mustNotBeNullValueViolation('objectProp.subProp'),
          errorFormatter.mustNotBeNullValueViolation('hashtableProp[key]')
        ]);
    });
  });
});
