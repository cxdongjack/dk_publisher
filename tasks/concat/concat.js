var path = require('path');

module.exports = function(grunt) {

  var ast = require('cmd-util').ast;
  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);

  var util = require('../util/util.js').init(grunt);
  var cmd = require('cmd-util');
  var iduri = cmd.iduri;
  var _ = grunt.util._;
  
  
  var processors = {
    '.js': script.jsConcat,
    '.css': style.cssConcat
  };

  function doTask() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      separator: grunt.util.linefeed,
      uglify: {
        beautify: true,
        comments: true
      },
      paths: ['sea-modules'],
      processors: {},
      relative: true,
      banner: '',
      without : []
    });

    // 获取core文件列表
    var _without = util.getCoreList();
    options.without = _without;

    // log
    grunt.log.ok('core list : ');
    console.log(_without);

    this.files.forEach(function(f) {
      // reset records, 设置了全局的参数, 设置在命令行参数的作用域中
      grunt.option('concat-records', []);

      // 生成文本内容
      var src = options.banner + 
      f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        var extname = path.extname(filepath);
        var processor = options.processors[extname] || processors[extname];
        if (!processor) {
          return grunt.file.read(filepath);
        }
        return processor({src: filepath}, options);
      }).join(grunt.util.normalizelf(options.separator));

      // 移除所有deps, 打包后不需要了
      src = ast.modify(src, {
        dependencies: function(v) {
          return null;
        }
      }).print_to_string(options.uglify);

      // ensure a new line at the end of file
      src += '\n';

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  }

  grunt.registerMultiTask('concat', 'concat cmd modules.', doTask);
};
