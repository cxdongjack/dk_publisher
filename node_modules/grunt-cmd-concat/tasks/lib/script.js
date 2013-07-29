var path = require('path');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;

exports.init = function(grunt) {
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  var exports = {};

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

    if (!options.relative) {
      return data;
    }
    var output = [];
    if (options.pkg && options.pkg.spm) {
      output = options.pkg.spm.output || [];
    }
    if (!Array.isArray(output)) {
      output = Object.keys(output);
    }

    // 过滤掉without中的依赖
    var _deps = _.reject(meta.dependencies, function(_dp){
      var fpath = path.join(path.dirname(fileObj.src), _dp);
      var id = iduri.absolute(meta.id, _dp);
      // _.contains(options.without,id) && console.log('deps without ' + id);
      return _.contains(options.without,id);
    });
    
    var rv = _deps.map(function(dep) {
      if (!/\.css$/.test(dep)) {
        var dep = iduri.normalize(dep);
        // 将绝对id转换成相对id
        if(dep.charAt(0) !== '.') {
          dep = iduri.relative(fileObj.src, dep);
        
        dep = dep.replace(/\.js$/, '')}

        // get absolute id, dep must be relative or return dep itself
        var id = iduri.absolute(meta.id, dep);
        if (grunt.util._.contains(records, id)) {
          return '';
        }
        records.push(id);

        dep = iduri.appendext(dep);
        var fpath = path.join(path.dirname(fileObj.src), dep);
        if (!/\.js$/.test(fpath)) fpath += '.js';
        if (!grunt.file.exists(fpath)) {
          // 如果让某个文件不被打包,设置alias时,可以让两个名字相同,如 jquery : jquery
         if(id !== iduri.parseAlias(pkg, id))
            grunt.log.warn('file ' + fpath + ' not found');
          return '';
        }
        
        // 为生成的文件添加id
        return ast.modify(grunt.file.read(fpath), {id: id }).print_to_string();
      } else if (/\.css$/.test(dep) && options.css2js) {
        var fileInPaths;

        options.paths.some(function(basedir) {
          var fpath = path.join(basedir, dep);
          if (grunt.file.exists(fpath)) {
            fileInPaths = fpath;
            return true;
          }
        });

        if (!fileInPaths) {
          grunt.log.warn('file ' + dep + ' not found');
        } else {
          return options.css2js(grunt.file.read(fileInPaths), dep);
        }
      }
      return '';
    }).join(grunt.util.normalizelf(options.separator));
    return [data, rv].join(grunt.util.normalizelf(options.separator));
  };

  return exports;
};
