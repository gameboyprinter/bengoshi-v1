const util = require("../util.js");

function getRandomInt(min, max) {
    if (min == NaN || max == NaN)
        return -1;
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = {
    name: 'roll',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/roll (diesize)"], client.websocket);
            return;
        }
        util.broadcast("CT", ["1d" + args[0], getRandomInt(1, parseInt(args[0]) + 1) + ""], client.room);
        return
    }
}