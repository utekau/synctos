{
  explicitChannelsDoc: {
    channels: {
      view: 'view',
      add: 'add',
      replace: [ 'replace', 'update' ],
      remove: [ 'remove', 'delete' ]
    },
    typeFilter: function(doc) {
      return doc._id === 'explicitChannelsDoc';
    },
    propertyValidators: {
      stringProp: {
        type: 'string'
      }
    }
  },
  writeOnlyChannelsDoc: {
    channels: {
      write: [ 'edit', 'modify', 'write' ]
    },
    typeFilter: function(doc) {
      return doc._id === 'writeOnlyChannelsDoc';
    },
    propertyValidators: {
      stringProp: {
        type: 'string'
      }
    }
  },
  dynamicChannelsRolesAndUsersDoc: {
    typeFilter: function(doc) {
      return doc._id === 'dynamicChannelsRolesAndUsersDoc';
    },
    channels: function(doc, oldDoc) {
      return {
        view: doc._id + '-view',
        write: doc._id + '-write'
      };
    },
    authorizedRoles: function(doc, oldDoc) {
      return { write: oldDoc ? oldDoc.roles : doc.roles };
    },
    authorizedUsers: function(doc, oldDoc) {
      return { write: oldDoc ? oldDoc.users : doc.users };
    },
    propertyValidators: {
      stringProp: {
        type: 'string'
      },
      roles: {
        type: 'array'
      },
      users: {
        type: 'array'
      }
    }
  },
  noChannelsAndStaticRolesDoc: {
    typeFilter: function(doc) {
      return doc._id === 'noChannelsAndStaticRolesDoc';
    },
    authorizedRoles: {
      add: 'add',
      replace: 'replace',
      remove: 'remove'
    },
    propertyValidators: {
      stringProp: {
        type: 'string'
      }
    }
  },
  noChannelsAndStaticUsersDoc: {
    typeFilter: function(doc) {
      return doc._id === 'noChannelsAndStaticUsersDoc';
    },
    authorizedUsers: {
      add: [ 'add1', 'add2' ],
      replace: [ 'replace1', 'replace2' ],
      remove: [ 'remove1', 'remove2' ]
    },
    propertyValidators: {
      stringProp: {
        type: 'string'
      }
    }
  }
}
