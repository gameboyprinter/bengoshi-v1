// All the packet handling and game state (that is not user-specific) takes place here
const fs = require("fs");
const util = require("./util.js");
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

let config = JSON.parse(fs.readFileSync("./config.json"));

// Game state
// TODO: area state objects
let areas = [];

// Initialize areas
let evidenceLists = [];
if (!fs.existsSync("./evidence.json"))
    fs.writeFileSync("./evidence.json", "[]");
else
    evidenceLists = JSON.parse(fs.readFileSync("./evidence.json"));

let initEvidence = evidenceLists.length != config.areas.length;
if (initEvidence)
    evidenceLists = [];
for (let i = 0; i < config.areas.length; i++) {
    if (initEvidence)
        evidenceLists.push([]);
    areas[i] = JSON.parse(JSON.stringify(config.areas[i])); // Deep copy
    areas[i].evidence = evidenceLists[i];
    areas[i].taken = Array.apply(null, Array(config.characters.length)).map(Number.prototype.valueOf, 0);
    areas[i].song = "~stop.mp3";
}

function reloadConf() {
    config = JSON.parse(fs.readFileSync("./config.json"));
}

// This function is called on an interval, per area, to loop music.
function loopMusic(area) {
    util.broadcast("MC", [areas[area].song, -1], area);
}

// Finds area by name
function isarea(name) {
    for (let i = 0; i < areas.length; i++) {
        if (areas[i].name == name)
            return i;
    }
    return -1;
}

