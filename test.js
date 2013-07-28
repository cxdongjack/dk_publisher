var util = require('./tasks/util/util.js');
module.exports = function(grunt) {

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
              src: ['*.js'],
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
           src: ['**/*.js'], // Actual pattern(s) to match.
           dest: '<%= base %>/debug/'   // Destination path prefix.
        }]
      },
      core : {
        files: {
           '<%= base %>/debug/core.js': '<%= base %>/_core/*.js'
        }
      },
    },
    clean : {
      test : {
        src : ['1']
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

  // 切换回原来的工作目录
  process.chdir(_origDir);
  
  grunt.registerTask('default', ['transport','core','concat:core','concat:page']);  
  // grunt.registerTask('default', ['transport','concat:page']);  
}
