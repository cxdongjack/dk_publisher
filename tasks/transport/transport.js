module.exports = function(grunt) {
  var path = require('path');
  var cmd = require('cmd-util');
  var ast = cmd.ast;
  var util = require('../util/util.js').init(grunt);
  var iduri = cmd.iduri;

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
    options.pkg = grunt.config.get('pkg');

    if (options.process === true) {
      options.process = {};
    }


    if(!this.files.length){
      grunt.fail.fatal('transport files not exists');
      return;
    } 


    this.files.forEach(function(fileObj) {
      // 由于src为Array, 因此这里forEach一下, 此处src的长度为1
      // 因为设置files的属性里面有expanded, 因此所有文件会被展开,故src长度为1
      fileObj.src.forEach(function(fpath){
        transportFile(fpath, fileObj, options);
      });
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

  grunt.registerMultiTask('transport', 'Transport everything into cmd.', doTask);
};
