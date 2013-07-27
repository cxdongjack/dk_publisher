/*
 * grunt-cmd-concat
 * https://github.com/spmjs/grunt-cmd-concat
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */

var path = require('path');

module.exports = function(grunt) {

  var path = require('path');
  var ast = require('cmd-util').ast;
  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);
  var cmd = require('cmd-util');
  var iduri = cmd.iduri;
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  
  var processors = {
    '.js': script.jsConcat,
    '.css': style.cssConcat
  };

  grunt.registerMultiTask('core', 'get repeat modules.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options();
    
    
    var _all = {},_map={}, dest_prefix = this.files[0].orig.dest;
    this.files.forEach(function(f) {
        var _deps = {};
        var _tmp = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // 分析每个文件的依赖, 并以数组形式返回
        var data = grunt.file.read(filepath);
        var meta = ast.parseFirst(data);
        var dps = meta.dependencies.map(function(_dp){
          if (_dp.charAt(0) !== '.') {
            // node 0.10 path.normalize 参数不能为数组了
            _dp = iduri.relative(f.src + '', _dp);
          }
          var _path = path.join(path.dirname(f.src + ''), _dp);
          _path = iduri.appendext(_path);
          var id = iduri.absolute(meta.id, _dp);
          
          if (!grunt.file.exists(_path)) {
            // 如果让某个文件不被打包,设置alias时,可以让两个名字相同,如 jquery : jquery
            id = id.replace(/\.js$/, '');
            if(id !== iduri.parseAlias(pkg, id))
              grunt.log.warn('depence file "' + _path + '" not found.');
            return null;
          } else {
            _map[_path] = id;
            return _path;
          }
        });
        return dps;
      })
      
      // (当前文件)合并所有的数组层级,并去除无用项,统计每个文件被依赖的次数
      _.compact(_.flatten(_tmp)).forEach(function(_id) {
        _deps[_id] = _deps[_id] || 0;
        _deps[_id] ++;
      });
      
      // 合并所有文件的deps至_all对象
      _.each(_deps, function(_num, _id) {
        _all[_id] = _all[_id] || 0;
        _all[_id] = _all[_id] + _num;
      });
      
    });
    
    // 获取所有依赖次数大于2的依赖
    var _keys = [];
    _.each(_all,function(_itm, _id) {if(_itm >= 2) _keys.push(_id)});
    
    // 生成src-dest对,将src写入到对应的dest
    var _fs = grunt.file.expandMapping(_keys, this.files[0].orig.dest,{flatten : !0});
    
    // 防止在mapping过程中,个别文件不存在
    if(_keys.length !== _fs.length){
      grunt.log.error('mapping isn\' equal: ' + _keys.length + '-' + _fs.length);
      _keys.filter(function(_path){
        if(!grunt.file.expand(_path).length)
          grunt.log.error('mapping isn\' equal ->' + JSON.stringify(_path));
      });
      return !1;
    }
    
    // 写入到core文件夹中的文件对应的ids
    var _withoutIds = [];
    // 将依赖次数大于2的依赖文件,写入core文件夹
    _keys.forEach(function(_rpath,_index){
      var _id = _map[_rpath],
          _fo = _fs[_index];
      _withoutIds.push(_id);
      var fpath = _fo.src, 
          _dest = _fo.dest;
      iduri.appendext(fpath);
      if (!grunt.file.exists(fpath)) {
        grunt.log.warn('file ' + fpath + ' not found');
        return '';
      }
      var src = ast.modify(grunt.file.read(fpath), {id: _id}).print_to_string({
        beautify: true,
        comments: true
      });
      grunt.file.write(_dest, src);
    });
    
    // core文件夹中的id列表,应从其它入口文件中剔除,故将该列表写入到config
    grunt.config.set('without',_withoutIds);
    if(!!_withoutIds.length)
      grunt.log.ok('without ids ->' + grunt.config.get('without'));
    else
      grunt.log.ok('without ids is empty');
      
    if(!options.include) return;
    // 复制指定的文件至_core文件夹 不加id
    options.include.forEach(function(_path){
      _path = iduri.appendext(_path);
      if(!grunt.file.exists(_path)){
        grunt.log.error('manual add file ' + _path + ' isn\'t exist');
        return;
      }
      grunt.file.copy(_path, dest_prefix + iduri.basename(_path));
    });
  });
};
