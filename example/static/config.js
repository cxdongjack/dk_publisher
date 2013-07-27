define(function() {

  var rules = [];

  // for seajs.org
  rules.push([ 'dist', 'debug']);

  // set map rules
  seajs.config({'map': rules});

});