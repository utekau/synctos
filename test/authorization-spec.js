var testHelper = require('../src/test-helper.js');

describe('Authorization:', function() {

  beforeEach(function() {
    testHelper.initSyncFunction('build/sync-functions/test-authorization-sync-function.js');
  });

  describe('for a document with explicit channel definitions', function() {
    it('rejects document creation for a user with no matching channels', function() {
      var doc = { _id: 'explicitChannelsDoc', stringProp: 'foobar' };

      testHelper.verifyAccessDenied(doc, undefined, 'add');
    });

    it('rejects document replacement for a user with no matching channels', function() {
      var doc = { _id: 'explicitChannelsDoc', stringProp: 'foobar' };
      var oldDoc = { _id: 'explicitChannelsDoc' };

      testHelper.verifyAccessDenied(doc, oldDoc, [ 'replace', 'update' ]);
    });

    it('rejects document deletion for a user with no matching channels', function() {
      var doc = { _id: 'explicitChannelsDoc', _deleted: true };

      testHelper.verifyAccessDenied(doc, undefined, [ 'remove', 'delete' ]);
    });
  });

  describe('for a document with only the write channels defined', function() {
    var writeChannels = [ 'edit', 'modify', 'write' ];

    it('rejects document creation for a user with no matching channels', function() {
      var doc = { _id: 'writeOnlyChannelsDoc', stringProp: 'foobar' };

      testHelper.verifyAccessDenied(doc, undefined, writeChannels);
    });

    it('rejects document replacement for a user with no matching channels', function() {
      var doc = { _id: 'writeOnlyChannelsDoc', stringProp: 'foobar' };
      var oldDoc = { _id: 'writeOnlyChannelsDoc' };

      testHelper.verifyAccessDenied(doc, oldDoc, writeChannels);
    });

    it('rejects document deletion for a user with no matching channels', function() {
      var doc = { _id: 'writeOnlyChannelsDoc', _deleted: true };

      testHelper.verifyAccessDenied(doc, undefined, writeChannels);
    });
  });

  describe('for a document with dynamically-assigned roles, channels and users', function() {
    var expectedWriteChannels = [ 'dynamicChannelsRolesAndUsersDoc-write' ];
    var expectedWriteRoles = [ 'write-role1', 'write-role2' ];
    var expectedWriteUsers = [ 'write-user1', 'write-user2' ];
    var expectedAuthorization = {
      expectedChannels: expectedWriteChannels,
      expectedRoles: expectedWriteRoles,
      expectedUsers: expectedWriteUsers
    };

    it('rejects document creation for a user with no matching channels, roles or users', function() {
      var doc = {
        _id: 'dynamicChannelsRolesAndUsersDoc',
        stringProp: 'foobar',
        roles: expectedWriteRoles,
        users: expectedWriteUsers
      };

      testHelper.verifyAccessDenied(doc, null, expectedAuthorization);
    });

    it('rejects document replacement for a user with no matching channels, roles or users', function() {
      var doc = {
        _id: 'dynamicChannelsRolesAndUsersDoc',
        stringProp: 'foobar'
      };
      var oldDoc = {
        _id: 'dynamicChannelsRolesAndUsersDoc',
        roles: expectedWriteRoles,
        users: expectedWriteUsers
      };

      testHelper.verifyAccessDenied(doc, oldDoc, expectedAuthorization);
    });

    it('rejects document deletion for a user with no matching channels, roles or users', function() {
      var doc = {
        _id: 'dynamicChannelsRolesAndUsersDoc',
        _deleted: true
      };
      var oldDoc = {
        _id: 'dynamicChannelsRolesAndUsersDoc',
        roles: expectedWriteRoles,
        users: expectedWriteUsers
      };

      testHelper.verifyAccessDenied(doc, oldDoc, expectedAuthorization);
    });
  });

  describe('for a document with statically-assigned roles and no channels', function() {
    it('rejects document creation for a user with no matching roles', function() {
      var doc = {
        _id: 'noChannelsAndStaticRolesDoc',
        stringProp: 'foobar'
      };

      testHelper.verifyAccessDenied(doc, null, { expectedRoles: [ 'add' ] });
    });

    it('rejects document replacement for a user with no matching roles', function() {
      var doc = {
        _id: 'noChannelsAndStaticRolesDoc',
        stringProp: 'foobar'
      };
      var oldDoc = {
        _id: 'noChannelsAndStaticRolesDoc'
      };

      testHelper.verifyAccessDenied(doc, oldDoc, { expectedRoles: [ 'replace' ] });
    });

    it('rejects document deletion for a user with no matching roles', function() {
      var doc = {
        _id: 'noChannelsAndStaticRolesDoc',
        _deleted: true
      };
      var oldDoc = {
        _id: 'noChannelsAndStaticRolesDoc'
      };

      testHelper.verifyAccessDenied(doc, oldDoc, { expectedRoles: [ 'remove' ] });
    });
  });

  describe('for a document with statically-assigned users and no channels', function() {
    it('rejects document creation for a user without a matching username', function() {
      var doc = {
        _id: 'noChannelsAndStaticUsersDoc',
        stringProp: 'foobar'
      };

      testHelper.verifyAccessDenied(doc, null, { expectedUsers: [ 'add1', 'add2' ] });
    });

    it('rejects document replacement for a user without a matching username', function() {
      var doc = {
        _id: 'noChannelsAndStaticUsersDoc',
        stringProp: 'foobar'
      };
      var oldDoc = {
        _id: 'noChannelsAndStaticUsersDoc'
      };

      testHelper.verifyAccessDenied(doc, oldDoc, { expectedUsers: [ 'replace1', 'replace2' ] });
    });

    it('rejects document deletion for a user without a matching username', function() {
      var doc = {
        _id: 'noChannelsAndStaticUsersDoc',
        _deleted: true
      };
      var oldDoc = {
        _id: 'noChannelsAndStaticUsersDoc'
      };

      testHelper.verifyAccessDenied(doc, oldDoc, { expectedUsers: [ 'remove1', 'remove2' ] });
    });
  });
});
