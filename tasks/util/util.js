var grunt = require('grunt');

exports.setCoreList = function(_list) {
  grunt.file.write('core/core.list', JSON.stringify({list:_list}));
};

exports.getCoreList = function() {
  var _pkg = grunt.file.readJSON('core/core.list');
  console.log(_pkg.list);
  return _pkg.list;
};
