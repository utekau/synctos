# Introduction

[![Build Status](https://travis-ci.org/Kashoo/synctos.svg?branch=master)](https://travis-ci.org/Kashoo/synctos) [![npm version](https://badge.fury.io/js/synctos.svg)](https://badge.fury.io/js/synctos) [![dependencies Status](https://david-dm.org/Kashoo/synctos/master/status.svg)](https://david-dm.org/Kashoo/synctos/master) [![devDependencies Status](https://david-dm.org/Kashoo/synctos/master/dev-status.svg)](https://david-dm.org/Kashoo/synctos/master?type=dev)

Synctos: The Syncmaker. A utility to aid with the process of designing well-structured sync functions for Couchbase Sync Gateway.

With this utility, you define all your JSON document types in a declarative JavaScript object format that eliminates much of the boilerplate normally required for [sync functions](http://developer.couchbase.com/documentation/mobile/current/develop/guides/sync-gateway/sync-function-api-guide/index.html) with comprehensive validation of document contents and permissions. Not only is it invaluable in protecting the integrity of the documents that are stored in a Sync Gateway database, whenever a document fails validation, sync functions generated with synctos return specific, detailed error messages that make it easy for a client app developer to figure out exactly what went wrong. An included test helper module also provides a simple framework to write unit tests for generated sync functions.

To learn more about Sync Gateway, check out [Couchbase](http://www.couchbase.com/)'s comprehensive [developer documentation](http://developer.couchbase.com/documentation/mobile/current/guides/sync-gateway/index.html). And, for a comprehensive introduction to synctos, see the post [Validating your Sync Gateway documents with synctos](https://blog.couchbase.com/validating-your-sync-gateway-documents-with-synctos/) on the official Couchbase blog.

# Installation

Synctos is distributed as an [npm](https://www.npmjs.com/) package and has several npm development dependencies. As such, it requires that [Node.js](https://nodejs.org/) is installed in order to run.

To add synctos to your project, run `npm install synctos` from the project's root directory to install the package locally. Or, better yet, if you define a package.json file in your project, you can run `npm install synctos --savedev` to automatically install locally and insert the package into your package.json's developer dependencies.

For more info on npm package management, see the official npm documentation for [Installing npm packages locally](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) and [Using a \`package.json\`](https://docs.npmjs.com/getting-started/using-a-package.json).

# Usage

### Running

Once synctos is installed, you can run it from your project's directory as follows:

    node_modules/synctos/make-sync-function /path/to/my-document-definitions.js /path/to/my-generated-sync-function.js

This will take the sync document definitions that are defined in `/path/to/my-document-definitions.js` and build a new sync function that is output to `/path/to/my-generated-sync-function.js`. The generated sync function contents can then be inserted into the definition of a bucket/database in a Sync Gateway [configuration file](http://developer.couchbase.com/documentation/mobile/current/guides/sync-gateway/config-properties/index.html#configuration-files) as a multi-line string surrounded with backquotes/backticks ( \` ).

Generated sync functions are compatible with all Sync Gateway 1.x versions.

**NOTE**: Due to a [known issue](https://github.com/couchbase/sync_gateway/issues/1866) in Sync Gateway versions up to and including 1.2.1, when specifying a bucket/database's sync function in a configuration file as a multi-line string, you will have to be sure to escape any literal backslash characters in the sync function body. For example, if your sync function contains a regular expression like `new RegExp('\\w+')`, you will have to escape the backslashes when inserting the sync function into the configuration file so that it becomes `new RegExp('\\\\w+')`. The issue has been resolved in Sync Gateway version 1.3.0 and later.

### Specifications

Document definitions must conform to the following specification. See the `samples/` directory for some example definitions.

At the top level, the document definitions object contains a property for each document type that is to be supported by the Sync Gateway bucket. For example:

    {
      myDocType1: {
        channels: ...,
        typeFilter: ...,
        propertyValidators: ...
      },
      myDocType2: {
        channels: ...,
        typeFilter: ...,
        propertyValidators: ...
      }
    }

#### Document type definitions

Each document type is defined as an object with a number of properties that control authorization, content validation and access control.

##### Essential document properties:

The following properties include the basics necessary to build a document definition:

* `typeFilter`: (required) A function that is used to identify documents of this type. It accepts as function parameters (1) the new document, (2) the old document that is being replaced (if any) and (3) the name of the current document type. For the sake of convenience, a simple type filter function (`simpleTypeFilter`) is available that attempts to match the document's `type` property value to the document type's name (e.g. if a document definition is named "message", then a candidate document's `type` property value must be "message" to be considered a document of that type); if the document definition does not include an explicit `type` property validator, then, for convenience, the `type` property will be implicitly included in the document definition and validated with the built in `typeIdValidator` (see the validator's description for more info). NOTE: In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, so be sure to account for such cases. And, if the old document has been deleted or simply does not exist, the second parameter will be `null`.

An example of the simple type filter:

```
typeFilter: simpleTypeFilter
```

And an example of a more complex custom type filter:

```
typeFilter: function(doc, oldDoc, currentDocType) {
  var typePropertyMatches;
  if (oldDoc) {
    if (doc._deleted) {
      typePropertyMatches = oldDoc.type === currentDocType;
    } else {
      typePropertyMatches = doc.type === oldDoc.type && oldDoc.type === currentDocType;
    }
  } else {
    // The old document does not exist or was deleted - we can rely on the new document's type
    typePropertyMatches = doc.type === currentDocType;
  }

  if (typePropertyMatches) {
    return true;
  } else {
    // The type property did not match - fall back to matching the document ID pattern
    var docIdRegex = /^message\.[A-Za-z0-9_-]+$/;

    return docIdRegex.test(doc._id);
  }
}
```

* `channels`: (required if `authorizedRoles` and `authorizedUsers` are undefined - see the [Advanced document properties](#advanced-document-properties) section for more info) The [channels](http://developer.couchbase.com/documentation/mobile/current/develop/guides/sync-gateway/channels/index.html) to assign to documents of this type. If used in combination with the `authorizedRoles` and/or `authorizedUsers` properties, authorization will be granted if the user making the modification matches at least one of the channels and/or authorized roles/usernames for the corresponding operation type (add, replace or remove). May be specified as either a plain object or a function that returns a dynamically-constructed object and accepts as parameters (1) the new document and (2) the old document that is being replaced (if any). NOTE: In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, and if the old document has been deleted or simply does not exist, the second parameter will be `null`. Either way the object is specified, it may include the following properties, each of which may be either an array of channel names or a single channel name as a string:
  * `view`: (optional) The channel(s) that confer read-only access to documents of this type.
  * `add`: (required if `write` is undefined) The channel(s) that confer the ability to create new documents of this type. Any user with a matching channel also gains implicit read access.
  * `replace`: (required if `write` is undefined) The channel(s) that confer the ability to replace existing documents of this type. Any user with a matching channel also gains implicit read access.
  * `remove`: (required if `write` is undefined) The channel(s) that confer the ability to delete documents of this type. Any user with a matching channel also gains implicit read access.
  * `write`: (required if one or more of `add`, `replace` or `remove` are undefined) The channel(s) that confer the ability to add, replace or remove documents of this type. Exists as a convenience in cases where the add, replace and remove operations should share the same channel(s). Any user with a matching channel also gains implicit read access.

For example:

```
channels: {
  add: [ 'create', 'new' ],
  replace: 'update',
  remove: 'delete'
}
```

Or:

```
channels: function(doc, oldDoc) {
  return {
    view: doc._id + '-readonly',
    write: [ doc._id + '-edit', doc._id + '-admin' ]
  };
}
```

* `propertyValidators`: (required) An object/hash of validators that specify the format of each of the document type's supported properties. Each entry consists of a key that specifies the property name and a value that specifies the validation to perform on that property. Each property element must declare a type and, optionally, some number of additional parameters. Any property that is not declared here will be rejected by the sync function unless the `allowUnknownProperties` field is set to `true`. In addition to a static value (e.g. `propertyValidators: { ... }`), this property may also be assigned a value dynamically via a function (e.g. `propertyValidators: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist).

An example static definition:

```
propertyValidators: {
  myProp1: {
    type: 'boolean',
    required: true
  },
  myProp2: {
    type: 'array',
    mustNotBeEmpty: true
  }
}
```

And a dynamic definition:

```
propertyValidators: function(doc, oldDoc) {
  var dynamicProp = (doc._id.indexOf('foobar') >= 0) ? { type: 'string' } : { type: 'float' }

  return {
    myDynamicProp: dynamicProp
  };
}
```

##### Advanced document properties:

Additional properties that provide finer grained control over documents:

* `allowUnknownProperties`: (optional) Whether to allow the existence of properties that are not explicitly declared in the document type definition. Not applied recursively to objects that are nested within documents of this type. In addition to a static value (e.g. `allowUnknownProperties: true`), this property may also be assigned a value dynamically via a function (e.g. `allowUnknownProperties: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false`.
* `immutable`: (optional) The document cannot be replaced or deleted after it is created. Note that, when this property is enabled, even if attachments are allowed for this document type (see the `allowAttachments` parameter for more info), it will not be possible to create, modify or delete attachments in a document that already exists, which means that they must be created inline in the document's `_attachments` property when the document is first created. In addition to a static value (e.g. `immutable: true`), this property may also be assigned a value dynamically via a function (e.g. `immutable: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false`.
* `cannotReplace`: (optional) As with the `immutable` constraint, the document cannot be replaced after it is created. However, this constraint does not prevent the document from being deleted. Note that, even if attachments are allowed for this document type (see the `allowAttachments` parameter for more info), it will not be possible to create, modify or delete attachments in a document that already exists, which means that they must be created inline in the document's `_attachments` property when the document is first created. In addition to a static value (e.g. `cannotReplace: true`), this property may also be assigned a value dynamically via a function (e.g. `cannotReplace: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false`.
* `cannotDelete`: (optional) As with the `immutable` constraint, the document cannot be deleted after it is created. However, this constraint does not prevent the document from being replaced. In addition to a static value (e.g. `cannotDelete: true`), this property may also be assigned a value dynamically via a function (e.g. `cannotDelete: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false`.
* `authorizedRoles`: (required if `channels` and `authorizedUsers` are undefined) The [roles](http://developer.couchbase.com/documentation/mobile/current/guides/sync-gateway/authorizing-users/index.html#roles) that are authorized to add, replace and remove documents of this type. If used in combination with the `channels` and/or `authorizedUsers` properties, authorization will be granted if the user making the modification matches at least one of the roles and/or authorized channels/usernames for the corresponding operation type (add, replace or remove). May be specified as either a plain object or a function that returns a dynamically-constructed object and accepts as parameters (1) the new document and (2) the old document that is being replaced (if any). NOTE: In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, and if the old document has been deleted or simply does not exist, the second parameter will be `null`. Either way the object is specified, it may include the following properties, each of which may be either an array of role names or a single role name as a string:
  * `add`: (optional) The role(s) that confer the ability to create new documents of this type.
  * `replace`: (optional) The role(s) that confer the ability to replace existing documents of this type.
  * `remove`: (optional) The role(s) that confer the ability to delete documents of this type.
  * `write`: (optional) The role(s) that confer the ability to add, replace or remove documents of this type. Exists as a convenience in cases where the add, replace and remove operations should share the same role(s).

For example:

```
    authorizedRoles: {
      add: 'manager',
      replace: [ 'manager', 'employee' ],
      remove: 'manager'
    }
```

Or:

```
    authorizedRoles: function(doc, oldDoc) {
      return {
        write: oldDoc ? oldDoc.roles : doc.roles
      };
    }
```

* `authorizedUsers`: (required if `channels` and `authorizedRoles` are undefined) The names of [users](http://developer.couchbase.com/documentation/mobile/current/guides/sync-gateway/authorizing-users/index.html#authorizing-users) that are explicitly authorized to add, replace and remove documents of this type. If used in combination with the `channels` and/or `authorizedRoles` properties, authorization will be granted if the user making the modification matches at least one of the usernames and/or authorized channels/roles for the corresponding operation type (add, replace or remove). May be specified as either a plain object or a function that returns a dynamically-constructed object and accepts as parameters (1) the new document and (2) the old document that is being replaced (if any). NOTE: In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, and if the old document has been deleted or simply does not exist, the second parameter will be `null`. Either way the object is specified, it may include the following properties, each of which may be either an array of usernames or a single username as a string:
  * `add`: (optional) The user(s) that have the ability to create new documents of this type.
  * `replace`: (optional) The user(s) that have the ability to replace existing documents of this type.
  * `remove`: (optional) The user(s) that have the ability to delete documents of this type.
  * `write`: (optional) The user(s) that have the ability to add, replace or remove documents of this type. Exists as a convenience in cases where the add, replace and remove operations should share the same user(s).

For example:

```
    authorizedUsers: {
      add: [ 'sally', 'roger', 'samantha' ],
      replace: [ 'roger', 'samantha' ],
      remove: 'samantha'
    }
```

Or:

```
    authorizedUsers: function(doc, oldDoc) {
      return {
        write: oldDoc ? oldDoc.users : doc.users
      };
    }
```

* `accessAssignments`: (optional) Defines either the channel access to assign to users/roles or the role access to assign to users when a document of the corresponding type is successfully created, replaced or deleted. It is specified as a list, where each entry is an object that defines `users`, `roles` and/or `channels` properties, depending on the access assignment type. The value of each property can be either a list of strings that specify the raw user/role/channel names or a function that returns the corresponding values as a dynamically-constructed list and accepts the following parameters: (1) the new document and (2) the old document that is being replaced/deleted (if any). NOTE: In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, so be sure to account for such cases. And, if the old document has been deleted or simply does not exist, the second parameter will be `null`. The assignment types are specified as follows:
  * Channel access assignments:
    * `type`: May be either "channel", `null` or `undefined`.
    * `channels`: The channels to assign to users and/or roles.
    * `roles`: The roles to which to assign the channels.
    * `users`: The users to which to assign the channels.
  * Role access assignments:
    * `type`: Must be "role".
    * `roles`: The roles to assign to users.
    * `users`: The users to which to assign the roles.

An example of a mix of channel and role access assignments:

```
    accessAssignments: [
      {
        type: 'role',
        users: [ 'user3', 'user4' ],
        roles: [ 'role1', 'role2' ]
      },
      {
        type: 'channel',
        users: [ 'user1', 'user2' ],
        channels: [ 'channel1' ]
      },
      {
        type: 'channel',
        users: function(doc, oldDoc) {
          return doc.users;
        },
        roles: function(doc, oldDoc) {
          return doc.roles;
        },
        channels: function(doc, oldDoc) {
          return [ doc._id + '-channel3', doc._id + '-channel4' ];
        }
      },
    ]
```

* `allowAttachments`: (optional) Whether to allow the addition of [file attachments](http://developer.couchbase.com/documentation/mobile/current/references/sync-gateway/rest-api/index.html#!/attachment/put_db_doc_attachment) for the document type. In addition to a static value (e.g. `allowAttachments: true`), this property may also be assigned a value dynamically via a function (e.g. `allowAttachments: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false` to prevent malicious/misbehaving clients from polluting the bucket/database with unwanted files. See the `attachmentConstraints` property and the `attachmentReference` validation type for more options.
* `attachmentConstraints`: (optional) Various constraints to apply to file attachments associated with a document type. Its settings only apply if the document definition's `allowAttachments` property is `true`. In addition to a static value (e.g. `attachmentConstraints: { }`), this property may also be assigned a value dynamically via a function (e.g. `attachmentConstraints: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Additional parameters:
  * `maximumAttachmentCount`: (optional) The maximum number of attachments that may be assigned to a single document of this type. In addition to a static value (e.g. `maximumAttachmentCount: 2`), this property may also be assigned a value dynamically via a function (e.g. `maximumAttachmentCount: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Unlimited by default.
  * `maximumIndividualSize`: (optional) The maximum file size, in bytes, allowed for any single attachment assigned to a document of this type. May not be greater than 20MB (20,971,520 bytes), as Couchbase Server/Sync Gateway sets that as the hard limit per document or attachment. In addition to a static value (e.g. `maximumIndividualSize: 256`), this property may also be assigned a value dynamically via a function (e.g. `maximumIndividualSize: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Unlimited by default.
  * `maximumTotalSize`: (optional) The maximum total size, in bytes, of _all_ attachments assigned to a single document of this type. In other words, when the sizes of all of a document's attachments are added together, it must not exceed this value. In addition to a static value (e.g. `maximumTotalSize: 1024`), this property may also be assigned a value dynamically via a function (e.g. `maximumTotalSize: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Unlimited by default.
  * `supportedExtensions`: (optional) An array of case-insensitive file extensions that are allowed for an attachment's filename (e.g. "txt", "jpg", "pdf"). In addition to a static value (e.g. `supportedExtensions: [ 'png', 'gif', 'jpg' ]`), this property may also be assigned a value dynamically via a function (e.g. `supportedExtensions: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). No restriction by default.
  * `supportedContentTypes`: (optional) An array of content/MIME types that are allowed for an attachment's contents (e.g. "image/png", "text/html", "application/xml"). In addition to a static value (e.g. `supportedContentTypes: [ 'image/png', 'image/gif', 'image/jpeg' ]`), this property may also be assigned a value dynamically via a function (e.g. `supportedContentTypes: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). No restriction by default.
  * `requireAttachmentReferences`: (optional) Whether every one of a document's attachments must have a corresponding `attachmentReference`-type property referencing it. In addition to a static value (e.g. `requireAttachmentReferences: true`), this property may also be assigned a value dynamically via a function (e.g. `requireAttachmentReferences: function(doc, oldDoc) { ... }`) where the parameters are as follows: (1) the document (if deleted, the `_deleted` property will be `true`) and (2) the document that is being replaced (if any; it will be `null` if it has been deleted or does not exist). Defaults to `false`.
* `customActions`: (optional) Defines custom actions to be executed at various events during the generated sync function's execution. Specified as an object where each property specifies a JavaScript function to be executed when the corresponding event is completed. In each case, the function accepts as parameters (1) the new document, (2) the old document that is being replaced/deleted (if any) and (3) an object that is populated with metadata generated by each event. In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, so be sure to account for such cases. If the document does not yet exist, the second parameter will be null or undefined and, in some cases where the document previously existed (i.e. it was deleted), the second parameter _may_ be non-null and its `_deleted` property will be `true`. At each stage of the generated sync function's execution, the third parameter (the custom action metadata parameter) is augmented with properties that provide additional context to the custom action being executed. Custom actions may call functions from the [standard sync function API](http://developer.couchbase.com/documentation/mobile/current/guides/sync-gateway/sync-function-api-guide/index.html) (e.g. `requireAccess`, `requireRole`, `requireUser`, `access`, `role`, `channel`) and may indicate errors via the `throw` statement to prevent the document from being written. The custom actions that are available, in the order their corresponding events occur:
  1. `onTypeIdentificationSucceeded`: Executed immediately after the document's type is determined and before checking authorization. The custom action metadata object parameter contains the following properties:
    * `documentTypeId`: The unique ID of the document type.
    * `documentDefinition`: The full definition of the document type.
  2. `onAuthorizationSucceeded`: Executed immediately after the user is authorized to make the modification and before validating document contents. Not executed if user authorization is denied. The custom action metadata object parameter includes properties from all previous events in addition to the following properties:
    * `authorization`: An object that indicates which channels, roles and users were used to authorize the current operation, as specified by the `channels`, `roles` and `users` list properties.
  3. `onValidationSucceeded`: Executed immediately after the document's contents are validated and before channels are assigned to users/roles and the document. Not executed if the document's contents are invalid. The custom action metadata object parameter includes properties from all previous events but does not include any additional properties.
  4. `onAccessAssignmentsSucceeded`: Executed immediately after channel access is assigned to users/roles and before channels are assigned to the document. Not executed if the document definition does not include an `accessAssignments` property. The custom action metadata object parameter includes properties from all previous events in addition to the following properties:
    * `accessAssignments`: A list that contains each of the access assignments that were applied. Each element is an object that represents either a channel access assignment or a role access assignment depending on the value of its `type` property. The assignment types are specified as follows:
      * Channel access assignments:
        * `type`: Value of "channel".
        * `channels`: A list of channels that were assigned to the users/roles.
        * `usersAndRoles`: A list of the combined users and/or roles to which the channels were assigned. Note that, as per the sync function API, each role element's value is prefixed with "role:".
      * Role access assignments:
        * `type`: Value of "role".
        * `roles`: A list of roles that were assigned to the users.
        * `users`: A list of users to which the roles were assigned. Note that, as per the sync function API, each role element's value is prefixed with "role:".
  5. `onDocumentChannelAssignmentSucceeded`: Executed immediately after channels are assigned to the document. The last step before the sync function is finished executing and the document revision is written. The custom action metadata object parameter includes properties from all previous events in addition to the following properties:
    * `documentChannels`: A list of channels that were assigned to the document.

An example of an `onAuthorizationSucceeded` custom action that stores a property in the metadata object parameter for later use by the `onDocumentChannelAssignmentSucceeded` custom action:

```
    customActions: {
      onAuthorizationSucceeded: function(doc, oldDoc, customActionMetadata) {
        var extraChannel = customActionMetadata.documentTypeId + '-modify';
        if (oldDoc && !oldDoc._deleted) {
          // If the document is being replaced or deleted, ensure the user has the document type's "-modify" channel in addition to one of
          // the channels from the document definition's "channels" property that was already authorized
          requireAccess(extraChannel);
        }

        // Store the extra modification validation channel name for future use
        customActionMetadata.extraModifyChannel = extraChannel;
      },
      onDocumentChannelAssignmentSucceeded: function(doc, oldDoc, customActionMetadata) {
        // Ensure the extra modification validation channel is also assigned to the document
        channel(customActionMetadata.extraModifyChannel);
      }
    }
```

#### Content validation

There are a number of validation types that can be used to define each property/element/key's expected format in a document.

##### Simple type validation:

Validation for simple data types (e.g. integers, floating point numbers, strings, dates/times, etc.):

* `string`: The value is a string of characters. Additional parameters:
  * `mustNotBeEmpty`: If `true`, an empty string is not allowed. Defaults to `false`.
  * `regexPattern`: A regular expression pattern that must be satisfied for values to be accepted (e.g. `new RegExp('\\d+')`). Undefined by default.
  * `minimumLength`: The minimum number of characters (inclusive) allowed in the string. Undefined by default.
  * `maximumLength`: The maximum number of characters (inclusive) allowed in the string. Undefined by default.
* `integer`: The value is a number with no fractional component. Additional parameters:
  * `minimumValue`: Reject values that are less than this. No restriction by default.
  * `minimumValueExclusive`: Reject values that are less than or equal to this. No restriction by default.
  * `maximumValue`: Reject values that are greater than this. No restriction by default.
  * `maximumValueExclusive`: Reject values that are greater than or equal to this. No restriction by default.
* `float`: The value is a number with an optional fractional component (i.e. it is either an integer or a floating point number). Additional parameters:
  * `minimumValue`: Reject values that are less than this. No restriction by default.
  * `minimumValueExclusive`: Reject values that are less than or equal to this. No restriction by default.
  * `maximumValue`: Reject values that are greater than this. No restriction by default.
  * `maximumValueExclusive`: Reject values that are greater than or equal to this. No restriction by default.
* `boolean`: The value is either `true` or `false`. No additional parameters.
* `datetime`: The value is an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date string with optional time and time zone components (e.g. "2016-06-18T18:57:35.328-08:00"). The time is assumed to be midnight if the time component is omitted and the time zone is assumed to be UTC if the time zone component is omitted. Additional parameters:
  * `minimumValue`: Reject date/times that are less than this. May be either an ISO 8601 date string with optional time and time zone components OR a JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object. The time is assumed to be midnight if the time component is omitted and the time zone is assumed to be UTC if the time zone component is omitted. No restriction by default.
  * `minimumValueExclusive`: Reject date/times that are less than or equal to this. May be either an ISO 8601 date string with optional time and time zone components OR a JavaScript `Date` object. The time is assumed to be midnight if the time component is omitted and the time zone is assumed to be UTC if the time zone component is omitted. No restriction by default.
  * `maximumValue`: Reject date/times that are greater than this. May be either an ISO 8601 date string with optional time and time zone components OR a JavaScript `Date` object. The time is assumed to be midnight if the time component is omitted and the time zone is assumed to be UTC if the time zone component is omitted. No restriction by default.
  * `maximumValueExclusive`: Reject date/times that are greater than or equal to this. May be either an ISO 8601 date string with optional time and time zone components OR a JavaScript `Date` object. The time is assumed to be midnight if the time component is omitted and the time zone is assumed to be UTC if the time zone component is omitted. No restriction by default.
* `date`: The value is an ISO 8601 date string _without_ time and time zone components (e.g. "2016-06-18"). For the purposes of date comparisons (e.g. by way of the `minimumValue`, `maximumValue`, etc. parameters), the time is assumed to be midnight and the time zone is assumed to be UTC. Additional parameters:
  * `minimumValue`: Reject dates that are less than this. May be either an ISO 8601 date string without time and time zone components OR a JavaScript `Date` object. No restriction by default.
  * `minimumValueExclusive`: Reject dates that are less than or equal to this. May be either an ISO 8601 date string without time and time zone components OR a JavaScript `Date` object. No restriction by default.
  * `maximumValue`: Reject dates that are greater than this. May be either an ISO 8601 date string without time and time zone components OR a JavaScript `Date` object. No restriction by default.
  * `maximumValueExclusive`: Reject dates that are greater than or equal to this. May be either an ISO 8601 date string without time and time zone components OR a JavaScript `Date` object. No restriction by default.
* `enum`: The value must be one of the specified predefined string and/or integer values. Additional parameters:
  * `predefinedValues`: A list of strings and/or integers that are to be accepted. If this parameter is omitted from an `enum` property's configuration, that property will not accept a value of any kind. For example: `[ 1, 2, 3, 'a', 'b', 'c' ]`
* `attachmentReference`: The value is the name of one of the document's file attachments. Note that, because the addition of an attachment is often a separate Sync Gateway API operation from the creation/replacement of the associated document, this validation type is only applied if the attachment is actually present in the document. However, since the sync function is run twice in such situations (i.e. once when the _document_ is created/replaced and once when the _attachment_ is created/replaced), the validation will be performed eventually. The top-level `allowAttachments` property should be `true` so that documents of this type can actually store attachments. Additional parameters:
  * `supportedExtensions`: An array of case-insensitive file extensions that are allowed for the attachment's filename (e.g. "txt", "jpg", "pdf"). Takes precedence over the document-wide `supportedExtensions` constraint for the referenced attachment. No restriction by default.
  * `supportedContentTypes`: An array of content/MIME types that are allowed for the attachment's contents (e.g. "image/png", "text/html", "application/xml"). Takes precedence over the document-wide `supportedContentTypes` constraint for the referenced attachment. No restriction by default.
  * `maximumSize`: The maximum file size, in bytes, of the attachment. May not be greater than 20MB (20,971,520 bytes), as Couchbase Server/Sync Gateway sets that as the hard limit per document or attachment. Takes precedence over the document-wide `maximumIndividualSize` constraint for the referenced attachment. Unlimited by default.

##### Complex type validation:

Validation for complex data types (e.g. objects, arrays, hashtables):

* `array`: An array/list of elements. Additional parameters:
  * `mustNotBeEmpty`: If `true`, an array with no elements is not allowed. Defaults to `false`.
  * `minimumLength`: The minimum number of elements (inclusive) allowed in the array. Undefined by default.
  * `maximumLength`: The maximum number of elements (inclusive) allowed in the array. Undefined by default.
  * `arrayElementsValidator`: The validation that is applied to each element of the array. Any validation type, including those for complex data types, may be used. Undefined by default. An example:

```
    myArray1: {
      type: 'array',
      mustNotBeEmpty: true,
      arrayElementsValidator: {
        type: 'string',
        regexPattern: new RegExp('[A-Za-z0-9_-]+')
      }
    }
```

* `object`: An object that is able to declare which properties it supports so that unrecognized properties are rejected. Additional parameters:
  * `allowUnknownProperties`: Whether to allow the existence of properties that are not explicitly declared in the object definition. Not applied recursively to objects that are nested within this object. Defaults to `false` if the `propertyValidators` parameter is specified; otherwise, it defaults to `true`.
  * `propertyValidators`: An object/hash of validators to be applied to the properties that are explicitly supported by the object. Any validation type, including those for complex data types, may be used for each property validator. Undefined by default. If defined, then any property that is not declared will be rejected by the sync function unless the `allowUnknownProperties` parameter is `true`. An example:

```
    myObj1: {
      type: 'object',
      propertyValidators: {
        myProp1: {
          type: 'date',
          immutable: true
        },
        myProp2: {
          type: 'integer',
          minimumValue: 1
        }
      }
    }
```

* `hashtable`: An object/hash that, unlike the `object` type, does not declare the names of the properties it supports and may optionally define a single validator that is applied to all of its element values. Additional parameters:
  * `minimumSize`: The minimum number of elements allowed in the hashtable. Unconstrained by default.
  * `maximumSize`: The maximum number of elements allowed in the hashtable. Unconstrained by default.
  * `hashtableKeysValidator`: The validation that is applied to each of the keys in the object/hash. Undefined by default. Additional parameters:
    * `mustNotBeEmpty`: If `true`, empty key strings are not allowed. Defaults to `false`.
    * `regexPattern`: A regular expression pattern that must be satisfied for key strings to be accepted. Undefined by default.
  * `hashtableValuesValidator`: The validation that is applied to each of the values in the object/hash. Undefined by default. Any validation type, including those for complex data types, may be used. An example:

```
    myHash1: {
      type: 'hashtable',
      hashtableKeysValidator: {
        mustNotBeEmpty: false,
        regexPattern: new RegExp('\\w+')
      },
      hashtableValuesValidator: {
        type: 'object',
        required: true,
        propertyValidators: {
          mySubObjProp1: {
            type: 'string'
          }
        }
      }
    }
```

##### Universal constraint validation:

Validation for all simple and complex data types support the following additional parameters:

* `required`: The value cannot be `null` or missing/`undefined`. Defaults to `false`.
* `mustNotBeMissing`: The value cannot be missing/`undefined`. Defaults to `false`. **WARNING:** This constraint exists for advanced users only. Generally the `required` constraint should be favoured because many programming languages are incapable of distinguishing between `null` and missing values, potentially leading to a situation in which a client application cannot satisfy this constraint depending on the JSON serialization strategy it uses.
* `mustNotBeNull`: The value cannot be `null`. Defaults to `false`. **WARNING:** This constraint exists for advanced users only. Generally the `required` constraint should be favoured because many programming languages are incapable of distinguishing between `null` and missing values, potentially leading to a situation in which a client application cannot satisfy this constraint depending on the JSON serialization strategy it uses.
* `immutable`: The item cannot be changed from its existing value if the document is being replaced. A value of `null` is treated as equal to missing/`undefined`. The constraint is applied recursively so that, even if a value that is nested an arbitrary number of levels deep within an immutable complex type is modified, the document change will be rejected. Does not apply when creating a new document or deleting an existing document. Defaults to `false`.
* `immutableStrict`: The item cannot be changed from its existing value if the document is being replaced. Differs from `immutable` in that a value of `null` is treated as different from missing/`undefined`. The constraint is applied recursively so that, even if a value that is nested an arbitrary number of levels deep within an immutable complex type is modified, the document change will be rejected. Does not apply when creating a new document or deleting an existing document. Defaults to `false`. **WARNING:** This constraint exists for advanced users only. Generally the `immutable` constraint should be favoured because many programming languages are incapable of distinguishing between `null` and missing values, potentially leading to a situation in which a client application cannot satisfy this constraint depending on the JSON serialization strategy it uses.
* `immutableWhenSet`: As with the `immutable` property, the item cannot be changed from its existing value if the document is being replaced. However, it differs in that it only prevents modification if the item is neither `null` nor missing/`undefined`. The constraint is applied recursively so that, even if a value that is nested an arbitrary number of levels deep within an immutable complex type is modified, the document change will be rejected. Does not apply when creating a new document or deleting an existing document. Defaults to `false`.
* `immutableWhenSetStrict`: As with the `immutableWhenSet` property, the item cannot be changed if it already has a value. However, it differs in that modification is allowed only when the existing value is missing/`undefined`; otherwise, if the existing value is `null` or any other value, it cannot be changed. The constraint is applied recursively so that, even if a value that is nested an arbitrary number of levels deep within an immutable complex type is modified, the document change will be rejected. Does not apply when creating a new document or deleting an existing document. Defaults to `false`. **WARNING:** This constraint exists for advanced users only. Generally the `immutableWhenSet` constraint should be favoured because many programming languages are incapable of distinguishing between `null` and missing values, potentially leading to a situation in which a client application cannot satisfy this constraint depending on the JSON serialization strategy it uses.
* `mustEqual`: The value of the property or element must be equal to the specified value. Useful in cases where the item's value should be computed from other properties of the document (e.g. a reference ID that is encoded into the document's ID or a number that is the result of some calculation performed on other properties in the document). For that reason, this constraint is perhaps most useful when specified as a dynamic constraint (e.g. `mustEqual: function(doc, oldDoc, value, oldValue) { ... }`) rather than as a static value (e.g. `mustEqual: 'foobar'`). If this constraint is set to `null`, then only values of `null` or missing/`undefined` will be accepted for the corresponding property or element. No constraint by default.
* `mustEqualStrict`: The value of the property or element must be equal to the specified value. Differs from `mustEqual` in that a value of `null` is treated as different from missing/`undefined`. In other words, if this constraint is set to `null`, then only values of `null` will be accepted for the corresponding property or element. No constraint by default. **WARNING:** This constraint exists for advanced users only. Generally the `mustEqual` constraint should be favoured because many programming languages are incapable of distinguishing between `null` and missing values, potentially leading to a situation in which a client application cannot satisfy this constraint depending on the JSON serialization strategy it uses.
* `customValidation`: A function that accepts as parameters (1) the new document, (2) the old document that is being replaced/deleted (if any), (3) an object that contains metadata about the current item to validate and (4) a stack of the items (e.g. object properties, array elements, hashtable element values) that have gone through validation, where the last/top element contains metadata for the direct parent of the item currently being validated and the first/bottom element is metadata for the root (i.e. the document). In cases where the document is in the process of being deleted, the first parameter's `_deleted` property will be `true`, so be sure to account for such cases. If the document does not yet exist, the second parameter will be null or undefined. And, in some cases where the document previously existed (i.e. it was deleted), the second parameter _may_ be non-null and its `_deleted` property will be `true`. Generally, custom validation should not throw exceptions; it's recommended to return an array/list of error descriptions so the sync function can compile a list of all validation errors that were encountered once full validation is complete. A return value of `null`, `undefined` or an empty array indicate there were no validation errors. An example:

```
    propertyValidators: {
      myStringProp: {
        type: 'string'
      },
      myCustomProp: {
        type: 'integer',
        minimumValue: 1,
        maximumValue: 100,
        customValidation: function(doc, oldDoc, currentItemElement, validationItemStack) {
          var parentObjectElement = validationItemStack[validationItemStack.length - 1];
          var parentObjectName = parentObjectElement.itemName;
          var parentObjectValue = parentObjectElement.itemValue;
          var parentObjectOldValue = parentObjectElement.oldItemValue;

          var currentPropName = currentItemElement.itemName;
          var currentPropValue = currentItemElement.itemValue;
          var currentPropOldValue = currentItemElement.oldItemValue;

          var currentPropPath = parentObjectName + '.' + currentPropName;
          var myStringPropPath = parentObjectName + '.myStringProp';

          var validationErrors = [ ];

          if (parentObjectValue.myStringProp && !currentPropValue) {
            validationErrors.push('property "' + currentPropPath + '" must be defined when "' + myStringPropPath + '" is defined');
          }

          if (currentPropOldValue && currentPropValue && currentPropValue < currentPropOldValue) {
            validationErrors.push('property "' + currentPropPath + '" must not decrease in value');
          }

          return validationErrors;
        }
      }
    }
```

##### Predefined validators:

The following predefined item validators may also be useful:

* `typeIdValidator`: A property validator that is suitable for application to the property that specifies the type of a document. Its constraints include ensuring the value is a string, is neither null nor undefined, is not an empty string and cannot be modified. NOTE: If a document type specifies `simpleTypeFilter` as its type filter, it is not necessary to explicitly include a `type` property validator; it will be supported implicitly as a `typeIdValidator`. An example usage:

```
propertyValidators: {
  type: typeIdValidator,
  foobar: {
    type: 'string'
  }
}
```

##### Dynamic constraint validation:

In addition to defining any of the item validation constraints above, including `type`, as static values (e.g. `maximumValue: 99`, `mustNotBeEmpty: true`), it is possible to specify them dynamically via function (e.g. `regexPattern: function(doc, oldDoc, value, oldValue) { ... }`). This is useful if, for example, the constraint should be based on the value of another property/element in the document or computed based on the previous stored value of the current property/element. The function should expect to receive the following parameters:

1. The current document.
2. The document that is being replaced (if any). Note that, if the document is missing (e.g. it doesn't exist yet) or it has been deleted, this parameter will be `null`.
3. The current value of the property/element/key.
4. The previous value of the property/element/key as stored in the revision of the document that is being replaced (if any).

For example:

```
propertyValidators: {
  sequence: {
    type: 'integer',
    required: true,
    // The value must always increase by at least one with each revision
    minimumValue: function(doc, oldDoc, value, oldValue) {
      return !isValueNullOrUndefined(oldValue) ? oldValue + 1 : 0;
    }
  },
  category: {
    type: 'enum',
    required: true,
    // The list of valid categories depends on the beginning of the document's ID
    predefinedValues: function(doc, oldDoc, value, oldValue) {
      return (doc._id.indexOf('integerDoc-') === 0) ? [ 1, 2, 3 ] : [ 'a', 'b', 'c' ];
    }
  },
  referenceId: {
    type: 'string',
    required: true,
    // The reference ID must be constructed from the value of the category field
    regexPattern: function(doc, oldDoc, value, oldValue) {
      return new RegExp('^foobar-' + doc.category + '-[a-zA-Z_-]+$');
    }
  }
}
```

### Definition file

A document definitions file specifies all the document types that belong to a single Sync Gateway bucket/database. Such a file can contain either a plain JavaScript object or a JavaScript function that returns the documents' definitions wrapped in an object.

For example, a document definitions file implemented as an object:

```
{
  myDocType1: {
    channels: {
      view: 'view',
      write: 'write'
    },
    typeFilter: function(doc, oldDoc, docType) {
      return oldDoc ? oldDoc.type === docType : doc.type === docType;
    },
    propertyValidators: {
      type: typeIdValidator,
      myProp1: {
        type: 'integer'
      }
    }
  },
  myDocType2: {
    channels: {
      view: 'view',
      write: 'write'
    },
    typeFilter: function(doc, oldDoc, docType) {
      return oldDoc ? oldDoc.type === docType : doc.type === docType;
    },
    propertyValidators: {
      type: typeIdValidator,
      myProp2: {
        type: 'datetime'
      }
    }
  }
}
```

Or a functionally equivalent document definitions file implemented as a function:

```
function() {
  var sharedChannels = {
    view: 'view',
    write: 'write'
  };

  function myDocTypeFilter(doc, oldDoc, docType) {
    return oldDoc ? oldDoc.type === docType : doc.type === docType;
  }

  return {
    myDocType1: {
      channels: sharedChannels,
      typeFilter: myDocTypeFilter,
      propertyValidators: {
        type: typeIdValidator,
        myProp1: {
          type: 'integer'
        }
      }
    },
    myDocType2: {
      channels: sharedChannels,
      typeFilter: myDocTypeFilter,
      propertyValidators: {
        type: typeIdValidator,
        myProp2: {
          type: 'datetime'
        }
      }
    }
  };
}
```

As demonstrated above, the advantage of defining a function rather than an object is that you may also define variables and functions that can be shared between document types but at the cost of some brevity.

#### Modularity

Document definitions are also modular. By invoking the `importDocumentDefinitionFragment` macro, the contents of external files can be imported into the main document definitions file. For example, each individual document definition from the example above can be specified as a fragment in its own separate file:

* `my-doc-type1.js`:

```
    {
      channels: sharedChannels,
      typeFilter: myDocTypeFilter,
      propertyValidators: {
        type: typeIdValidator,
        myProp1: {
          type: 'integer'
        }
      }
    }
```

* `my-doc-type2.js`:

```
    {
      channels: sharedChannels,
      typeFilter: myDocTypeFilter,
      propertyValidators: {
        type: typeIdValidator,
        myProp2: {
          type: 'datetime'
        }
      }
    }
```

And then each fragment can be imported into the main document definitions file:

```
function() {
  var sharedChannels = {
    view: 'view',
    write: 'write'
  };

  function myDocTypeFilter(doc, oldDoc, docType) {
    return oldDoc ? oldDoc.type === docType : doc.type === docType;
  }

  return {
    myDocType1: importDocumentDefinitionFragment('my-doc-type1-fragment.js'),
    myDocType2: importDocumentDefinitionFragment('my-doc-type2-fragment.js')
  };
}
```

As you can see, the fragments can also reference functions (e.g. `myDocTypeFilter`) and variables (e.g. `sharedChannels`) that were defined in the main document definitions file. Organizing document definitions in this manner helps to keep configuration manageable.

### Helper functions

Custom code (e.g. type filters, custom validation functions, custom actions) within document definitions have access to some useful predefined functions for common operations:

* `isDocumentMissingOrDeleted(candidate)`: Determines whether the given `candidate` document is either missing (i.e. `null` or `undefined`) or deleted (i.e. its `_deleted` property is `true`). Useful in cases where, for example, the old document (i.e. `oldDoc` parameter) is non-existant or deleted and you want to treat both cases as equivalent.
* `isValueNullOrUndefined(value)`: Determines whether the given `value` parameter is either `null` or `undefined`. In many cases, it is useful to treat both states the same.

# Testing

The synctos project includes a variety of specifications/test cases to verify the behaviours of its various features. However, if you need to write a custom validation function, dynamic type filter, dynamic assignment of channels to users/roles, etc. or you would otherwise like to verify a generated sync function, this project includes a test helper module (`src/test-helper.js`) that is useful in automating much of the work that can go into writing test cases.

The post [Testing your Sync Gateway functions with synctos](https://blog.couchbase.com/testing-sync-gateway-functions-synctos/) on the official Couchbase blog provides a detailed walkthrough, with examples, for setting up and running tests. The following section also provides a brief overview of the process.

To include the test helper module in your own sync function test cases, you must first ensure that your project [includes](https://docs.npmjs.com/getting-started/using-a-package.json) the development dependencies it relies upon. Update your project's `devDependencies` to include the following packages:

* [expect.js](https://www.npmjs.com/package/expect.js) for test assertions
* [simple-mock](https://www.npmjs.com/package/simple-mock) for mocking/stubbing the built-in Sync Gateway functions `requireAccess`, `channel`, `access`, etc.
* [mocha](https://mochajs.org/) or another JavaScript test runner/framework that supports `expect.js`

The synctos project uses `mocha` for writing and executing test cases and the following instructions assume that you will too, but you are free to substitute something else if you like. Once your dev dependencies have been set up, run `npm install` to download the extra dependencies.

After that, create a new spec file in your project's `test/` directory (e.g. `test/foobar-spec.js`) and import the test helper module into the empty spec:

    var testHelper = require('../node_modules/synctos/src/test-helper.js');

Create a new `describe` block to encapsulate the forthcoming test cases and also initialize the synctos test helper before each test case using the `beforeEach` function. For example:

```
describe('My new sync function', function() {
  beforeEach(function() {
    testHelper.initDocumentDefinitions('/path/to/my-doc-definitions.js');
  });

  ...
});
```

Now you can begin writing specs/test cases inside the `describe` block using the test helper's convenience functions to verify the behaviour of the generated sync function. For example, to verify that a new document passes validation, specifies the correct channels, roles and usernames for authorization, and assigns the desired channel access to a list of users:

```
it('can create a myDocType document', function() {
  var doc = {
    _id: 'myDocId',
    type: 'myDocType',
    foo: 'bar',
    bar: -32,
    members: [ 'joe', 'nancy' ]
  }

  testHelper.verifyDocumentCreated(
    doc,
    {
      expectedChannels: [ 'my-add-channel1', 'my-add-channel2' ],
      expectedRoles: [ 'my-add-role' ],
      expectedUsers: [ 'my-add-user' ]
    },
    [
      {
        expectedUsers: function(doc, oldDoc) {
          return doc.members;
        },
        expectedChannels: function(doc, oldDoc) {
          return 'view-' + doc._id;
        }
      }
    ]);
});
```

Or to verify that a document cannot be created because it fails validation:

```
it('cannot create a myDocType doc when required property foo is missing', function() {
  var doc = {
    _id: 'myDocId',
    type: 'myDocType',
    bar: 79
  };

  testHelper.verifyDocumentNotCreated(
    doc,
    'myDocType',
    [ testHelper.validationErrorFormatter.requiredValueViolation('foo') ],
    {
      expectedChannels: [ 'my-add-channel1', 'my-add-channel2' ],
      expectedRoles: [ 'my-add-role' ],
      expectedUsers: [ 'my-add-user' ]
    });
});
```

The `testHelper.validationErrorFormatter` object in the preceding example provides a variety of functions that can be used to specify expected validation error messages. See the `src/validation-error-message-formatter.js` module in this project for documentation.

You will find many more examples in this project's `test/` directory and in the example project [synctos-test-examples](https://github.com/OldSneerJaw/synctos-test-examples).
