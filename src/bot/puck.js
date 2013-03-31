// ----------------------------------
var Puck = function(_options) {
    
    Graphic.apply(this, arguments);

    this.type = 'puck';

    this.width = 5;
    this.height = 5;

    this.isTaken = false;
    this.bot = null;

    this.color = getRandomColor();
    this.drawFunction = this.drawShape;
};

Puck.prototype = new Graphic();

Puck.prototype.update = function() {

    if(this.isTaken) {
        
        // Sync coordinates to prevent errors in positionating
        this.x = this.bot.x + (this.bot.width / 2);
        this.y = this.bot.y + (this.bot.height / 2);

        this.x += this.bot.vx * this.bot.speed;
        this.y += this.bot.vy * this.bot.speed;
    }

};

Puck.prototype.isTakenBy = function(_bot) {
    
    this.bot = _bot;

    if(_bot) {
        this.isTaken = true;
    } else {
        this.isTaken = false;
    }
};