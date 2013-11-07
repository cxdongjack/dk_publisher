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
      return ast.parseFirst(astCache).dependencies;
    }

    // 递归计算当前文件的所有依赖文件, 所有依赖以id的形式存在
    resetDeps();
    var deps = relativeDependencies(fileObj.src, options);

    if (deps.length) {
      grunt.log.writeln('found dependencies : ');
      console.log(deps);
    } else {
      grunt.log.writeln('found no dependencies');
    }

    // 通过写config, 抽象了dependences, 不依赖于具体的文件
    // @deprecated 修改源文件内容，加入id和dependences
    // astCache = ast.modify(astCache, {
    //   id: iduri.idFromPackage(options.pkg, fileObj.name, options.format),
    //   dependencies: deps,
    //   require: function(v) {
    //     return iduri.parseAlias(options.pkg, v);
    //   }
    // });
    // data = astCache.print_to_string(options.uglify);
    // grunt.file.write(fileObj.dest, data);
    
    return deps;
  };

  // 计算出来的文件依赖
  var _deps = []; 

  function resetDeps() {
    _deps = [];
  };

  var _globalDeps = {};
  
  /*
   * 取得当前文件所有的依赖
   * @param absolute_id {string} 为当前文件path
   */
  function relativeDependencies(absolute_id, options) {
    // console.log(absolute_id);
    var _fileDeps = [];

    if (_globalDeps[absolute_id]) {
      _fileDeps = _globalDeps[absolute_id];
    }else{
      _fileDeps = __getDepsById(absolute_id);
      _fileDeps.forEach(function(id) {
        var _dps = relativeDependencies(id, options);
        _fileDeps = grunt.util._.union(_fileDeps, _dps);
      });
    }
    
    // set global
    _globalDeps[absolute_id] = _fileDeps;
    return _fileDeps;
  }

  function __getDepsById(_id) {
    var _dps = [];
    if (!grunt.file.exists(_id)) {
      grunt.log.error('file: '+ _id + ' is not\'t exist');
      return [];
    }
    var data = grunt.file.read(_id);
    var parsed = ast.parseFirst(data);
    parsed = parsed || {dependencies:[]};
    _dps = parsed.dependencies;
    // format absolute id
    _dps = grunt.util._.map(_dps, function(id) {
      return util.transformId(id, _id);
    });
    return _dps;
  };

  return exports;
};
