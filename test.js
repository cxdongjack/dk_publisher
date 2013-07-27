module.exports = function(grunt) {
  var _origDir = process.cwd();
  // 切换到gruntfile所在目录载入tasks
  process.chdir(__dirname);
  console.log(grunt.file.readJSON('package.json'));

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
    clean : {
      test : {
        src : ['1']
      }
    }
  });

  grunt.loadTasks('tasks/transport');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // 切换回原来的工作目录
  process.chdir(_origDir);
  
  grunt.registerTask('default', ['transport:foo']);  
}
