const util = require("../util.js");

module.exports = {
    name: 'background',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/background (background)"], client.websocket);
        }
        if (!rooms[client.room].BGLock || client.moderator) {
            let success = false;
            config.backgrounds.forEach((bg) => {
                if (bg.toLowerCase() == args[0]) {
                    util.broadcast("BN", [args[0]], client.room);
                    rooms[client.room].background = args[0];
                    util.send(socket, "CT", ["Server", "Background changed to " + bg], client.websocket);
                    success = true;
                }
            });
            if (!success)
                util.send(socket, "CT", ["Server", "Not a valid background!"], client.websocket);
            return;
        }
        util.send(socket, "CT", ["Server", "Background is locked"], client.websocket);

    }
}