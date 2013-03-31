var BotList = {

    botList : null,
    infoBox : null,

    init : function() {
        this.objectManager = ObjectManager;

        this.botList = jQuery('#botList');
        this.botList.on('click', jQuery.proxy(this.handleClickOnBotListItem, this));

        this.infoBox = jQuery('#info');
    },

    addBotToList : function(bot) {
        var li = jQuery('<li></li>');
        li.html('Bot ' + bot.id).attr('data-id', bot.id);

        this.botList.append(li);
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
            bot = this.objectManager.getObjectById(botId);

            console.log(bot);

        this.deselectAll();
        this.objectManager.selected(bot);
    },

    deselectAll : function(graphic) {
        var self = this;

        this.objectManager.traverseObjects(function (graphic) {
            graphic.deselect.call(graphic);
        });
    }
}