var BotTrace = {

    canvas : null,
    ctx : null,

    trace : [],
    currentColor : '#FFFFFF',

    init : function() {
        this.canvas = document.getElementById('botTraceCanvas');
        this.ctx    = this.canvas.getContext('2d');
    },

    addPoint : function(point) {

        var traceLastIndex = this.trace.length - 1,
            lastTracePoint = this.trace[traceLastIndex];

        // Check if same last trace point, does not get added twice
        if (lastTracePoint) {
            if (lastTracePoint.x === centerX && lastTracePoint.y === centerY) {
                return;
            }
        }

        this.trace.push(point);
    },

    clear : function() {
        this.canvas.width = this.canvas.width;
        this.trace = [];
    },

    draw : function(x, y, center, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(center.x, center.y, 1, 1);
    }
};