// Every FantaPacket is interpreted here
PacketHandler = {
    // Hardware ID
    "HI": (packetContents, socket, client) => {
        config.bans.forEach((ban) => {
            if (ban.hwid == packetContents[0])
                socket.end();
        });
        let hardware = packetContents[0];
        client.hardware = hardware;
        util.send(socket, "ID", [hardware, "bengoshi", "v" + util.softVersion], client.websocket);
        if (util.players >= config.maxPlayers)
            socket.close();
        util.send(socket, "PN", [util.players, config.maxPlayers], client.websocket);
        util.send(socket, "FL", ["fastloading", "noencryption", "yellowtext", "websockets", "customobjections", "deskmod", "flipping"], client.websocket);
        // No more encrypted packets after this
        // TODO: AO1 support
    },
    // Client software version info
    "ID": (packetContents, socket, client) => {
        client.software = packetContents[0];
        client.version = packetContents[1];
    },
    // Char/Music list lengths request
    "askchaa": (packetContents, socket, client) => {
        util.send(socket, "SI", [config.characters.length, evidenceLists[0].length, config.songs.length], client.websocket);
    },
    // Request chars
    "RC": (packetContents, socket, client) => {
        util.send(socket, "SC", config.characters, client.websocket);
    },
    // Request music
    "RM": (packetContents, socket, client) => {
        let songNames = [];
        config.areas.forEach((area) => {
            if (area.private) {
                if (client.moderator)
                    songNames.push(area.name);
            } else
                songNames.push(area.name);
        });
        config.songs.forEach((song) => {
            songNames.push(song.name);
        });
        util.send(socket, "SM", songNames, client.websocket);
    },
    // Request data (taken chars, oppass, loading done)
    "RD": (packetContents, socket, client) => {
        util.send(socket, "CharsCheck", areas[client.area].taken, client.websocket);
        util.send(socket, "OPPASS", ["42"], client.websocket);
        util.send(socket, "DONE", [], client.websocket);
        util.send(socket, "CT", ["Server", config.motd], client.websocket); // Send MOTD
        util.send(socket, "LE", areas[client.area].evidence, client.websocket); // Send evidence
        util.send(socket, "MC", [areas[client.area].song, -1], client.websocket); // Send song
        util.send(socket, "BN", [areas[client.area].background], client.websocket); // Send background
        if (client.software == "TNLIB") {
            util.send(socket, "CT", ["Dear TNC User", "Consider using the vanilla client."], client.websocket);
        }
    },
    // Change character
    "CC": (packetContents, socket, client) => {
        if (areas[client.area].taken[packetContents[1]] == -1)
            return;
        if (client.char != undefined)
            areas[client.area].taken[client.char] = 0;
        areas[client.area].taken[packetContents[1]] = -1;
        client.char = packetContents[1];
        delete client.pos;
        util.send(socket, "PV", [client.id, "CID", client.char], client.websocket); // Char pick success
    },
    // Keepalive heartbeat
    "CH": (packetContents, socket, client) => {
        util.send(socket, "CHECK", [], client.websocket);
    },
    // IC chat
    // TODO: Filtering
    "MS": (packetContents, socket, client) => {
        if (client.mute) {
            util.send(socket, "CT", ["Server", "You are muted!"], client.websocket);
            return;
        }
        if (client.pos != undefined) {
            if (packetContents[5] != client.pos)
                packetContents[12] = 1; // sprite flip
            packetContents[5] = client.pos;
        }
        util.broadcast("MS", packetContents, client.area);
    },
    // OOC Chat
    "CT": (packetContents, socket, client) => {
        if (client.oocmute) {
            util.send(socket, "CT", ["Server", "You are muted!"], client.websocket);
            return;
        }
        let input = packetContents[1];
        if (input.charAt(0) == "/") {
            let args = input.split(" ");
            let cmd = args[0].substring(1);
            args.shift();
            let foundCommand = false
            for (const file of commandFiles) {
                const command = require(`./commands/${file}`)
                if (command.name.includes(cmd)) {
                    foundCommand = true
                    command.respond(cmd, args, socket, client, config, areas)
                    break
                }
            }
            if (foundCommand === false) {
                util.send(socket, "CT", ["Server", "Invalid Command"], client.websocket);
            }
            return;
        }
        util.broadcast("CT", packetContents, client.area);
    },
    // Music change
    // Some music items are used to change areas, however
    // And some are purely decorative (category titles)
    // All of that is handled here
    "MC": (packetContents, socket, client) => {
        let exists = false;
        let time = 0;
        config.songs.forEach((song) => {
            if (song.name == packetContents[0]) {
                if (song.category)
                    return;
                exists = true;
                time = Math.floor(song.length * 1000);
            }
        });
        if (exists) {
            areas[client.area].song = packetContents[0];
            util.broadcast("MC", packetContents, client.area);
            clearInterval(areas[client.area].areaInterval);
            if (areas[client.area].song != "~stop.mp3" && time > 0)
                areas[client.area].areaInterval = setInterval(loopMusic, time, client.area);
        }
        if (!exists) {
            let newarea = isarea(packetContents[0]);
            if (newarea == client.area)
                return;
            if (newarea != -1) {
                if (areas[newarea].taken[client.char] == -1) {
                    let newChar = areas[client.area].taken.indexOf(0);
                    if (newChar == -1) {
                        util.send(socket, "CT", ["Server", "That area is full!"]);
                        return;
                    }
                    client.char = newChar;
                    util.send(socket, "PV", [client.id, "CID", client.char], client.websocket);
                    util.send(socket, "CT", ["Server", "Your character was taken, so you have been assigned to " + config.characters[newChar]], client.websocket);
                }
                areas[client.area].taken[client.char] = 0;
                areas[newarea].taken[client.char] = -1;
                client.area = newarea;
                util.send(socket, "CT", ["Server", "You moved to area number " + client.area + ", " + packetContents[0]], client.websocket);
                util.send(socket, "BN", [areas[client.area].background], client.websocket);
                util.send(socket, "LE", areas[client.area].evidence, client.websocket);
                util.send(socket, "MC", [areas[client.area].song, -1], client.websocket);
                util.send(socket, "CharsCheck", areas[client.area].taken, client.websocket);
                util.players++;
            }
        }
    },
    // Call mod
    // TODO: Implement this lol
    "ZZ": (packetContents, socket, client) => {

    },
    // CE/WT
    // TODO: Rate limiting
    // TODO: Check player position
    "RT": (packetContents, socket, client) => {
        if (client.cemute) {
            util.send(socket, "CT", ["Server", "You are muted!"], client.websocket);
            return;
        }
        if (areas[client.area].CELock)
            return;
        util.broadcast("RT", packetContents, client.area);
    },
    // Judge HP bars
    // TODO: Check player position
    "HP": (packetContents, socket, client) => {
        util.broadcast("HP", packetContents, client.area);
    },
    // Add evidence
    "PE": (packetContents, socket, client) => {
        let evidence = packetContents[0] + "&" + packetContents[1] + "&" + packetContents[2];
        evidenceLists[client.area].push(evidence);
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.area], client.area);
    },
    // Remove evidence
    "DE": (packetContents, socket, client) => {
        evidenceLists[client.area].splice(packetContents[0], 1);
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.area], client.area);
    },
    // Edit evidence
    "EE": (packetContents, socket, client) => {
        let id = packetContents[0];
        packetContents.shift();
        evidenceLists[client.area][id] = packetContents[0] + "&" + packetContents[1] + "&" + packetContents[2];
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.area], client.area);
    },
    // Free character
    "FC": (packetContents, socket, client) => {
        areas[client.area].taken[client.char] = 0;
    },
    // Slow load char list
    "askchar2": (packetContents, socket, client) => {
        let charList = [];
        for (let i = 0; i < Math.min(10, config.characters.length); i++) {
            charList.push(i);
            charList.push(config.characters[i] + "&&0&&&0&");
        }
        util.send(socket, "CI", charList, client.websocket);
    },
    // Slow load character batch request
    "AN": (packetContents, socket, client) => {
        let charList = [];
        let startAt = packetContents[0];
        startAt *= 10;
        for (let i = startAt; i < Math.min(startAt + 10, config.characters.length); i++) {
            charList.push(i);
            charList.push(config.characters[i] + "&&0&&&0&");
        }
        util.send(socket, "CI", charList, client.websocket);
        if (i == config.characters.length) {
            let songList = [];
            for (let i = 0; i < Math.min(10, config.songs.length); i++) {
                songList.push(i);
                songList.push(config.songs[i].name);
            }
            util.send(socket, "EM", songList, client.websocket);
        }
    },
    // Slow load music batch request
    "AM": (packetContents, socket, client) => {
        let songList = [];
        let startAt = packetContents[0];
        startAt *= 10;
        for (let i = startAt; i < Math.min(startAt + 10, config.songs.length); i++) {
            songList.push(i);
            songList.push(config.songs[i].name);
        }
        if (startAt > config.songs.length) {
            util.send(socket, "CharsCheck", areas[client.area].taken, client.websocket);
            util.send(socket, "OPPASS", ["42"], client.websocket);
            util.send(socket, "DONE", [], client.websocket);
            util.send(socket, "CT", ["Server", config.motd], client.websocket); // Send MOTD
            util.send(socket, "LE", areas[client.area].evidence, client.websocket); // Send evidence
            util.send(socket, "MC", [areas[client.area].song, -1], client.websocket); // Send song
            util.send(socket, "BN", [areas[client.area].background], client.websocket); // Send background
        }
        else {
            util.send(socket, "EM", songList, client.websocket);
        }
    },
    // AO1.x Disconnect, don't need to do anything
    "DC": (packetContents, socket, client) => {

    },
    "PW": (packetContents, socket, client) => {
        // TODO: This
    }
};

module.exports = {
    PacketHandler: PacketHandler,
    areas: areas,
    reloadConf: reloadConf
};