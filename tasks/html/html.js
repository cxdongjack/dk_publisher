module.exports = function(grunt) {
  var path = require('path');
  var cmd = require('cmd-util');
  var util = require('../util/util.js').init(grunt);
  var iduri = cmd.iduri;
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');

  var parser = require('./lib/parser').init(grunt);

  function doTask(){
    var options = this.options({
      ignore : pkg.ignore || [],
      map : {}
    });
    this.files.forEach(function(fileObj) {
      // 由于src为Array, 因此这里forEach一下, 此处src的长度为1
      // 因为设置files的属性里面有expanded, 因此所有文件会被展开,故src长度为1
      transportFile(fileObj.src[0], fileObj.dest, options);
    });

    // 清除ignore的文件, 因为有可能会产生无效解析
    _.each(options.ignore, function(_id) {
      if(options.map[_id]) {
        delete options.map[_id];
      }
    });

    // persist
    var _orig = {
      ignore : options.ignore,
      map : options.map
    };
    grunt.file.write('package/html', JSON.stringify(_orig, 0, 2));
  }

  function transportFile(src, dest, _options){
    var _ignore = _options.ignore;

    // 过滤ignore文件和module文件
    if(_.indexOf(_ignore, src) !== -1) {
      return;
    }

    // 处理文件
    var ret = parser.parse({src: src, dest : dest, options : _options});
    _options.ignore = _.union(_options.ignore, ret.tp_html || []);
    _.extend(_options.map, ret.map);
  };

  grunt.registerMultiTask('html', 'Parse the html', doTask);
};
