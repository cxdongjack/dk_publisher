var path = require('path');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;

exports.init = function(grunt) {
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  var util = require('../../util/util.js').init(grunt);
  var exports = {};

  function rejectDeps(deps, core_list) {
    return _.reject(deps, function(_dp){
      // var fpath = path.join(path.dirname(fileObj.src), _dp);
      // var id = iduri.absolute(meta.id, _dp);
      // _.contains(options.without,id) && console.log('deps without ' + id);
      var id = _dp;
      return _.contains(core_list,id);
    });
  };

  function getDepSrc(dep, records) {
    var id = fpath = dep;
    // 之前已经加载过,返回空
    if (grunt.util._.contains(records, id)) {
      return '';
    }
    records.push(id);

    // dep = iduri.appendext(dep);
    // var fpath = path.join(path.dirname(fileObj.src), dep);
    // var fpath = id;
    // if (!/\.js$/.test(fpath)) fpath += '.js';
    if (!grunt.file.exists(fpath)) {
      if(!util.isIgnore(id))
        grunt.log.warn('file ' + fpath + ' not found');
      return '';
    }
    
    // 为生成的文件添加id
    return ast.modify(grunt.file.read(fpath), {id: id}).print_to_string();
  };

  /**
   * @param fileObj {Object} {src : <path>}
   */
  exports.jsConcat = function(fileObj, options) {
    var data = grunt.file.read(fileObj.src);
    var meta = ast.parseFirst(data);
    
    if(!meta) {
      grunt.log.error('File ' + fileObj.src + ' is\'t AMD, are you sure?');
      return data;
    }
    
    var records = grunt.option('concat-records');

    if (grunt.util._.contains(records, meta.id)) {
      return '';
    }
    records.push(meta.id);

    // 如果禁止递归concat
    if (!options.relative) {
      return data;
    }
    // var output = [];
    // if (options.pkg && options.pkg.spm) {
    //   output = options.pkg.spm.output || [];
    // }
    // if (!Array.isArray(output)) {
    //   output = Object.keys(output);
    // }

    // 过滤掉without中的依赖
    // var _deps = _.reject(meta.dependencies, function(_dp){
    //   var fpath = path.join(path.dirname(fileObj.src), _dp);
    //   var id = iduri.absolute(meta.id, _dp);
    //   // _.contains(options.without,id) && console.log('deps without ' + id);
    //   return _.contains(options.without,id);
    // });


    var _deps = rejectDeps(meta.dependencies, options.without);
    
    var rv = _deps.map(function(dep) {
      // var dep = iduri.normalize(dep);
      // // 将绝对id转换成相对id
      // if(dep.charAt(0) !== '.') {
      //   dep = iduri.relative(fileObj.src, dep);
      
      // dep = dep.replace(/\.js$/, '')}

      // get absolute id, dep must be relative or return dep itself
      // var id = iduri.absolute(meta.id, dep);


      return getDepSrc(dep, records);

      // var id = dep;
      // if (grunt.util._.contains(records, id)) {
      //   return '';
      // }
      // records.push(id);

      // // dep = iduri.appendext(dep);
      // // var fpath = path.join(path.dirname(fileObj.src), dep);
      // var fpath = id;
      // // if (!/\.js$/.test(fpath)) fpath += '.js';
      // if (!grunt.file.exists(fpath)) {
      //   if(!util.isIgnore(id))
      //     grunt.log.warn('file ' + fpath + ' not found');
      //   return '';
      // }
      
      // // 为生成的文件添加id
      // return ast.modify(grunt.file.read(fpath), {id: id}).print_to_string();
    }).join(grunt.util.normalizelf(options.separator));

    // 合并源文件及其依赖的内容
    return [data, rv].join(grunt.util.normalizelf(options.separator));
  };


  return exports;
};
