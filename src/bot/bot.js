// ----------------------------------
var Bot = function(_options) {

    Graphic.apply(this, arguments);
    this.type = 'bot';

    this.width = 20;
    this.height = 20;
    this.defaultColor = getRandomColor();
    this.color = this.defaultColor;
    this.directionLineColor = getRandomColor();

    this.selectColor = '#D98E1A';
    this.isSelected = false;

    this.speed = GameEngine.speed;
    this.setVector(getRandomInt(0, 10), getRandomInt(0, 10));
    
    // The max distance to the edge of the bounding box
    this.maxBorderDistance = Math.floor(getDistanceToEdge(this.width));

    this.hasPuck = false;
    this.puck = null;
    this.pucks = [];
    this.collectedPucks = 0;

    this.trace = [];

    this.mode = 'search';

    this.drawFunction = this.drawShape;
    this.setRandomDirection();
};

Bot.prototype = new Graphic();

Bot.prototype.reset = function() {
    this.isSelected = false;
    this.color = this.defaultColor;
};

/*Bot.prototype.drawShape = function() {

    var ctx = this.ctx;

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
    
    if (this.isSelected) {
        this.drawTrace();
    }
};*/

Bot.prototype.drawTrace = function() {

    if (!this.isSelected) {
        return false;
    }

    BotTrace.draw(this.x, this.y, this.getCenter(), this.color);
};

Bot.prototype.update = function() {

    this.collidesWithBoardBorder();

    this.x += this.vx * GameEngine.ENV.speed;
    this.y += this.vy * GameEngine.ENV.speed;

    if (this.isSelected) {
        this.drawTrace();
    }

};

Bot.prototype.collidesWithBoardBorder = function() {

    if(World.positionIsWithinWorld(this)) {
        return false;
    }

    if (this.x < World.borderOffset || this.x + this.width >= World.width - World.borderOffset) {
        var vx = this.vx * -1;
        this.setVector(vx, this.vy);
    }

    if (this.y < World.borderOffset || this.y + this.height >= World.height - World.borderOffset) {
        var vy = this.vy * -1;
        this.setVector(this.vx, vy);
    }

};

Bot.prototype.isCollidingWith = function(obj) {

    // Can not collide with itself
    if (this === obj) {
        return false;
    }

    // Accurate collision detection is not really important here,
    // so just treat it as if they were circles (and neglect the rotation)
    if (collisionBetweenTwoCircles(this, obj, true)) {
        return true;
    }

    return false;
};

Bot.prototype.hasCollidedWith = function(obj) {

    if (obj.type === 'puck') {

        this.handlePuck(obj);

    } else if (obj.type === 'bot') {
        this.inverseDirection();
    }

};

Bot.prototype.handlePuck = function(puck) {

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
};

Bot.prototype.takePuck = function(puck) {
    this.hasPuck = true;
    puck.isTakenBy(this);
    this.pucks.push(puck);
    this.collectedPucks += 1;
};

Bot.prototype.dropPuck = function(puck) {

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
};

Bot.prototype.selected = function() {
    //this.color = this.selectColor;
    this.isSelected = true;
};

Bot.prototype.deselect = function() {
    this.color = this.defaultColor;
    this.isSelected = false;
    BotTrace.clear();
};

Bot.prototype.getInfoText = function() {
    var info = 'Bot ' + this.id,
        hasItem = this.hasPuck ? "yes" : "no";
    info += '<br>';
    /*info += 'X:' + Math.round(this.x);
    info += '<br>';
    info += 'Y:' + Math.round(this.y);
    info += '<br>';*/
    info += 'Has item: ' + hasItem;

    return info;
};