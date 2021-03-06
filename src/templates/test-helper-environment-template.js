function(require) {
  var simple = require('simple-mock');

  var requireAccess = simple.stub();
  var requireRole = simple.stub();
  var requireUser = simple.stub();
  var channel = simple.stub();
  var access = simple.stub();
  var role = simple.stub();

  var customActionStub = simple.stub();

  return {
    requireAccess: requireAccess,
    requireRole: requireRole,
    requireUser: requireUser,
    channel: channel,
    access: access,
    role: role,
    customActionStub: customActionStub,
    syncFunction: %SYNC_FUNC_PLACEHOLDER%
  };
}
