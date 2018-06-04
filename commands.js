const util = require("./util.js");

function parseCmd(cmd, args, socket, client, config) {
    switch (cmd) {
        case "/mute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/mute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = true;
                            util.send(mclient.socket, "MU", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/unmute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/unmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = false;
                            util.send(mclient.socket, "UM", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/ban":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/ban (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            util.send(mclient.socket, "KB", [], mclient.websocket)
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
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/kick (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            util.send(mclient.socket, "KK", [], mclient.websocket)
                            socket.end();
                        }
                    });
                }
            });
            break;
        case "/pos":
            util.send(client.socket, "CT", ["Server", "You are in Room " + client.room + ", " + config.rooms[client.room]], client.websocket);
            break;
        case "/w":
            if (args.length < 2) {
                util.send(socket, "CT", ["Server", "/w (target) (words)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            args.shift();
                            util.send(socket, "CT", ["(To " + config.characters[mclient.char] + ")", args.join(" ")], client.websocket);
                            util.send(mclient.socket, "CT", [config.characters[client.char] + " whispered to you", args.join(" ")], mclient.websocket);
                        }
                    });
                }
            });
            break;
            case "/roll":
                if(args.length < 1){
                    util.send(socket, "CT", ["Server", "/roll (diesize)"], client.websocket);
                    break;
                }
                util.broadcast("CT", ["1d" + args[0], getRandomInt(1, parseInt(args[0]) + 1) + ""], client.room);
                break;
        default:
            util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
    }
}

function getRandomInt(min, max) {
    if(min == NaN || max == NaN)
        return -1;
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = {
    parseCmd: parseCmd
};