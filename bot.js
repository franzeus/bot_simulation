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


// ----------------------------------
var Graphic = function(_options) {
    this.id = _options.id;
    this.isVisible = true;
    this.shape = null;
};

Graphic.prototype = {

    draw : function() {
        if(this.isVisible) {
            this.shape.draw();
        }
    },

    // Returns true if obj is within the game board borders
    isWithinBoard : function() {
        return positionIsWithinBoard(this);
    },

    reset : function() {

    }
};

// ----------------------------------
var Bot = function(_options) {

    // Set: id, x, y, color
    jQuery.extend(this, _options);

    this.isVisible = true;
    this.type = 'bot';

    this.width = 20;
    this.height = 20;
    this.defaultColor = getRandomColor();
    this.color = this.defaultColor;
    this.directionLineColor = getRandomColor();

    this.selectColor = '#D98E1A';
    this.isSelected = false;

    this.speed = 0.1;
    this.setVector(getRandomInt(0, 10), getRandomInt(0, 10));
    // The max distance to the edge of the bounding box
    this.maxBorderDistance = Math.floor(getDistanceToEdge(this.width));

    this.hasPuck = false;
    this.puck = null;
    this.pucks = [];
    this.collectedPucks = 0;

    this.trace = [];

    this.mode = 'search';
    this.angle = 0;

    this.setRandomDirection();
};

