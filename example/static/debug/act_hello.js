define("static/page/act_hello.js", [], function(require, exports, module) {
    var $ = require("jquery"), Hello = require("../widget/hello");
    $(document).keypress(function(ev) {
        if (ev.which == 32) {
            new Hello();
        }
    });
});
