module.exports = function(grunt) {
  var path = require('path');
  var sys_util = require('util');
  var cmd = require('cmd-util');
  var iduri = cmd.iduri;
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');

  var parser = require('./lib/parser').init(grunt);
  var util = require('../util/util.js').init(grunt);
  var uglify = require('../util/uglify.js').init(grunt);

  function doTask(){
    var options = this.options({
      ignore : pkg.ignore || [],
      map : {},
      core : []
    });
    this.files.forEach(function(fileObj) {
      // 由于src为Array, 因此这里forEach一下, 此处src的长度为1
      // 因为设置files的属性里面有expanded, 因此所有文件会被展开,故src长度为1
      transportFile(fileObj.src[0], fileObj.dest, options);
    });
    // 解析当前目录下的app.html
    if (!this.files.length) {
      transportFile('app.html', util.getPrefix() + 'app.html', options);
    }

    // 清除ignore的文件, 因为有可能会产生无效解析
    _.each(options.ignore, function(_id) {
      if(options.map[_id]) {
        delete options.map[_id];
      }
    });

    // persist
    var _orig = {
      ignore : options.ignore,
      core : options.core,
      map : options.map
    };
    grunt.file.write('package/html', JSON.stringify(_orig, 0, 2));
    generateJsMap(_orig.map);
  }

  function generateJsMap(_htmlMap) {
    var _map = {};
    _.each(_htmlMap, function(_jsList, _html) {
      _.each(_jsList, function(_js) {
        var _list = _map[_js];
        if(!_list) {
          _list = [_html];
          _map[_js] = _list;
          return;
        }
        _list.push(_html);
      });
    })
    grunt.file.write('package/js-html', JSON.stringify(_map, 0, 2));
  }

  function transportFile(src, dest, _options){
    var _ignore = _options.ignore;

    // 过滤ignore文件和module文件
    if(_.indexOf(_ignore, src) !== -1) {
      return;
    }

    // 处理文件
    var ret = parser.parse({src: src, dest : dest, options : _options});

    // save the file 
    grunt.file.write(util.getPrefix() + src, ret.source);
    console.log(util.getPrefix() + src, 'is created');

    _options.ignore = _.union(_options.ignore, ret.tp_html || []);
    _.extend(_options.map, ret.map);

    if(ret.hasCore) _options.core.push(src);
  };

  grunt.registerMultiTask('html', 'Parse the html', doTask);

  function doInjectScript() {
    var _stat = '/*<--js:%s-->*/';
    var MAX_JS_INLINE_SIZE = pkg.max_js_inline_size || 50 * 1024;
    var _jsMaps = grunt.file.readJSON('package/js-html');

    _.each(_jsMaps, function(_htmls, _id) {
      var data = grunt.file.read(util.getPrefix() + _id);

      console.log(data.length, _htmls, _id)
      if(data.length > MAX_JS_INLINE_SIZE) return;

      // inline
      _.each(_htmls, function(_src) {
        _src = util.getPrefix() + _src;
        var _cnt = grunt.file.read(_src);
        _cnt = _cnt.replace(sys_util.format(_stat, _id), data);
        grunt.file.write(_src, _cnt);
      });
    })

  }

  grunt.registerTask('injectJavascript', 'inject the js the size of which is lower than 50 into html', doInjectScript)
};