Bot.prototype = {

    reset : function() {
        this.isSelected = false;
        this.color = this.defaultColor;
    },

    shape : function() {

        var ctx = GameEngine.ctx;

        ctx.save();

        var centerX = this.x + (this.width / 2),
            centerY = this.y + (this.height / 2);

            // Translate to center point       
            ctx.translate(centerX, centerY);
            // Rotate
            ctx.rotate(this.angle);
            // Translate back
            ctx.translate(-centerX, -centerY);

            // Draw shape
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Draw select stroke
            if (this.isSelected) {
                ctx.strokeStyle = this.selectColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }

            // Draw direction-line
            ctx.fillStyle = this.directionLineColor;
            ctx.fillRect(this.x + (this.width / 2), this.y + (this.height / 2), this.width / 2, 1);

        ctx.restore();

        this.drawTrace(ctx);
    },

    draw : function() {
        if(this.isVisible) {
            this.shape();
        }
    },

    drawTrace : function(ctx) {

        if (!this.isSelected) {
            return false;
        }

        var i = 0,
            len = this.trace.length;

        for (i = 0; i < len; i++) {
            
            var trace = this.trace[i];

            // Draw trace line
            ctx.fillStyle = this.color;
            ctx.fillRect(trace.x, trace.y, 1, 1);

        }
    },

    update : function() {

        this.collidesWithBoardBorder();

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        if (this.isSelected) {

            var centerX = this.x + (this.width / 2),
                centerY = this.y + (this.height / 2),
                traceLastIndex = this.trace.length - 1,
                lastTracePoint = this.trace[traceLastIndex];

            // Check if same last trace point, does not get added twice
            if (lastTracePoint) {
                if (lastTracePoint.x === centerX && lastTracePoint.y === centerY) {
                    return;
                }
            }

            this.trace.push({ x: centerX, y: centerY });
        }

    },

    collidesWithBoardBorder : function() {

        if(Board.positionIsWithinBoard(this)) {
            return false;
        }

        if (this.x < Board.borderOffset || this.x + this.width >= Board.width - Board.borderOffset) {
            var vx = this.vx * -1;
            this.setVector(vx, this.vy);
        }

        if (this.y < Board.borderOffset || this.y + this.height >= Board.height - Board.borderOffset) {
            var vy = this.vy * -1;
            this.setVector(this.vx, vy);
        }

    },

    isCollidingWith : function(obj) {

        // Can not collide with itself
        if (this === obj) {
            return false;
        }

        if (Math.abs(distanceBetweenSelfAndObject(this, obj)) <= this.maxBorderDistance) {
            return true;
        }

        return false;
    },

    collidedWith : function(obj) {

        if (obj.type === 'puck') {

            this.handlePuck(obj);

        } else if (obj.type === 'bot') {
            this.inverseDirection();
        }

    },

    inverseDirection : function() {
        this.setVector(-this.vx, -this.vy);
    },

    getRandomDirection : function() {
        var x = getRandomInt(-10, 10),
            y = getRandomInt(-10, 10);

        return { x: x, y: y };
    },

    setRandomDirection : function() {

        var self = this;

        setInterval(function() {

            if(self.mode === 'search') {
                self.changeToRandomDirection.apply(self);
            }

        }, getRandomInt(1000, 10000));

    },

    changeToRandomDirection : function () {
        var newPos = this.getRandomDirection();
        this.setVector(newPos.x, newPos.y);
    },

    setVector : function(vx, vy) {
        this.vx = vx;
        this.vy = vy;

        this.adaptAngle();
    },

    adaptAngle : function() {
        this.angle = getAngleBetweenTwoVectors({x: this.vx, y: this.vy});
    },

    handlePuck : function(puck) {

        // Is carrying this puck
        if(this.pucks[0] === puck) {
            return false;
        }

        // Collect puck if has none and puck is not taken
        if (!this.hasPuck && !puck.isTaken) {
            this.takePuck(puck);

        // drop if has puck collided with not taken puck
        } else if (this.hasPuck && !puck.isTaken) {
            this.inverseDirection();
            this.dropPuck(puck);
        }
    },

    takePuck : function(puck) {
        this.hasPuck = true;
        puck.isTakenBy(this);
        this.pucks.push(puck);
        this.collectedPucks += 1;
    },

    dropPuck : function(puck) {

        var currentPuck = this.pucks[0],
            self = this;
        currentPuck.isTakenBy(null);

        if(this.pucks.length > 0) {
            // Change the offset of the drop coordinates a bit
            var directionX = this.vx > 0 ? -1 : 1,
                directionY = this.vy > 0 ? -1 : 1;
            currentPuck.x = puck.x + puck.width + (getRandomInt(5, 10) * directionX);
            currentPuck.y = puck.y + puck.height + (getRandomInt(5, 10) * directionY);
        }

        setTimeout(function () {
            self.pucks = [];
            self.hasPuck = false;
            self.color = self.defaultColor;
        }, 500);
    },

    selected : function() {
        //this.color = this.selectColor;
        this.isSelected = true;
    },

    deselect : function() {
        this.color = this.defaultColor;
        this.isSelected = false;
        this.trace = [];
    },

    getInfoText : function() {
        var info = 'Bot ' + this.id,
            hasItem = this.hasPuck ? "yes" : "no";
        info += '<br>';
        info += 'X:' + Math.round(this.x);
        info += '<br>';
        info += 'Y:' + Math.round(this.y);
        info += '<br>';
        info += 'Has item: ' + hasItem;

        return info;
    }

};

// ----------------------------------
var Puck = function(_options) {
    jQuery.extend(this, _options);

    this.type = 'puck';

    this.width = 5;
    this.height = 5;

    this.isVisible = true;
    this.isTaken = false;
    this.bot = null;

    this.color = getRandomColor();
};

Puck.prototype = {

    shape : function() {
        GameEngine.ctx.fillStyle = this.color;
        GameEngine.ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    draw : function() {
        if(this.isVisible) {
            this.shape();
        }
    },

    update : function() {
        if(this.isTaken) {
            // Sync coordinates to prevent errors in positionating
            this.x = this.bot.x + (this.bot.width / 2);
            this.y = this.bot.y + (this.bot.height / 2);

            this.x += this.bot.vx * this.bot.speed;
            this.y += this.bot.vy * this.bot.speed;
        }
    },

    collidedWith : function(obj) {
        return;
    },

    isTakenBy : function(_bot) {
        this.bot = _bot;

        if(_bot) {
            this.isTaken = true;
        } else {
            this.isTaken = false;
        }
    },

    selected : function() {
        console.log(this.id);
    },

    deselect : function() {

    },

    getInfoText : function() {
        return '';
    }
};