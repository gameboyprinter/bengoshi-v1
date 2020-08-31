const util = require("../util.js");

module.exports = {
    name: 'ban',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (!client.moderator) {
            util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
            return;
        }
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/ban (player)"], client.websocket);
            return;
        }
        config.characters.forEach((char) => {
            if (char.toLowerCase() == args[0].toLowerCase()) {
                util.clients.forEach((mclient) => {
                    if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                        util.send(mclient.socket, "KB", [], mclient.websocket)
                        mclient.socket.end();
                        config.bans.push({
                            ip: mclient.socket.remoteAddress,
                            hwid: mclient.hardware
                        });
                        fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
                    }
                });
            }
        });
        return;
    }
}