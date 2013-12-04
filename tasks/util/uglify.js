'use strict';

// External libs.
var UglifyJS = require('uglify-js');
var fs = require('fs');

exports.init = function(grunt) {
  var exports = {};

  // Minify with UglifyJS.
  // From https://github.com/mishoo/UglifyJS2
  // API docs at http://lisperator.net/uglifyjs/
  exports.minify = function(code, options) {
    options = options || {}
    grunt.util._.defaults(options, {
      banner: '',
      compress: {
        warnings: false
      },
      mangle: {},
      beautify: false,
      report: false
    });

    grunt.verbose.write('Minifying with UglifyJS...');

    var topLevel = null;

    var outputOptions = getOutputOptions(options);
    var output = UglifyJS.OutputStream(outputOptions);

    // Grab and parse all source files
    topLevel = UglifyJS.parse(code, {
      filename: options.filename,
      toplevel: topLevel
    });

    // Wrap code in a common js wrapper.
    if (options.wrap) {
      topLevel = topLevel.wrap_commonjs(options.wrap, options.exportAll);
    }

    // Need to call this before we mangle or compress,
    // and call after any compression or ast altering
    topLevel.figure_out_scope();

    if (options.compress !== false) {
      if (options.compress.warnings !== true) {
        options.compress.warnings = false;
      }
      var compressor = UglifyJS.Compressor(options.compress);
      topLevel = topLevel.transform(compressor);

      // Need to figure out scope again after source being altered
      topLevel.figure_out_scope();
    }

    if (options.mangle !== false) {
      // compute_char_frequency optimizes names for compression
      topLevel.compute_char_frequency(options.mangle);

      // Requires previous call to figure_out_scope
      // and should always be called after compressor transform
      topLevel.mangle_names(options.mangle);
    }

    // Print the ast to OutputStream
    topLevel.print(output);

    var min = output.get();

    grunt.verbose.ok();

    return min;
  };

  var getOutputOptions = function(options) {
    var outputOptions = {
      beautify: false,
      source_map: null
    };

    if (options.preserveComments) {
      if (options.preserveComments === 'all' || options.preserveComments === true) {

        // preserve all the comments we can
        outputOptions.comments = true;
      } else if (options.preserveComments === 'some') {

        // preserve comments with directives or that start with a bang (!)
        outputOptions.comments = function(node, comment) {
          return (/^!|@preserve|@license|@cc_on/i).test(comment.value);
        };
      } else if (grunt.util._.isFunction(options.preserveComments)) {

        // support custom functions passed in
        outputOptions.comments = options.preserveComments;
      }
    }

    if (options.beautify) {
      if (grunt.util._.isObject(options.beautify)) {
        // beautify options sent as an object are merged
        // with outputOptions and passed to the OutputStream
        grunt.util._.extend(outputOptions, options.beautify);
      } else {
        outputOptions.beautify = true;
      }
    }

    return outputOptions;
  };

  return exports;
};
