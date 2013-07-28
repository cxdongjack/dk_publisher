exports.init = function(grunt) {
  var path = require('path');
  var ast = require('cmd-util').ast;
  var iduri = require('cmd-util').iduri;


  var exports = {};

  exports.jsParser = function(fileObj, options) {
    grunt.log.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);
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
      grunt.log.writeln('found dependencies ' + deps);
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


  // helpers
  // ----------------
  
  /** 
   * description : transform the relative id to topLevel
   * 
   * topLevel id是以Gruntfile所有目录(或--base制定）作为根目录,所得到的的地址
   * 以该id作为id的前提是,seajs的base路径等同于Gruntfile所有目录,
   * 否则需要重新设置base 
   */
  function id2TopLevel(_id, fpath){
    // 若为相对路径， 则join
    if (_id.charAt(0) === '.') {
      _id = path.join(path.dirname(fpath), _id).replace(/\\/g,'/');
      // _id = path.relative(path.dirname(fpath), _id);
      _id = _id.replace(/\.js$/,'');
    }
    return _id
  }
  
  var PATHS_RE = /^([^/:]+)(\/.+)$/
  function parsePaths(id, pkg) {
    var paths = pkg.paths
    var m
  
    if (paths && (m = id.match(PATHS_RE)) && grunt.util._.isString(paths[m[1]])) {
      id = paths[m[1]] + m[2]
    }
  
    return id
  }
  
  var VARS_RE = /{([^{]+)}/g
  function parseVars(id, pkg) {
    var vars = pkg.vars
  
    if (vars && id.indexOf("{") > -1) {
      id = id.replace(VARS_RE, function(m, key) {
        return grunt.util._.isString(vars[key]) ? vars[key] : m
      })
    }
  
    return id
  }

  // 将id转换成顶级路径，同时此路径也是id
  function transformId(id, options) {
    // 如果是相对路径， 则转换为顶级路径
    if (id.charAt(0) === '.') {
      // push the absolute id not the origin
      id = id2TopLevel(id,absoulut_id);
    } else {
      id = iduri.parseAlias(options.pkg, id);
      id = parsePaths(id, options.pkg);
    }
    id = parseVars(id, options.pkg);

    // 然后加上文件后缀.js
    if(!(/\.js$/.test(id))) id += '.js';
    return id;
  };
  
  /*
   * 取得当前文件所有的依赖
   * @param absolute_id {string} 为当前文件path
   */
  function relativeDependencies(absoulut_id, options) {
    absoulut_id = iduri.appendext(absoulut_id);
    // grunt.log.writeln('deal ' + absoulut_id );

    var deps = [];
    
    if (!grunt.file.exists(absoulut_id)) {
      // 如果让某个文件不被打包,设置alias时,可以让两个名字相同,如 jquery : jquery
      if(absoulut_id !== iduri.parseAlias(options.pkg, absoulut_id))
        grunt.log.error(absoulut_id + ' is not\'t exist');
      return [];
    }
    var data = grunt.file.read(absoulut_id);
    var parsed = ast.parseFirst(data);
    parsed.dependencies.forEach(function(id) {
      
      id = transformId(id, options);
      deps.push(id);
      // 递归
      deps = grunt.util._.union(deps, relativeDependencies(id, options));
    });
    return deps;
  }

  return exports;
};
