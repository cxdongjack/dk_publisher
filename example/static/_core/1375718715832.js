define("static/widget/handle-text.js", [], function(require, exports, module) {
    var random = require("widget/util").random;
    // console.log(require.resolve('../../util/src/util'));
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