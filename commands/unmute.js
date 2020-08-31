const util = require("../util.js");

module.exports = {
    name: 'unmute',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (!client.moderator) {
            util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
            return;
        }
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/unmute (player)"], client.websocket);
            return;
        }
        config.characters.forEach((char) => {
            if (char.toLowerCase() == args[0].toLowerCase()) {
                util.clients.forEach((mclient) => {
                    if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                        mclient.mute = false;
                        util.send(mclient.socket, "UM", [], mclient.websocket)
                    }
                });
            }
        });
        return;
    }
}