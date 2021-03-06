var expect = require('expect.js');
var testHelper = require('../src/test-helper.js');
var errorFormatter = testHelper.validationErrorFormatter;

describe('Test helper module initialization', function() {
  describe('when initialized from a generated sync function file', function() {
    it('loads the sync function successfully for a valid path', function() {
      testHelper.initSyncFunction('build/sync-functions/test-init-sync-function.js');

      var doc = {
        _id: 'foobar',
        type: 'initDoc',
        testProp: 174.6
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('fails to load the sync function for a file that does not exist', function() {
      expect(testHelper.initSyncFunction).withArgs('build/sync-functions/test-nonexistant-sync-function.js').to.throwException(function(ex) {
        expect(ex.code).to.eql('ENOENT');
      });
    });
  });

  describe('when initialized from a document definitions file', function() {
    it('loads the sync function successfully for a valid path', function() {
      testHelper.initDocumentDefinitions('test/resources/init-doc-definitions.js');

      var doc = {
        _id: 'barfoo',
        type: 'initDoc',
        testProp: -97.99
      };

      testHelper.verifyDocumentCreated(doc);
    });

    it('fails to load the sync function for a file that does not exist', function() {
      expect(testHelper.initDocumentDefinitions).withArgs('test/resources/nonexistant-doc-definitions.js').to.throwException(function(ex) {
        expect(ex.code).to.eql('ENOENT');
      });
    });
  });
});
