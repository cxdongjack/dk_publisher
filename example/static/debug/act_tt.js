define("static/page/act_tt", [], function(require, exports, module) {
    var $ = require("static/libs/gallery/jquery/1.8.3/jquery.js"), Hello = require("widget/hello");
    $(document).keypress(function(ev) {
        if (ev.which == 32) {
            new Hello();
        }
    });
});
