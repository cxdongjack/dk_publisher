var path = require('path');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;

exports.init = function(grunt) {
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  var util = require('../../util/util.js').init(grunt);
  var exports = {};

  /**
   * 去掉core_list里面出现的依赖
   */
  function rejectDeps(deps, core_list) {
    return _.reject(deps, function(_dp){
      var id = _dp;
      return _.contains(core_list,id);
    });
  };

  /**
   * 获取依赖文件的文件内容
   */
  function getDepSrc(dep, records) {
    var id = fpath = dep;

    // 之前已经加载过,返回空
    if (grunt.util._.contains(records, id)) {
      return '';
    }
    records.push(id);

    if (!grunt.file.exists(fpath)) {
      grunt.log.warn('file ' + fpath + ' not found');
      return '';
    }
    
    // 为文件内容添加id
    return ast.modify(grunt.file.read(fpath), {id: id}).print_to_string();
  };

  /**
   * 合并js文件, 默认根据deps递归合并, 如果relative为false, 不进行递归合并
   * @param fileObj {Object} {src : <path>}
   */
  exports.jsConcat = function(fileObj, options) {
    var data = grunt.file.read(fileObj.src);
    var meta = ast.parseFirst(data);
    // grunt.option取得是全局量
    var records = grunt.option('concat-records');
    
    if(!meta) {
      grunt.log.error('File ' + fileObj.src + ' is\'t AMD, are you sure?');
      return data;
    }

    // 检查是否已经合并过
    if (grunt.util._.contains(records, meta.id)) {
      return '';
    }
    records.push(meta.id);

    // 如果禁止递归concat
    if (!options.relative) {
      return data;
    }

    var _deps = rejectDeps(meta.dependencies, options.without);
    
    // 合并所有依赖文件的内容
    var rv = _deps.map(function(dep) {
      return getDepSrc(dep, records);
    }).join(grunt.util.normalizelf(options.separator));

    // 合并源文件及其依赖的内容
    return [data, rv].join(grunt.util.normalizelf(options.separator));
  };

  return exports;
};
