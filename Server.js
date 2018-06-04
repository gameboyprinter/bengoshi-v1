const net = require("net");
const config = require("./config.json");
const crypto = require("crypto");
const fs = require("fs");

const port = config.port;
const maxPlayers = config.maxPlayers;
var clients = [];
var currentID = 0;
var players = 0;
var taken = [];
var roomSongs = [];
var musicIntervals = [];

for (var i = 0; i < config.characters.length; i++)
    taken[i] = 0;
for (var i = 0; i < config.rooms.length; i++)
    roomSongs.push("");

function loopMusic(room) {
    broadcast("MC", [roomSongs[room], -1], room);
}

function fantaDecrypt(data) {
    var bytes = Buffer.from(data, "hex");
    if (data == "CC" || bytes.length != (data.length / 2)) // Shitty heuristic, this will return the input if the input isnt all hex characters
        return data; // This allows "detection" of encrypted packets
    key = 5; // fantacrypt constant
    var cleartext = "";
    bytes.forEach((byte) => {
        cleartext += String.fromCharCode(byte ^ ((key & 0xFFFF) >> 8));
        key = ((byte + key) * 53761) + 32618 // more fantacrypt constants
    });
    return cleartext;
}

function isConnected(socketName) {
    clients.forEach((client) => {
        if (client.name === socketName)
            return true;
    });
    return false;
}

function packetBuilder(header, packetContents) {
    var packet = header + "#";
    packetContents.forEach((datum) => {
        packet += datum.toString() + "#";
    });
    packet += "%";
    return packet;
}

function broadcast(header, data, room) {
    clients.forEach((client) => {
        if (client.name == undefined)
            return;
        if (client.room == room) {
            send(client.socket, header, data, client.websocket);
        }

    });
}

