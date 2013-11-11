var path = require('path');
var sys_util = require('util');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;

exports.init = function(grunt) {
  var _ = grunt.util._;
  var pkg = grunt.config.get('pkg');
  var util = require('../../util/util.js').init(grunt);
  var exports = {};

  var _reg = /\r\n|\r|\n/;
  function readlines(src) {
    var data = grunt.file.read(src)
    return data.split(_reg);
  }

  var _reg0  = /^\s*<!--\s*(.+?)\s*-->\s*$/,
      _reg00 = /<!\s*\[/,    // for <![endif]--> or <!-- <![endif]-->
      _reg01 = /<!--\s*\[/,  // for <!--[if lte IE 7]> or <!--[if !IE]> -->
      // stylesheet
      _reg10 = /<link[\w\W]*?rel\s*=\s*["']stylesheet["']/i,
      _reg11 = /<link[\w\W]*?href\s*=\s*["'](.*?)["']/i,
      _reg12 = /<style\b/i,
      _reg13 = /<\/style>/i,
      // script
      _reg20 = /<script[\w\W]*?src\s*=\s*["'](.*?)["']/i,
      _reg21 = /^\s*<script\b/i,
      _reg22 = /<\/script>\s*$/i,
      // template
      _reg30 = /<textarea.*?name\s*=\s*["'](js|css|html)["']/i,
      _reg31 = /<\/textarea>/i;

  exports.parse = function(_opt) {
    console.log('\nparse', _opt.src, '-->' ,_opt.dest)


    var _root = _.pick(_opt, 'src', 'dest');
    var _result = {
      id : util.transformId(_root.src),
      tp_html : null,
      has_module : !1,
      map : {}
    };
    var _source = [];
    var _tag = {};
    _.each(readlines(_root.src), function(_line, _index) {

      // check <textarea></textarea>, find the module id
      if (_reg30.test(_line) && _reg31.test(_line)) {
        _tag.type = _line.match(_reg30)[1];
        if(_tag.type == 'html') {
          __doParseHtmlTemplate(_tag, _result, _line);
          return;
        }
      }

      // find the location for module inject 
      if (_reg21.test(_line) && _result['tp_html'] && !_result['has_module']) {
        _line = ['<!--TP_HTML-->', _line].join('\n');
        _source.push(_line);
        _result['has_module'] = !0;
        return;
      }

      _source.push(_line);
    });
    // join the source
    _result.source = _source.join('\n');

    // replace the tp_html with the remote file
    __doMergeTemplate(_result);

    // save the file 
    grunt.file.write(_root.dest, _result.source);

    // parse html-js map, save in result.map
    __doParseSeajs(_result);

    console.log(_result['tp_html'])
    console.log(_result.source);
    console.log(_result.map);
    // if(_result['tp_html']) {
    //   console.log(_result['tp_html'][0])
    //   console.log(grunt.file.read(_result['tp_html'][0]));
    // }

    return _result;
  }

  var __doParseHtmlTemplate = (function(){
      var _reg0 = /<textarea[\w\W]*?data-src\s*=\s*["'](.*?)["']/i,
          _reg1 = /^\s*<textarea[\w\W]*?>/i,
          _reg2 = /<\/textarea>\s*$/i;
      return function(_tag, _result, _content){
          var _src,_code;
          if (_reg0.test(_content))
              _src = RegExp.$1;
          _code = _content.replace(_reg1,'')
                          .replace(_reg2,'').trim();
          var _list = _result['tp_'+_tag.type];
          if (!_list){
              _list = [];
              _result['tp_'+_tag.type] = _list;
          }
          if (!!_src){
              _src = _src.split(',');
              for(var i=0,l=_src.length,_url;i<l;i++){
                // TODO absolute & valid
                _src[i] = util.transformId(_src[i]);
                _list.push(_src[i]);
              }
          }
          if (!!_code) _list.push(_code);
          delete _tag.type;
      };
  })();

  /*
   * 合并嵌套模板
   * @param  {Object} _result 解析结果集
   * @return {Void}
   */
  var __doMergeTemplate = (function(){
      var _reg1 = /#<(js|cs|[\d]*?):(.*?)>/gi,
          _reg2 = /<meta.*?>/i,
          _tmpl = '<div style="display:none;" id="umi://%s">\n%s\n</div>';
      var _doMergeModule = function(_modules, _result){
        var _list = [];
        _.each(_modules, function(_id, i) {
          var _cnt = grunt.file.read(_id);
          _list[i] = sys_util.format(_tmpl, _id, _cnt);
        }, this);
        _result.source = _result.source.split('<!--TP_HTML-->').join(_list.join('\n'));
      };
      return function(_result){
          if(_result['tp_html'])
            _doMergeModule(_result['tp_html'], _result);
      };
  })();

  var __doParseSeajs = (function() {
    var _reg = /seajs.use\(\'(.*?)\'/gi;
    return function(_result) {
      var _source = _result.source;
      var _paths = _source.match(_reg);
      var _dps = _.map(_paths, function(_statement) {
        /seajs.use\(\'(.*?)\'/.test(_statement)
        return util.transformId(RegExp.$1);
      });
      _dps = _.union(_dps);
      _result.map[_result.id] = _dps;
    }
  })();

  return exports;
};
