/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  var path = require('path');
  var cmd = require('cmd-util');
  var ast = cmd.ast;
  var iduri = cmd.iduri;

  var text = require('./lib/text').init(grunt);
  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);
  var template = require('./lib/template').init(grunt);

  var data, astCache;

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
    if (grunt.util._.isString(options.pkg)) {
      if (grunt.file.exists(options.pkg)) {
        options.pkg = grunt.file.readJSON(options.pkg);
      } else {
        options.pkg = {};
      }
    }

    if (options.process === true) {
      options.process = {};
    }

    var fname, destfile;
    this.files.forEach(function(fileObj) {
      // 由于src为Array, 因此这里forEach一下, 此处src的长度为1
      // 因为设置files的属性里面有expanded, 因此所有文件会被展开,故src长度为1
      fileObj.src.forEach(function(fpath){
        transportFile(fpath, fileObj, options);
      });
    });
  }

  function transportFile(fpath, fileObj, options){
    // 获取文件名作为生成id的参数
    if (fileObj.cwd) {
      // not expanded
      fname = fpath;
      fpath = path.join(fileObj.cwd, fpath);
    } else {
      fname = path.relative(fileObj.orig && fileObj.orig.cwd || '', fpath);
    }
    if (grunt.file.isDir(fpath)) {
      grunt.file.mkdir(fpath);
      return;
    }
    // 取得目标文件的地址, 用join主要是规范化地址
    destfile = path.join(fileObj.dest);

    // 选取相应的parser
    var extname = path.extname(fpath);
    var fileparsers = options.parsers[extname];
    if (!fileparsers || fileparsers.length === 0) {
      grunt.file.copy(fpath, destfile);
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
      fn({
        src: fpath,
        srcData: srcData,
        name: fname,
        dest: destfile
      }, options);
    });
  };

  grunt.registerMultiTask('transport', 'Transport everything into cmd.', doTask);
};