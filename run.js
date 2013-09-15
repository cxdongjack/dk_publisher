var grunt = require('grunt');
var path = require('path');

exports.run = function(tasks, _options) {
  //"dp;grunt --gruntfile publish.js --base ~/dev/duokan_store/v0/html/web/v0/develop/static/lib docore"
  var _opt = {
    // base : path.resolve('/Users/chenxiaodong/dev/duokan_store/v0/html/web/v0/develop/static/lib'),
    base : path.resolve(process.cwd()),
    gruntfile : path.resolve(__dirname, 'publish.js')
  };
  grunt.util._.extend(_opt, _options);
  grunt.tasks(tasks, _opt);
};
