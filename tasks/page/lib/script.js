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
   * 根据config生成当前文件的meta 
   */
  function getMeta(fpath, config) {
    if(!config[fpath]) 
      grunt.log.error(fpath + ' is\'t in config!');

    return {
      id : fpath,
      dependencies : config[fpath]
    };
  };

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
    // var meta = ast.parseFirst(data);
    var meta = getMeta(fileObj.src, options.config);
    // grunt.option取得是全局量
    var records = grunt.option('concat-records');
    
    if(!meta) {
      grunt.log.error('File ' + fileObj.src + ' is\'t AMD, are you sure?');
      return data;
    }

    // 做core合并的时候， 由于源文件里面没有id, 因此用path做id
    // if(!meta.id) {
    //   meta.id = fileObj.src;
    //   data = ast.modify(data, {id: meta.id}).print_to_string();
    //   // 不需要依赖
    //   data = ast.modify(data, {id: meta.id, dependencies:[]}).print_to_string();
    // }

    // 检查是否已经合并过
    if (grunt.util._.contains(records, meta.id)) {
      return '';
    }
    records.push(meta.id);

    // 如果禁止递归concat
    if (!options.relative) {
      return data;
    }

    // 计算过滤后的依赖
    var _deps = rejectDeps(meta.dependencies, options.without);
    
    // 合并所有依赖文件的内容
    var rv = _deps.map(function(dep) {
      return getDepSrc(dep, records);
    }).join(grunt.util.normalizelf(options.separator));


    // 修改原文件
    var data = grunt.file.read(fileObj.src);
    data = ast.modify(data, {id: meta.id}).print_to_string();

    // 合并源文件及其依赖的内容
    return [data, rv].join(grunt.util.normalizelf(options.separator));
  };

  return exports;
};
