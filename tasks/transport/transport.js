module.exports = function(grunt) {
  var path = require('path');
  var cmd = require('cmd-util');
  var ast = cmd.ast;
  var util = require('../util/util.js').init(grunt);
  var iduri = cmd.iduri;
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');

  var text = require('./lib/text').init(grunt);
  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);
  var template = require('./lib/template').init(grunt);

  var data, astCache;

  // 全局的配置参数
  var _config = {};

  function doTask(){
    var options = this.options({
      paths: ['sea-modules'],
      format: '{{family}}/{{name}}/{{version}}/{{filename}}',
      // create a debug file or not
      debug: true,
      // process a template or not
      process: false,
      // path or object
      pkg: 'package.json',
      // define parsers
      parsers: {
        '.js': [script.jsParser],
        '.css': [style.cssParser],
        '.html': [text.html2jsParser],
        '.handlebars': [template.handlebarsParser]
      },
      // for handlebars
      knownHelpers: [],
      knownHelpersOnly: false,
      // output beautifier
      uglify: {
        beautify: true,
        comments: true
      }
    });

    // 分析当前目录(base指定或Gruntfile.js's dirname)的下的配置文件（包含paths, vars等）
    options.pkg = pkg;

    if (options.process === true) {
      options.process = {};
    }

    // var _html = grunt.file.readJSON('package/html');
    // var _maps = _.reduce(_html.map, function(memo, itm) {
    //   memo.push(itm);
    //   return memo;
    // }, []);

    var _jsMaps = grunt.file.readJSON('package/js-html');
    var _maps = _.keys(_jsMaps);

    var _include = (pkg.include || []).map(function(_id){ return [util.transformId(_id)] });
    var _exclude = (pkg.exclude || []).map(function(_id){ return [util.transformId(_id)] });
    _maps = _.union(_maps, _include, _exclude);

    _.each(_.flatten(_maps), function(fpath) {
      transportFile(fpath, {}, options);
    });

    // var _ret = formatMap(_maps);
    grunt.file.write('package/transport', JSON.stringify(_config, 0, 2));
    return;


    if(!this.files.length){
      grunt.fail.fatal('transport files not exists');
      return;
    } 


    // target 
    this.files.forEach(function(fileObj) {
      // 由于src为Array, 因此这里forEach一下, 此处src的长度为1
      // 因为设置files的属性里面有expanded, 因此所有文件会被展开,故src长度为1
      fileObj.src.forEach(function(fpath){
        transportFile(fpath, fileObj, options);
      });
    });

    // include and exclude
    var _include = (pkg.include || []).map(function(_id){ return util.transformId(_id)});
    var _exclude = (pkg.exclude || []).map(function(_id){ return util.transformId(_id)});
    _.union(_include, _exclude).forEach(function(fpath) {
      transportFile(fpath, {}, options);
    });

    // 持久化
    util.setConfig(_config);
  }

  function transportFile(fpath, fileObj, options){
    // 获取文件名作为生成id的参数
    if (fileObj.cwd) {
      fpath = path.join(fileObj.cwd, fpath);
    } 
    if (grunt.file.isDir(fpath)) {
      grunt.file.mkdir(fpath);
      return;
    }

    // 选取相应的parser
    var extname = path.extname(fpath);
    var fileparsers = options.parsers[extname];
    if (!fileparsers || fileparsers.length === 0) {
      grunt.log.writeln(fpath + ' has not the fileparsers');
      return;
    }

    if (!Array.isArray(fileparsers)) {
      fileparsers = [fileparsers];
    }

    // 取得文件内容
    var srcData = grunt.file.read(fpath);
    if (options.process) {
      srcData = grunt.template.process(srcData, options.process);
    }

    // 处理文件
    fileparsers.forEach(function(fn) {
      var _deps = fn({
        src: fpath,
        srcData: srcData,
      }, options);
      _config[fpath] = _deps;
    });
  };

  function formatMap(_map) {
    var _mapping = {};
    _.each(_map, function(_scripts) {

      var _itm = _.find(_scripts, function(_id) {
        return _id.indexOf('act_') !== -1;
      });

      _itm = _itm || _map[0];

      if(!_itm) grunt.log.error('get error in formatMap', _map).writeln();

      var _dps = _.reduce(_scripts, function(memo, num){ 
        return _.union(memo, num); 
      }, []);

      _mapping[_itm] = _dps;
    })
    return _mapping;
  }

  grunt.registerMultiTask('transport', 'Transport everything into cmd.', doTask);
};
