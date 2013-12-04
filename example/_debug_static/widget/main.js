define("static/widget/main.js", [], function(require) {
    require("./math").plus(1, 2);
});

define("static/widget/math.js", [], function(require) {
    return {
        plus: function(a, b) {
            return a + b;
        }
    };
});
