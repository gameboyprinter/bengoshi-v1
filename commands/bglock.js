const util = require("../util.js");

module.exports = {
    name: 'bglock',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (client.moderator) {
            rooms[client.room].BGLock = !rooms[client.room].BGLock;
            util.send(socket, "CT", ["Server", "Background lock toggled"], client.websocket);
        }
        return;
    }
}