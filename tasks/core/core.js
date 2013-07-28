/*
 * grunt-cmd-concat
 * https://github.com/spmjs/grunt-cmd-concat
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {
  var path = require('path');
  var ast = require('cmd-util').ast;
  var cmd = require('cmd-util');
  var iduri = cmd.iduri;
  var util = require('../util/util.js').init(grunt);
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');

  function getDependencies(fileObj, filepath) {
    // 一旦文件不存在， 则程序跳出，因为此处不应该出现文件不存在
    if (!grunt.file.exists(filepath)) {
      grunt.log.error('Source file "' + filepath + '" not found.');
      return [];
    }
    // 分析每个文件的依赖, 并以数组形式返回
    var data = grunt.file.read(filepath);
    var meta = ast.parseFirst(data);
    var dps = meta.dependencies.map(function(id){
      // id 即 顶级路径
      var path = id;
      if (!grunt.file.exists(path)) {
        // 如果让某个文件不被打包, 可以设置ignore
        var ignores = pkg.ignore || [];
        if(ignores.indexOf(path) === -1)
          grunt.log.error('file: '+ path + ' is not\'t exist');
        return null;
      } else {
        // _map[_path] = id;
        return path;
      }
    });

    return dps;
  };

  function getAllDeps(files) {
    var _all = {};
    files.forEach(function(fileObj) {
      // 因为files, flatten：true, 因此所有的fileObj.src长度为1
      var _dps = getDependencies(fileObj, fileObj.src[0]);

      // 合并所有文件的依赖
      _.each(_dps, function(_id) {
        _all[_id] = _all[_id] || 0;
        _all[_id] ++ ;
      });

    });
    return _all;
  };

  function getCoreList(_all, _include, _exclude) {
    var _keys = [];
    _.each(_all,function(_itm, _id) {if(_itm >= 2) _keys.push(_id)});

    _include = _include.map(function(_id){ return util.transformId(_id)});
    _exclude = _exclude.map(function(_id){ return util.transformId(_id)});
    _keys = _.union(_keys, _include);
    _keys = _.difference(_keys, _exclude);

    return _keys;
  };

  function getDestPaths(_list, dest_prefix) {
    var _fs = grunt.file.expandMapping(_list, dest_prefix, {flatten : !0});
    
    // 防止在mapping过程中,个别文件不存在
    if(_list.length !== _fs.length){
      grunt.log.error('mapping isn\' equal: ' + _list.length + '-' + _fs.length);
      _list.filter(function(_path){
        if(!grunt.file.expand(_path).length)
          grunt.log.error('mapping isn\' equal ->' + JSON.stringify(_path));
      });
      return !1;
    }

    return _fs;
  };

  function copyCoreList(_filesMapping) {
    _.each(_filesMapping, function(_file){
      // var _id = _map[_rpath],
      var _id = fpath =  _file.src[0],
          _dest = _file.dest;
      if (!grunt.file.exists(fpath)) {
        // 没必要检查的...
        grunt.log.warn('file ' + fpath + ' not found');
        return '';
      }
      var src = ast.modify(grunt.file.read(fpath), {id: _id}).print_to_string({
        beautify: true,
        comments: true
      });
      grunt.file.write(_dest, src);
    });
  };

  function doTask(){
    var options = this.options(),
        dest_prefix = this.files[0].orig.dest;

    // 求所有目标文件夹下文件的依赖， 结果为【<id>], 即是id也是path
    var _all = getAllDeps(this.files);
    
    // 获取所有依赖次数大于2的依赖
    var _keys = getCoreList(_all, pkg.include || [], pkg.exclude || []);

    // 生成文件地址对 {<id> : dest_prefix/<id>}
    var _fs = getDestPaths(_keys, dest_prefix);

    // copy 文件到目标文件夹
    copyCoreList(_fs);

    // core文件夹中的id列表,应从其它入口文件中剔除,故将该列表写入到config
    grunt.config.set('without',_keys);

    // 持久化写入core.list
    util.setCoreList(_keys);
    grunt.log.ok('core_list :');
    console.log(util.getCoreList());

  }
  grunt.registerMultiTask('core', 'get repeat modules.', doTask)
};
