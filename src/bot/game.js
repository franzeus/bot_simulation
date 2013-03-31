/*
*   Bot Simulation - webarbeit@gmail.com
*   https://github.com/webarbeit/bot_simulation
*/

/*
    ------------------------------------------------------
    HELPER FUNCTIONS
*/

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function getRandomColor () {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isWithinArea (x, y, obj) {

    if( x >= obj.x &&
        x <= obj.x + obj.width &&
        y >= obj.y &&
        y < obj.y + obj.height)
    {
        return true;
    }

    return false;
}

function collisionBetweenTwoCircles (obj1, obj2, areSquares) {

    var obj1Radius = obj1.width / 2,
        obj2Radius = obj1.width / 2;

    // Radius is the distance of the center point and edge of the square
    if(areSquares) {
        obj1Radius = getDistanceToEdge(obj1.width);
        obj2Radius = getDistanceToEdge(obj2.width);
    }

    var obj1CenterX  = obj1.x + (obj1.width / 2),
        obj1CenterY  = obj1.y + (obj1.height / 2),
        obj2CenterX = obj2.x + (obj2.width / 2),
        obj2CenterY = obj2.y + (obj2.height / 2);

    var r = obj1Radius + obj2Radius,
        dx = obj1CenterX - obj2CenterX;
        dy = obj1CenterY - obj2CenterY;

    return r * r > (dx * dx + dy * dy);
}

function distanceBetweenSelfAndObject (self, obj) {

    objCenterX  = obj.x + (obj.width / 2);
    objCenterY  = obj.y + (obj.height / 2);
    selfCenterX = self.x + (self.width / 2);
    selfCenterY = self.y + (self.height / 2);

    var dX = Math.pow((objCenterX - selfCenterX), 2),
        dY = Math.pow((objCenterY - selfCenterY), 2),
        distance = Math.sqrt(dX + dY);

    return distance;
}

function getAngleBetweenTwoVectors(v1, v2) {

    var angle = 0;

    if(v2) {

        var dot1 = v1.x * v2.x,
            dot2 = v1.y * v2.y,

            norm1 = Math.sqrt( (v1.x * v1.x) + (v1.y * v1.y) ),
            norm2 = Math.sqrt( (v2.x * v2.x) + (v2.y * v2.y) ),

            dots = dot1 + dot2,
            norm = norm1 * norm2;

        angle = Math.acos(dots / norm);

    } else {
        angle = Math.atan2(v1.y, v1.x);
    }

    return angle; // in radian
}

function getAngleBetweenTwoVectorsInDegree(v1, v2) {

    var angle = radionToDegree(getAngleBetweenTwoVectors(v1, v2));
    return angle;
}

function getDistanceToEdge(width) {
    var edgeLength = width / 2,
        c = Math.sqrt( Math.pow(edgeLength, 2) + Math.pow(edgeLength, 2));
    return c;
}

function degreeToRadian(angle) {
    return angle * (Math.PI / 180);
}

function radionToDegree(angle) {
    return angle * (180 / Math.PI);
}

function drawLine(ctx, fromX, fromY, toX, toY, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY); 
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.closePath();
}

/*
    ------------------------------------------------------
    Board Object
    defines the area in which the bots and items move
*/
var Board = {

    width : 1000,
    height : 600,
    x : 0,
    y : 0,
    centerX : this.width / 2,
    centerY : this.height / 2,
    borderOffset : 20,

    init : function(width, height) {
        this.width = width;
        this.height = height;
    },

    drawBorder : function() {
        GameEngine.ctx.lineWidth = 1;
        GameEngine.ctx.strokeStyle = '#222';
        GameEngine.ctx.stroke();
        GameEngine.ctx.strokeRect(this.x + this.borderOffset, this.y + this.borderOffset, this.width - (this.borderOffset * 2), this.height - (this.borderOffset * 2));
    },

    getRandomBoardPosition : function() {

        var x = getRandomInt(this.borderOffset + 5, this.width - this.borderOffset - 5),
            y = getRandomInt(this.borderOffset + 5, this.height - this.borderOffset - 5);

        return { x: x , y: y};
    },

    // Returns true if obj is within the game board borders
    positionIsWithinBoard : function(obj) {
        var xPosition = (obj.x > this.borderOffset && obj.x + obj.width < this.width - this.borderOffset),
            yPosition = (obj.y > this.borderOffset && obj.y + obj.height < this.height - this.borderOffset);

        return (xPosition && yPosition);
    }
};

