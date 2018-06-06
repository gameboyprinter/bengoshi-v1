const util = require("./util.js");

function parseCmd(cmd, args, socket, client, config, rooms) {
    switch (cmd) {
        case "/bglock":
            if(client.moderator){
                rooms[client.room].BGLock = !rooms[client.room].BGLock;
                util.send(socket, "CT", ["Server", "Background lock toggled"], client.websocket);
            }
            break;
        case "/bg":
        case "/background":
            if(args.length < 1)
            {
                util.send(socket, "CT", ["Server", "/background (background)"], client.websocket);
            }
            if(!rooms[client.room].BGLock || client.moderator){
                var success = false;
                config.backgrounds.forEach((bg) => {
                    if(bg.toLowerCase() == args[0]){
                        util.broadcast("BN", [args[0]], client.room);
                        rooms[client.room].background = args[0];
                        util.send(socket, "CT", ["Server", "Background changed to " + bg], client.websocket);
                        success = true;
                    }
                });
                if(!success)
                    util.send(socket, "CT", ["Server", "Not a valid background!"], client.websocket);
                break;
            }
            util.send(socket, "CT", ["Server", "Background is locked"], client.websocket);
            break;
        case "/modpass":
            if(args.length >= 1){
                if(args[0] == config.modpass){
                    util.send(socket, "CT", ["Server", "Correct password!"], client.websocket);
                    client.moderator = true;
                }
            }
            break;
        case "/ceunmute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/ceunmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                            mclient.cemute = false;
                            util.send(mclient.socket, "UM", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/cemute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/cemute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                            mclient.cemute = true;
                            util.send(mclient.socket, "MU", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/oocunmute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/oocunmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                            mclient.oocmute = false;
                            util.send(mclient.socket, "UM", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/oocmute":
            if (!client.moderator) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
                break;
            }
            if (args.length < 1) {
                util.send(socket, "CT", ["Server", "/oocmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    util.clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                            mclient.oocmute = true;
                            util.send(mclient.socket, "MU", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
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
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
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
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
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
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
                            util.send(mclient.socket, "KK", [], mclient.websocket)
                            mclient.socket.end();
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
                        if (mclient.char == config.characters.indexOf(char) && mclient.room == client.room) {
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