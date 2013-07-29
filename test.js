var util = require('./tasks/util/util.js');
module.exports = function(grunt) {

  // 读取命令行参数中的target作为本次构建的目标
  // 可以是单文件'act_tt.js'
  // 可以是多文件'*.js'
  // 可以根据需要继续优化, 加入exculde等字段
  var target =  grunt.option('target') || '*.js'; 

  grunt.initConfig({
    // --base指定目录的package.json
    pkg : grunt.file.readJSON('package.json'),
    base : '<%= pkg.prefix %>',
    transport: {
      options: {
          format: '<%= pkg.prefix + "/" + pkg.target + "/{{filename}}" %>',
          debug : !1,
          paths : ['.']
      },
      target : {
          files: [{
              expand : true,
              cwd : '<%= base %>/<%= pkg.target %>',
              src: [target],
              dest: '<%= base %>/_build/',
              flatten : true
          }]
      }
    },
    core : {
      options : {
          include : '<%= pkg.core %>'
        },
      target : {
        files: [{
           expand : true,
           cwd : '<%= base %>/_build/',
           src: ['**/*.js'], // Actual pattern(s) to match.
           dest: '<%= base %>/_core/'   // Destination path prefix.
        }]
      }
    },
    concat: {
      page : {
        files : [{
           expand : true,
           cwd : '<%= base %>/_build/',
           src: [target], // Actual pattern(s) to match.
           dest: '<%= base %>/debug/'   // Destination path prefix.
        }]
      },
      core : {
        files: {
           '<%= base %>/core/core.js': '<%= base %>/_core/*.js'
        }
      },
    },
    uglify: {
      main: {
        files: [{
           expand : true,
           cwd : '<%= base %>/debug/',
           src: ['*.js'], // Actual pattern(s) to match.
           dest: '<%= base %>/dist/'   // Destination path prefix.
        }]
      }
    },
    clean : {
      before : {
        src : ['<%= base %>/debug','<%= base %>/dist']
      },
      after : {
        src : ['<%= base %>/_build','<%= base %>/_core']
      }
    }
  });

  var _origDir = process.cwd();
  // 切换到gruntfile所在目录载入tasks
  process.chdir(__dirname);

  grunt.loadTasks('tasks/transport');
  grunt.loadTasks('tasks/core');
  grunt.loadTasks('tasks/concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // 切换回原来的工作目录
  process.chdir(_origDir);
  
  // 全文件打包 
  grunt.registerTask('default', ['transport','core','concat:core','concat:page']);  
  // 单文件打包
  grunt.registerTask('single', ['transport','concat:page']);  
}
