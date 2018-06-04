const util = require("./util.js");

function parseCmd(cmd, args, socket, client, config) {
    switch (cmd) {
        case "/mute":
            if (!client.moderator) {
                send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/mute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = true;
                            send(mclient.socket, "MU", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/unmute":
            if (!client.moderator) {
                send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/unmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = false;
                            send(mclient.socket, "UM", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/ban":
            if (!client.moderator) {
                send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/ban (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            send(mclient.socket, "KB", [], mclient.websocket)
                            socket.end();
                            config.bans.push({
                                ip: mclient.socket.remoteAddress,
                                hwid: mclient.hardware
                            });
                            fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
                        }
                    });
                }
            });
            break;
        case "/kick":

            if (!client.moderator) {
                send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/kick (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            send(mclient.socket, "KK", [], mclient.websocket)
                            socket.end();
                        }
                    });
                }
            });
            break;
        case "/pos":
            send(client.socket, "CT", ["Server", "You are in Room " + client.room + ", " + config.rooms[client.room]], client.websocket);
            break;
        case "/w":
            if (args.length < 2) {
                send(socket, "CT", ["Server", "/w (target) (words)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            args.shift();
                            send(socket, "CT", ["(To " + config.characters[mclient.char] + ")", args.join(" ")], client.websocket);
                            send(mclient.socket, "CT", [config.characters[client.char] + " whispered to you", args.join(" ")], mclient.websocket);
                        }
                    });
                }
            });
            break;
        default:
            send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = {
    parseCmd: parseCmd
};