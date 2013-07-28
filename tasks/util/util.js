exports.init = function(grunt) {
  var iduri = require('cmd-util').iduri;
  var pkg = grunt.config.get('pkg');

	exports.setCoreList = function(_list) {
	  grunt.file.write(pkg.prefix + '/core/core.list', JSON.stringify({list:_list}));
	};

	exports.getCoreList = function() {
	  var _pkg = grunt.file.readJSON(pkg.prefix + '/core/core.list');
	  return _pkg.list;
	};

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
  exports.transformId = function(id) {
    // 如果是相对路径， 则转换为顶级路径
    if (id.charAt(0) === '.') {
      // push the absolute id not the origin
      id = id2TopLevel(id,absolute_id);
    } else {
      id = iduri.parseAlias(pkg, id);
      id = parsePaths(id, pkg);
    }
    id = parseVars(id, pkg);

    // 然后加上文件后缀.js
    if(!(/\.js$/.test(id))) id += '.js';
    return id;
  };

	return exports;
}
