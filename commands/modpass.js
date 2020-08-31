const util = require("../util.js");

module.exports = {
    name: 'modpass',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length >= 1) {
            if (args[0] == config.modpass) {
                util.send(socket, "CT", ["Server", "Correct password!"], client.websocket);
                client.moderator = true;
            }
        }
        return;
    }
}