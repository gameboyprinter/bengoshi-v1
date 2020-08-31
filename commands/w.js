const util = require("../util.js");

module.exports = {
    name: 'w',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length < 2) {
            util.send(socket, "CT", ["Server", "/w (target) (words)"], client.websocket);
            return;
        }
        config.characters.forEach((char) => {
            if (char.toLowerCase() == args[0].toLowerCase()) {
                util.clients.forEach((mclient) => {
                    if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                        args.shift();
                        util.send(socket, "CT", ["(To " + config.characters[mclient.char] + ")", args.join(" ")], client.websocket);
                        util.send(mclient.socket, "CT", [config.characters[client.char] + " whispered to you", args.join(" ")], mclient.websocket);
                    }
                });
            }
        });
        return;
    }
}