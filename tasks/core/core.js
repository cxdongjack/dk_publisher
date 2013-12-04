module.exports = function(grunt) {
  var path = require('path');
  var ast = require('cmd-util').ast;
  var cmd = require('cmd-util');
  var iduri = cmd.iduri;
  var util = require('../util/util.js').init(grunt);
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  var uglify = require('../util/uglify.js').init(grunt);

  // function getDependencies(fileObj, filepath) {
  //   // 一旦文件不存在， 则程序跳出，因为此处不应该出现文件不存在
  //   if (!grunt.file.exists(filepath)) {
  //     grunt.log.error('Source file "' + filepath + '" not found.');
  //     return [];
  //   }
  //   // 分析每个文件的依赖, 并以数组形式返回
  //   var data = grunt.file.read(filepath);
  //   var meta = ast.parseFirst(data);
  //   var dps = meta.dependencies.map(function(id){
  //     // id 即 顶级路径
  //     var path = id;
  //     if (!grunt.file.exists(path)) {
  //       // 如果让某个文件不被打包, 可以设置ignore
  //       var ignores = pkg.ignore || [];
  //       if(ignores.indexOf(path) === -1)
  //         grunt.log.error('file: '+ path + ' is not\'t exist');
  //       return null;
  //     } else {
  //       // _map[_path] = id;
  //       return path;
  //     }
  //   });

  //   return dps;
  // };

  // function getAllDeps(files) {
  //   var _all = {};
  //   files.forEach(function(fileObj) {
  //     // 因为files, flatten：true, 因此所有的fileObj.src长度为1
  //     var _dps = getDependencies(fileObj, fileObj.src[0]);

  //     // 合并所有文件的依赖
  //     _.each(_dps, function(_id) {
  //       _all[_id] = _all[_id] || 0;
  //       _all[_id] ++ ;
  //     });

  //   });
  //   return _all;
  // };

  function getAll () {
    var _config = util.getConfig();
    var _all = {};

    _.each(_config, function(_dps) {
      _.each(_dps, function(_id) {
        _all[_id] = _all[_id] || 0;
        _all[_id] ++ ;
      });
    });

    return _all;
  } 

  function getCoreList(_all, _include, _exclude) {
    var _keys = [];
    var _config = util.getConfig();
    _.each(_all,function(_itm, _id) {if(_itm >= 2) _keys.push(_id)});

    _include = _include.map(function(_id){ return util.transformId(_id)});
    _exclude = _exclude.map(function(_id){ return util.transformId(_id)});
    _includeDps = _include.map(function(_id){ return _config[_id] });
    _excludeDps = _exclude.map(function(_id){ return _config[_id] });
    _ins = _.union(_include, _.flatten(_includeDps));
    _exs = _.union(_exclude, _.flatten(_excludeDps));

    _keys = _.union(_keys, _ins);
    _keys = _.difference(_keys, _exs);

    return _keys;
  };

  // function copyList(_list, dest_prefix) {
  //   _.each(_list, function(fpath){
  //     var _id = fpath ,
  //         // 由于目录只有一级, 因此有可能重名, 因此选用随机数
  //         _dest = path.join(dest_prefix || '', +new Date() + '.js');

  //     var src = ast.modify(grunt.file.read(fpath), {id: _id}).print_to_string({
  //       beautify: true,
  //       comments: true
  //     });
  //     grunt.file.write(_dest, src);
  //   });
  // };

  function doTask(){
    var options = this.options();
        // dest_prefix = this.files[0].orig.dest;

    // 求所有目标文件夹下文件的依赖， 结果为[<id>, ...], 即是id也是path
    // var _all = getAllDeps(this.files);
    var _all = getAll();
    
    // 获取所有依赖次数大于2的依赖
    var _keys = getCoreList(_all, pkg.include || [], pkg.exclude || []);

    // @deprece 由单独的任务完成
    // copy 文件到目标_core文件夹
    // copyList(_keys, dest_prefix);

    // core文件夹中的id列表,应从其它入口文件中剔除,故将该列表写入到config
    grunt.config.set('without',_keys);

    // 持久化写入core.list
    util.setCoreList(_keys);

    grunt.log.ok('core_list :', _keys);
    console.log(util.getCoreList());

    doCopyTask.call(this, _keys);
  }
  grunt.registerMultiTask('core', 'get repeat modules.', doTask)

  function doCopyTask (_list) {
    var options = this.options({
          separator: grunt.util.linefeed,
          uglify: {
            beautify: true,
            comments: true
          }
        }),
        _list = _list || util.getCoreList(),
        _dest = util.getPrefix() + 'core.js';
        // dest_prefix = pkg.prefix + '/core/',
        // _dest = path.join(dest_prefix || '', 'core-debug.js');
        
    // _.each(_list, function(fpath){
    //   var _id = fpath ,
    //       // 由于目录只有一级, 因此有可能重名, 因此选用随机数
    //       _dest = path.join(dest_prefix || '', +new Date() + '.js');

    //   var src = ast.modify(grunt.file.read(fpath), {id: _id}).print_to_string({
    //     beautify: true,
    //     comments: true
    //   });
    //   grunt.file.write(_dest, src);
    // });

    var rv = _.map(_list, function(fpath) {
      var _id = fpath;
      var src = ast.modify(grunt.file.read(fpath), {id: _id}).print_to_string(options.uglify);
      return src;
    }).join(grunt.util.normalizelf(options.separator));

    // compress and mangle
    if(!grunt.option('debug_model')) {
      rv = uglify.minify(rv);
      rv += '\n';
    }

    grunt.file.write(_dest, rv);


  }

  grunt.registerTask('copycore', 'get repeat modules.', doCopyTask)
};
