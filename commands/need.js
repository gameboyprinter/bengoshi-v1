const util = require("../util.js");

module.exports = {
    name: 'need',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/need (message)"], client.websocket);
            return;
        }
        for (let i = 0; i < rooms.length; i++) {
            util.broadcast("CT", ["LOOKING FOR", args[0]], i);
        }
        return;
    }
}