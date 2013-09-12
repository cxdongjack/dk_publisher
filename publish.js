var util = require('./tasks/util/util.js');
module.exports = function(grunt) {

  var util = require('./tasks/util/util.js').init(grunt);
  var pkg = grunt.file.readJSON('package.json');
  // 读取命令行参数中的target作为本次构建的目标
  // 可以是单文件'act_tt.js'
  // 可以是多文件'*.js'
  // 可以根据需要继续优化, 加入exculde等字段
  var target =  grunt.option('target') || '*.js'; 

  grunt.initConfig({
    // --base指定目录的package.json
    pkg : pkg,
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
           src: ['**/*.js'], // actual pattern(s) to match.
           dest: '<%= base %>/_core/'   // destination path prefix.
        }]
      }
    },
    page : {
      options : {
          target : target
      }
    },
    // concat: {
    //   page : {
    //     files : [{
    //        expand : true,
    //        cwd : '<%= base %>/_build/',
    //        src: [target], // Actual pattern(s) to match.
    //        dest: '<%= base %>/debug/'   // Destination path prefix.
    //     }]
    //   },
      // core : {
      //   files: {
      //      '<%= base %>/core/core-debug.js': '<%= base %>/_core/*.js'
      //   }
      // },
    //   core : {
    //     files: {
    //        '<%= base %>/core/core-debug.js': util.getCoreList(pkg.prefix)
    //     }
    //   }
    // },
    uglify: {
      page : {
        files: [{
           expand : true,
           cwd : '<%= base %>/debug/',
           src: [target], // Actual pattern(s) to match.
           dest: '<%= base %>/dist/'   // Destination path prefix.
        }]
      },
      core : {
        files: {
           '<%= base %>/core/core.js': '<%= base %>/core/core-debug.js'
        }
      }
    },
    clean : {
      before : {
        src : ['<%= base %>/debug','<%= base %>/dist', '<%= base %>/core']
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
  grunt.loadTasks('tasks/page');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // 切换回原来的工作目录
  process.chdir(_origDir);
  
  // 全文件打包 
  // grunt.registerTask('default', ['clean:before','transport','core','copycore','concat:page', 'uglify', 'clean:after']);  
  grunt.registerTask('default', ['clean:before','transport','core','copycore','page', 'uglify']);  
  // 单文件打包
  // grunt.registerTask('single', ['transport','concat:page','uglify:page','clean:after']);  
  grunt.registerTask('single', ['transport','page','uglify:page']);  
  grunt.registerTask('docore', ['copycore','uglify:core']);  
}
