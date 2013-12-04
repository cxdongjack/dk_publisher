define("static/page/act_hello.js", [], function(require, exports, module) {
    var $ = require("jquery"), Hello = require("../widget/hello");
    $(document).keypress(function(ev) {
        if (ev.which == 32) {
            new Hello();
        }
    });
});

define("static/widget/hello.js", [], function(require, exports, module) {
    var handleText = require("widget/{ht}");
    var random = handleText.random;
    function Hello() {
        this.render();
        this.bindAction();
        seajs.log("new Hello() called.");
    }
    Hello.prototype.render = function() {
        this.el = $('<div style="position:fixed;' + "left:" + random(0, 70) + "%;" + "top:" + random(10, 80) + '%;">' + handleText("Hello SPM !") + "</div>").appendTo("body");
    };
    Hello.prototype.bindAction = function() {
        var el = this.el;
        setTimeout(function() {
            el.fadeOut();
        }, random(500, 5e3));
    };
    module.exports = Hello;
});

define("static/widget/handle-text.js", [], function(require, exports, module) {
    var random = require("widget/util").random;
    function handleText(text) {
        var min = random(30, 70);
        var max = random(50, 120);
        var rt = "";
        for (var i = 0, len = text.length; i < len; i++) {
            rt += '<span style="font-size:' + random(min, max) + 'px;">' + text[i] + "</span>";
        }
        return rt;
    }
    handleText.random = random;
    return handleText;
});

define("static/widget/util.js", [], function(require, exports) {
    exports.random = function(min, max) {
        return min + Math.round(Math.random() * (max - min));
    };
});
