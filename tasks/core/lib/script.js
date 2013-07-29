var path = require('path');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;

exports.init = function(grunt) {
  var _ = grunt.util._;
  var exports = {};

  exports.jsConcat = function(fileObj, options) {
    var data = grunt.file.read(fileObj.src);

    var meta = ast.parseFirst(data);
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

    // filter the without option
    var _deps = _.reject(meta.dependencies, function(_dp){
      var fpath = path.join(path.dirname(fileObj.src), _dp);
      _.contains(options.without,fpath) && console.log('deps without ' + fpath);
      return _.contains(options.without,fpath);
    });
    console.log('meta.dependencies ' + JSON.stringify(_deps));
    
    var rv = _deps.map(function(dep) {
      console.log(dep);
      if (dep.charAt(0) === '.') {
        var _dep = path.normalize(dep).replace(/\\/, '/');
        _dep = iduri.appendext(_dep);
        _dep = _dep.replace(/-debug\.js$/, '.js');
        if (grunt.util._.contains(output, _dep)) {
          return '';
        }

        var id = iduri.absolute(meta.id, dep);
        if (grunt.util._.contains(records, id)) {
          return '';
        }
        records.push(id);

        var fpath = path.join(path.dirname(fileObj.src), dep);
        if (!/\.js$/.test(fpath)) fpath += '.js';
        if (!grunt.file.exists(fpath)) {
          grunt.log.warn('file ' + fpath + ' not found');
          return '';
        }
        
        // trans id to ast
        return ast.modify(grunt.file.read(fpath), {id: id }).print_to_string();
        // return grunt.file.read(fpath);
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
