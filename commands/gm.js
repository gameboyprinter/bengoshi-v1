const util = require("../util.js");

module.exports = {
    name: 'gm',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (!client.moderator)
            return;
        else {
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/gm (message)"], client.websocket);
                return;
            }
            for (let i = 0; i < rooms.length; i++) {
                util.broadcast("CT", ["[MODERATOR]", args[0]], i);
            }
        }
    }
}