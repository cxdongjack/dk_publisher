define("static/page/act_hello", [ "static/libs/gallery/jquery/1.8.3/jquery.js", "static/widget/hello.js", "static/widget/handle-text.js", "static/widget/util.js" ], function(require, exports, module) {
    var $ = require("static/libs/gallery/jquery/1.8.3/jquery.js"), Hello = require("../widget/hello");
    $(document).keypress(function(ev) {
        if (ev.which == 32) {
            new Hello();
        }
    });
});