/*
    ------------------------------------------------------
    GameEngine Object    
*/
var GameEngine = {

    canvas : null,
    ctx : null,

    simulationTime : 60,
    timer : null,
    speed : 0.1,
    maxSpeed : 2,

    graphicManager : null,

    init : function() {
        this.graphicManager = GraphicManager;
        this.graphicManager.init();

        this.canvas = document.getElementById('canvas');
        this.ctx    = this.canvas.getContext('2d');

        Board.init(this.canvas.width, this.canvas.height);

        jQuery(this.canvas).on('click', jQuery.proxy(GraphicManager.handleClickOnGraphic, GraphicManager));
    },

    start : function() {
        this.draw();
    },

    stop : function() {
        cancelAnimationFrame();
    },

    reset : function() {

    },

    draw : function() {

        GameEngine.ctx.clearRect(0, 0, Board.width, Board.height);

        Board.drawBorder();

        var graphics = GameEngine.graphicManager.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {

            // Improve performance, by only checking bot-collisions
            if (graphics[i].type === 'bot') {
                GameEngine.checkCollision(graphics[i]);
            }

            graphics[i].update();
            graphics[i].draw();
        }

        requestAnimationFrame(GameEngine.draw);
    },

    checkCollision : function(graphic) {
        var graphics = GameEngine.graphicManager.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {
            // A bot collided with other object
            if(graphic.isCollidingWith(graphics[i])) {
                graphic.collidedWith(graphics[i]);
                graphics[i].collidedWith(graphic);
            }
        }
    }
};

/*
    ------------------------------------------------------
    GraphicManager Object
    holds and manages all graphics
*/
var GraphicManager = {

    graphics : [],
    botList : null,
    botCounter : 0,
    itemCounter : 0,
    infoBox : null,
    observeInterval : null,

    init : function() {
        this.botList = jQuery('#botList');
        this.botList.on('click', jQuery.proxy(GraphicManager.handleClickOnBotListItem, this));

        this.infoBox = jQuery('#info');
    },

    addBotToList : function(bot) {
        var li = jQuery('<li></li>');
        li.html('Bot ' + bot.id).attr('data-id', bot.id);

        this.botList.append(li);
    },

    handleClickOnGraphic : function(e) {
        this.mouseX = e.pageX - jQuery('#canvas').offset().left;
        this.mouseY = e.pageY - jQuery('#canvas').offset().top;

        var graphics = this.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {

            this.graphics[i].deselect();

            if (isWithinArea(this.mouseX, this.mouseY, graphics[i])) {
                this.selected(graphics[i]);
                return;
            }
        }

        this.clearObserver();
        this.clearInfoBox();
    },

    selected : function(graphic) {
        graphic.selected();
        this.observeGraphic(graphic);

        if(graphic.type === 'bot') {
            this.highlightBotListElement(graphic);
            this.printInfo(graphic);
        }
    },

    highlightBotListElement : function (graphic) {
        this.clearInfoBox();
        this.botList.find('li').eq(graphic.id).addClass('active');
    },

    printInfo : function(graphic) {
        var info = graphic.getInfoText();
        this.infoBox.html(info);
    },

    clearInfoBox : function() {
        this.botList.find('li').removeClass('active');
        this.infoBox.html('');
    },

    handleClickOnBotListItem : function(e) {
        var botId = e.target.getAttribute('data-id'),
            bot = this.getGraphicById(botId);

        this.deselectAll();
        this.selected(bot);
    },

    deselectAll : function(graphic) {
        var self = this;

        this.traverseGraphics(function (graphic) {
            graphic.deselect.call(graphic);
        });
    },

    traverseGraphics : function(callback) {

        var graphics = this.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {
            callback(this.graphics[i]);
        }
    },

    observeGraphic : function(graphic) {
        var self = this;

        this.clearObserver();

        this.observeInterval = setInterval(function() {
            self.printInfo(graphic);
        }, 100);
    },

    clearObserver : function() {
        if(this.observeInterval) {
            clearInterval(this.observeInterval);
            this.observeInterval = null;
        }
    },

    reset : function() {
        var graphics = this.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {
            graphics[i].reset();
        }
    },

    addGraphic : function(_type, _options) {
        var graphic = null;

        switch(_type) {

            case ('bot') :
                graphic = new Bot(_options);
                this.addBotToList(graphic);
                break;

            case ('puck') :
                graphic = new Puck(_options);
                break;
        }

        this.graphics.push(graphic);
    },

    removeGraphic : function() {

    },

    getGraphicById : function(id) {
        return this.graphics[id];
    },

    findGraphicById : function(id, type) {

        var graphics = this.graphics,
            len = graphics.length,
            i = 0,
            id = parseInt(id, 10);

        for (i = 0; i < len; i++) {
            if (graphics[i].id === id) {
                return graphics[i];
            }
        }

        return null;
    },

    // Add number of objects
    addObjects : function (num, type) {
        var i = 0;

        for (i = 0; i < num; i++) {
            var position = Board.getRandomBoardPosition(),
                id = this.graphics.length;

            this.addGraphic(type, {
                id: id,
                x : position.x,
                y : position.y
            });
        }
    }
};