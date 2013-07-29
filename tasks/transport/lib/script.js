exports.init = function(grunt) {
  var path = require('path');
  var ast = require('cmd-util').ast;
  var util = require('../../util/util.js').init(grunt);
  var iduri = require('cmd-util').iduri;


  var exports = {};

  exports.jsParser = function(fileObj, options) {
    grunt.log.writeln('\nTransport ' + fileObj.src + ' -> ' + fileObj.dest);
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var astCache = ast.getAst(data);

    // 如果被转换的文件有id, 则认为已经完成了transport
    if (ast.parseFirst(astCache).id) {
      grunt.log.warn('found id in "' + fileObj.src + '"');
      grunt.file.write(fileObj.dest, data);
      return;
    }

    // 递归计算当前文件的所有依赖文件, 所有依赖以id的形式存在
    var deps = relativeDependencies(fileObj.src, options);

    if (deps.length) {
      grunt.log.writeln('found dependencies : ');
      console.log(deps);
    } else {
      grunt.log.writeln('found no dependencies');
    }

    // 修改源文件内容，加入id和dependences
    astCache = ast.modify(astCache, {
      id: iduri.idFromPackage(options.pkg, fileObj.name, options.format),
      dependencies: deps,
      require: function(v) {
        return iduri.parseAlias(options.pkg, v);
      }
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(fileObj.dest, data);

    // 如果debug, 则再写-debug文件
    // if (!options.debug) {
    //   return;
    // }
    // var dest = fileObj.dest.replace(/\.js$/, '-debug.js');
    // grunt.log.writeln('Creating debug file: ' + dest);

    // astCache = ast.modify(data, function(v) {
    //   var ext = path.extname(v);
    //   if (ext) {
    //     return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
    //   } else {
    //     return v + '-debug';
    //   }
    // });
    // data = astCache.print_to_string(options.uglify);
    // grunt.file.write(dest, data);
  };
  
  /*
   * 取得当前文件所有的依赖
   * @param absolute_id {string} 为当前文件path
   */
  function relativeDependencies(absolute_id, options) {
    absolute_id = iduri.appendext(absolute_id);
    // grunt.log.writeln('deal ' + absolute_id );

    var deps = [];
    
    if (!grunt.file.exists(absolute_id)) {
      grunt.log.error('file: '+ absolute_id + ' is not\'t exist');
      return [];
    }
    var data = grunt.file.read(absolute_id);
    var parsed = ast.parseFirst(data);
    parsed.dependencies.forEach(function(id) {
      
      id = util.transformId(id);
      deps.push(id);
      // 递归
      deps = grunt.util._.union(deps, relativeDependencies(id, options));
    });
    return deps;
  }

  return exports;
};
