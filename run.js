var grunt = require('grunt');
var path = require('path');

//"dp;grunt --gruntfile publish.js --base ~/dev/duokan_store/v0/html/web/v0/develop/static/lib docore"
var _opt = {
  base : path.resolve('/Users/chenxiaodong/dev/duokan_store/v0/html/web/v0/develop/static/lib'),
  gruntfile : path.resolve('publish.js')
};

grunt.tasks(['docore'], _opt);