function send(socket, header, data, ws) {
    if (ws) {
        data = packetBuilder(header, data);
        var frame = [];
        frame.push(0x81); // text opcode
        if (data.length < 126)
            frame.push(data.length & 0x7F);
        else { // TODO: implement 64 bit length
            frame.push(126);
            frame.push((data.length & 0xFF00) >> 8);
            frame.push((data.length & 0xFF));
        }
        for (var i = 0; i < data.length; i++) {
            frame.push(data.charCodeAt(i));
        }
        socket.write(Buffer.from(frame));
    } else {
        socket.write(packetBuilder(header, data));
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function parseModCmd(cmd, args, socket, client) {
    switch (cmd) {
        case "/mute":
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/mute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = true;
                            send(mclient.socket, "MU", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/unmute":
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/unmute (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            mclient.mute = false;
                            send(mclient.socket, "UM", [], mclient.websocket)
                        }
                    });
                }
            });
            break;
        case "/ban":
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/ban (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    clients.forEach((mclient) => {
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
            if (args.length < 1) {
                send(socket, "CT", ["Server", "/kick (player)"], client.websocket);
                break;
            }
            config.characters.forEach((char) => {
                if (char.toLowerCase() == args[0].toLowerCase()) {
                    clients.forEach((mclient) => {
                        if (mclient.char == config.characters.indexOf(char)) {
                            send(mclient.socket, "KK", [], mclient.websocket)
                            socket.end();
                        }
                    });
                }
            });
            break;
        default:
            send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
    }
}

PacketHandler = {
    "HI": (packetContents, socket, client) => {
        config.bans.forEach((ban) => {
            if (ban.hwid == packetContents[0])
                socket.end();
        });
        clients[client.id].hardware = packetContents[0];
        send(socket, "ID", [client.hardware, "bengoshi", "v1"], client.websocket); // TODO: Change these
        if (players >= maxPlayers)
            socket.close();
        send(socket, "PN", [players, maxPlayers], client.websocket);
        send(socket, "FL", ["fastloading", "noencryption", "yellowtext", "websockets", "customobjections", "deskmod"], client.websocket);
        // No more encrypted packets after this
        // TODO: AO1 support
    },
    "ID": (packetContents, socket, client) => {
        clients[client.id].software = packetContents[0];
        clients[client.id].version = packetContents[1];
    },
    "askchaa": (packetContents, socket, client) => {
        send(socket, "SI", [config.characters.length, 0, config.songs.length], client.websocket);
    },
    "RC": (packetContents, socket, client) => {
        send(socket, "SC", config.characters, client.websocket);
    },
    "RM": (packetContents, socket, client) => {
        var songNames = [];
        config.rooms.forEach((room) => {
            if (room.charAt(0) == "#") {
                if (client.moderator)
                    songNames.push(room);
            } else
                songNames.push(room);
        });
        config.songs.forEach((song) => {
            songNames.push(song.name);
        });
        send(socket, "SM", songNames, client.websocket);
    },
    "RD": (packetContents, socket, client) => {
        send(socket, "CharsCheck", taken, client.websocket);
        send(socket, "OPPASS", ["42"], client.websocket);
        send(socket, "DONE", [], client.websocket);
        send(socket, "CT", ["Server", config.motd], client.websocket);
        if (roomSongs[0] != "")
            send(socket, "MC", [roomSongs[0], 0], client.websocket);
    },
    "CC": (packetContents, socket, client) => {
        if (taken[packetContents[1]] == -1)
            return;
        if (clients[client.id].char != undefined)
            taken[clients[client.id].char] = 0;
        taken[packetContents[1]] = -1;
        clients[client.id].char = packetContents[1];
        send(socket, "PV", [client.id, "CID", clients[client.id].char], client.websocket);
        players++;
    },
    "CH": (packetContents, socket, client) => {
        send(socket, "CHECK", [], client.websocket);
    },
    "MS": (packetContents, socket, client) => {
        if (client.mute)
            return;
        broadcast("MS", packetContents, client.room);
    },
    "CT": (packetContents, socket, client) => {
        if (client.mute)
            return;
        if (client.moderator) {
            var input = packetContents[1];
            if (input.charAt(0) == "/") {
                var args = input.split(" ");
                var cmd = args[0];
                args.shift();
                parseModCmd(cmd, args, socket, client);
                return;
            }
        }
        broadcast("CT", packetContents, client.room);
    },
    "MC": (packetContents, socket, client) => {
        var exists = false;
        var time = 0;
        config.songs.forEach((song) => {
            if (song.name == packetContents[0]) {
                exists = true;
                time = Math.floor(song.length * 1000);
            }
        });
        if (exists) {
            roomSongs[client.room] = packetContents[0];
            broadcast("MC", packetContents, client.room);
            clearInterval(musicIntervals[client.room]);
            if (roomSongs[client.room] != "~stop.mp3")
                musicIntervals[client.room] = setInterval(loopMusic, time, client.room);
        }
        if (!exists) {
            if (config.rooms.includes(packetContents[0])) {
                client.room = config.rooms.indexOf(packetContents[0]);
                send(socket, "CT", ["Server", "You moved to room number " + client.room + ", " + packetContents[0]], client.websocket);
                if (roomSongs[client.room] == "")
                    send(socket, "MC", ["~stop.mp3", -1], client.websocket);
                else
                    send(socket, "MC", [roomSongs[client.room], -1], client.websocket);
            }
        }
    },
    "ZZ": (packetContents, socket, client) => {

    },
    "RT": (packetContents, socket, client) => {
        broadcast("RT", packetContents, client.room);
    },
    "HP": (packetContents, socket, client) => {
        broadcast("HP", packetContents, client.room);
    }
};

function cleanup(id) {
    if (taken[clients[id].char])
        players--;
    taken[clients[id].char] = 0;
    clients[id] = {};
}

function decodeWs(data, socket) {
    var payloadLength = 0;
    var opcode = data[0] & 0xF;
    var masked = (data[1] & 0x80) == 0x80;
    var len = data[1] & 0x7F;
    var maskPtr = 0;
    if (opcode == 1) {
        if (len <= 125) {
            payloadLength = len;
            maskPtr = 2;
        } else if (len == 126) {
            payloadLength = (data[2] << 8) | data[3];
            maskPtr = 4;
        } else if (len == 127) {
            payloadLength = (data[2] << 56) | (data[3] << 48) | (data[4] << 40) | (data[5] << 32) | (data[6] << 24) | (data[7] << 16) | (data[8] << 8) | data[9];
            maskPtr = 10;
        }
        var key = [data[maskPtr], data[maskPtr + 1], data[maskPtr + 2], data[maskPtr + 3]];
        maskPtr += 4;
        var unmasked = [payloadLength];
        for (var i = 0; i < payloadLength; i++) {
            unmasked[i] = data[i + maskPtr] ^ key[i % 4];
        }
        var content = Buffer.from(unmasked).toString("utf8");
        return content;
    } else if (opcode == 9) {
        data[0] = (data[0] & 0xF0) || 0xA;
        socket.write(data);
        return;
    } else
        return;
}

net.createServer((socket) => {
    config.bans.forEach((ban) => {
        if (ban.ip == socket.remoteAddress) {
            send(socket, "BD", [], false);
            socket.end();
        }
    });
    var socketName = socket.remoteAddress + ":" + socket.remotePort;
    var client;
    var wsTimeout = setTimeout(() => {
        if (!socket.destroyed)
            socket.write("decryptor#34#%");
    }, 750);
    if (!isConnected(socketName)) {
        client = {
            mute: false,
            badPackets: config.maxBadPackets,
            room: 0,
            websocket: false,
            name: socketName,
            socket: socket,
            id: currentID++
        };
        clients.push(client);
    }

    if (config.mods.includes(socket.remoteAddress))
        client.moderator = true;

    socket.on("data", (data) => {
        if (data.length == 0)
            return;
        var packetContents;
        if (client.websocket) {
            var content = decodeWs(data, socket);
            if (content == null)
                return;
            packetContents = content.split("#");
        }
        if (!client.websocket) {
            var ws = data.toString("utf8").split("\r\n");
            if (ws[0].includes("HTTP/1.1")) {
                // Handle websocket
                clearTimeout(wsTimeout);
                var key;
                ws.forEach((line) => {
                    var fields = line.split(": ");
                    if (fields[0] == "Sec-WebSocket-Key")
                        key = fields[1];
                });
                key = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
                key = crypto.createHash("sha1").update(key).digest("base64");
                var response = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + key + "\r\n\r\n"
                socket.write(response);
                send(socket, "decryptor", ["34"], true);
                client.websocket = true;
                return;
            }
            packetContents = data.toString("utf-8").split("#");
        }

        if (packetContents == null)
            return;
        if (packetContents[0] == "") // for some reason random packets start with a #
            packetContents.shift();
        var header = fantaDecrypt(packetContents[0]);
        packetContents.shift();
        packetContents.pop();

        if (PacketHandler[header] == undefined) {
            console.log("Unimplemented packet: " + header);
            console.log(packetContents);
            console.log(socketName);
            client.badPackets--;
            return;
        }

        // Anti-spam
        if (!client.moderator) {
            if (client.badPackets == 0) {
                send(socket, "KB", [client.char], client.websocket);
                socket.end();
                config.bans.push({
                    ip: socket.remoteAddress,
                    hwid: client.hardware
                });
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
            }
            if (packetContents.length > config.maxArgLength) {
                send(socket, "KB", [client.char], client.websocket);
                socket.end();
                config.bans.push({
                    ip: socket.remoteAddress,
                    hwid: client.hardware
                });
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
            }
            if (header + packetContents.toString() == client.lastPacket)
                client.repeats++;
            else
                client.repeats = 0;
            if (client.repeats >= config.maxRepeats) {
                send(socket, "KB", [client.char], client.websocket);
                socket.end();
                config.bans.push({
                    ip: socket.remoteAddress,
                    hwid: client.hardware
                });
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
            }
            client.lastPacket = header + packetContents.toString();
        }

        PacketHandler[header](packetContents, socket, client);
    });

    socket.on('error', (e) => {
        cleanup(client.id);
        console.log(e);
    });

    socket.on('end', () => {
        cleanup(client.id);
    });

    socket.on('close', () => {
        cleanup(client.id);
    });
}).listen(port);

// Master server advertiser

var client = new net.Socket();
client.connect(27016, "master.aceattorneyonline.com", () => {
    console.log("Master server connection established");
    client.write(packetBuilder("SCC", [port, config.name, config.description, "bengoshi v1"]));
});
