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

// ----------------------------------
var Board = {
    width : 800,
    height : 400,
    x : 0,
    y : 0,
    centerX : this.width / 2,
    centerY : this.height / 2,
    borderOffset : 20,

    drawBorder : function() {
        GameEngine.ctx.lineWidth = 1;
        GameEngine.ctx.strokeStyle = '#CCC';
        GameEngine.ctx.stroke();
        GameEngine.ctx.strokeRect(this.x + this.borderOffset, this.y + this.borderOffset, this.width - (this.borderOffset * 2), this.height - (this.borderOffset * 2));
    }
}

// ----------------------------------
var GameEngine = {

    canvas : null,
    ctx : null,

    simulationTime : 60,
    timer : null,
    
    graphicManager : null,

    init : function() {
        this.graphicManager = GraphicManager;

        this.canvas = document.getElementById('canvas');
        this.ctx    = this.canvas.getContext('2d');

        jQuery(this.canvas).on('click', jQuery.proxy(GraphicManager.handleClick, GraphicManager));
    
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

        GameEngine.ctx.clearRect(0, 0, 800, 600);

        Board.drawBorder();    

        var graphics = GameEngine.graphicManager.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {

            // Improve performance, by only checking bot-collisions
            if (graphics[i].type === 'bot') {
                GameEngine.checkCollision(graphics[i])
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
}

// ----------------------------------
var GraphicManager = {

    graphics : [],

    handleClick : function(e) {
        this.mouseX = e.pageX - jQuery('#canvas').offset().left;
        this.mouseY = e.pageY - jQuery('#canvas').offset().top;

        var graphics = this.graphics,
            len = graphics.length,
            i = 0;  

        for (i = 0; i < len; i++) {
            if (isWithinArea(this.mouseX, this.mouseY, graphics[i])) {
                graphics[i].selected();       
            }
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
                break;

            case ('puck') :
                graphic = new Puck(_options);
                break;
        }

        this.graphics.push(graphic);
    },

    removeGraphic : function() {

    },

    findGraphicById : function() {
        
    },

    getRandomBoardPosition : function() {

        var x = getRandomInt(Board.borderOffset, Board.width - Board.borderOffset),
            y = getRandomInt(Board.borderOffset, Board.height - Board.borderOffset);

        return { x: x , y: y};
    },

    // Returns true if obj is within the game board borders
    positionIsWithinBoard : function(x, y) {
        var xPosition = (x > Board.borderOffset && x < Board.width - Board.borderOffset),
            yPosition = (y > Board.borderOffset && y < Board.height - Board.borderOffset);
        
        return (xPosition && yPosition);
    }
}


// ----------------------------------
var Graphic = function(_options) {
    this.id = _options.id;
    this.isVisible = true;
    this.shape = null;
}

Graphic.prototype = {

    draw : function() {
        if(this.isVisible) {
            this.shape.draw();
        }
    },

    // Returns true if obj is within the game board borders
    isWithinBoard : function() {            
        return positionIsWithinBoard(this.x, this.y);
    },

    reset : function() {

    }
}

// ----------------------------------
var Bot = function(_options) {

    jQuery.extend(this, _options);
    // x, y, color
    this.isVisible = true;

    this.type = 'bot';

    this.width = 20;
    this.height = 20;
    this.defaultColor = '#333'
    this.color = this.defaultColor;

    this.speed = 0.1;
    this.vx = getRandomInt(0, 10);
    this.vy = getRandomInt(0, 10);

    this.hasPuck = false;
    this.puck = null;
    this.pucks = [];

    this.mode = 'search';

    this.setRandomDirection();
}

Bot.prototype = {

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

        this.collidesWithBoardBorder();

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
    },

    collidesWithBoardBorder : function() {
        
        if(GraphicManager.positionIsWithinBoard(this.x, this.y))
            return false;

        if (this.x < Board.borderOffset || this.x + this.width >= Board.width - Board.borderOffset) {
            this.vx = -this.vx;
        }

        if (this.y < Board.borderOffset || this.y + this.height >= Board.height - Board.borderOffset) {
            this.vy = -this.vy;
        }

    },

    isCollidingWith : function(obj) {

        // Can not collide with itself
        if (this === obj) {
            return false;
        }

        if (distanceBetweenSelfAndObject(this, obj) <= this.width) {
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

        return { x: x, y: y}
    },

    setRandomDirection : function() {
        
        var self = this;

        setInterval(function() {

            if(self.mode === 'search') {
                var newPos = self.getRandomDirection();
                self.setVector(newPos.x, newPos.y);
            }

        }, getRandomInt(1000, 10000));

    },

    setVector : function(vx, vy) {
        this.vx = vx;
        this.vy = vy;
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
        this.color = '#888';
    },

    dropPuck : function(puck) {
        
        var currentPuck = this.pucks[0];
        currentPuck.isTakenBy(null);

        if(this.pucks.length > 0) {
            var directionX = this.vx > 0 ? -1 : 1,
                directionY = this.vy > 0 ? -1 : 1;
            currentPuck.x = puck.x + puck.width + (getRandomInt(5, 10) * directionX);
            currentPuck.y = puck.y + puck.height + (getRandomInt(5, 10) * directionY);
        }

        var self = this;
        setTimeout(function(){
            self.pucks = [];
            self.hasPuck = false;
            self.color = self.defaultColor;
        }, 500);
    },

    selected : function() {
        console.log(this);
    }

}

// ----------------------------------
var Puck = function(_options) {
    jQuery.extend(this, _options);

    this.type = 'puck';

    this.width = 5;
    this.height = 5;

    this.isVisible = true;
    this.isTaken = false;
    this.bot = null;

    this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
}

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
            this.x = this.bot.x + (this.bot.width / 2);
            this.y = this.bot.y + (this.bot.height / 2);

            this.x += this.bot.vx * this.bot.speed;
            this.y += this.bot.vy * this.bot.speed;
        }
    },

    collidedWith : function(obj) {

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
    }


}