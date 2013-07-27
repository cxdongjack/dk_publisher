module.exports = function(grunt) {
  
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    base : '<%= pkg.prefix %>',
    transport: {
        options: {
                format: '<%= pkg.prefix + "/" + pkg.target + "/{{filename}}" %>',
                debug : !1,
                paths : ['.']
            },
        foo : {
            files: [{
                expand : true,
                cwd : '<%= base %>/<%= pkg.target %>',
                src: ['*.js'],
                dest: '<%= base %>/_build/',
                flatten : true
            }]
        }
    },
    concat: {
      foo : {
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
    core : {
      options : {
          include : '<%= pkg.core %>'
        },
      foo : {
        files: [{
           expand : true,
           cwd : '<%= base %>/_build/',
           src: ['**/*.js'], // Actual pattern(s) to match.
           dest: '<%= base %>/_core/'   // Destination path prefix.
        }]
      }
    },
    uglify: {
      main: {
        files: [{
           expand : true,
           cwd : '<%= base %>/debug/',
           src: ['**/*.js'], // Actual pattern(s) to match.
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
      },
      test : {
        src : ['1']
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-cmd-transport');
  grunt.loadNpmTasks('grunt-cmd-concat');
  grunt.loadNpmTasks('grunt-cmd-core');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  
  grunt.registerTask('default', ['clean:before', 'transport:foo','core','concat:core','concat:foo', 'uglify', 'clean:after']);  
}
