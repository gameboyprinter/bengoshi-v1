const util = require("../util.js");

module.exports = {
    name: 'getarea',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        util.send(client.socket, "CT", ["Server", "You are in Room " + client.room + ", " + config.rooms[client.room]], client.websocket);
        return;
    }
}