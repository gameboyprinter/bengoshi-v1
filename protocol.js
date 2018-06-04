// All the packet handling and game state (that is not user-specific) takes place here
const fs = require("fs");
const config = require("./config.json");
const util = require("./util.js");
const cmds = require("./commands.js");

// Game state
// TODO: Room state objects
var taken = [];
var roomSongs = [];
var musicIntervals = [];
var evidenceLists = require('./evidence.json');
var players = 0;

// Initialize variables
for (var i = 0; i < config.characters.length; i++)
    taken[i] = 0;
var initEvidence = evidenceLists.length != config.rooms.length;
if(initEvidence)
    evidenceLists = [];
for (var i = 0; i < config.rooms.length; i++){
    roomSongs.push("");
    if(initEvidence)
        evidenceLists.push([]);
}

// This function is called on an interval, per room, to loop music.
function loopMusic(room) {
    util.broadcast("MC", [roomSongs[room], -1], room);
}

// Every FantaPacket is interpreted here
PacketHandler = {
    // Hardware ID
    "HI": (packetContents, socket, client) => {
        config.bans.forEach((ban) => {
            if (ban.hwid == packetContents[0])
                socket.end();
        });
        var hardware = packetContents[0];
        client.hardware = hardware;
        util.send(socket, "ID", [hardware, "bengoshi", "v" + util.softVersion], client.websocket);
        if (players >= config.maxPlayers)
            socket.close();
        util.send(socket, "PN", [players, config.maxPlayers], client.websocket);
        util.send(socket, "FL", ["fastloading", "noencryption", "yellowtext", "websockets", "customobjections", "deskmod"], client.websocket);
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
        util.send(socket, "SI", [config.characters.length, 0, config.songs.length], client.websocket);
    },
    // Request chars
    "RC": (packetContents, socket, client) => {
        util.send(socket, "SC", config.characters, client.websocket);
    },
    // Request music
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
        util.send(socket, "SM", songNames, client.websocket);
    },
    // Request data (taken chars, oppass, loading done)
    "RD": (packetContents, socket, client) => {
        util.send(socket, "CharsCheck", taken, client.websocket);
        util.send(socket, "OPPASS", ["42"], client.websocket);
        util.send(socket, "DONE", [], client.websocket);
    },
    // Change character
    "CC": (packetContents, socket, client) => {
        if (taken[packetContents[1]] == -1)
            return;
        if (client.char != undefined)
            taken[client.char] = 0;
        taken[packetContents[1]] = -1;
        client.char = packetContents[1];
        util.send(socket, "PV", [client.id, "CID", client.char], client.websocket);
        util.send(socket, "CT", ["Server", config.motd], client.websocket);
        util.send(socket, "LE", evidenceLists[client.room], client.websocket);
        if (roomSongs[0] != "")
            util.send(socket, "MC", [roomSongs[client.room], -1], client.websocket);
        util.send(socket, "BN", [config.backgrounds[client.room]], client.websocket);
        players++;
    },
    // Keepalive heartbeat
    "CH": (packetContents, socket, client) => {
        util.send(socket, "CHECK", [], client.websocket);
    },
    // IC chat
    // TODO: Filtering
    "MS": (packetContents, socket, client) => {
        if (client.mute)
            return;
        util.broadcast("MS", packetContents, client.room);
    },
    // OOC Chat
    // TODO: OOC mutes
    "CT": (packetContents, socket, client) => {
        if (client.mute)
            return;
        var input = packetContents[1];
        if (input.charAt(0) == "/") {
            var args = input.split(" ");
            var cmd = args[0];
            args.shift();
            cmds.parseCmd(cmd, args, socket, client, config);
            return;
        }
        util.broadcast("CT", packetContents, client.room);
    },
    // Music change
    // Some music items are used to change areas, however
    // And some are purely decorative (category titles)
    // All of that is handled here
    "MC": (packetContents, socket, client) => {
        var exists = false;
        var time = 0;
        config.songs.forEach((song) => {
            if (song.name == packetContents[0]) {
                if (song.category)
                    return;
                exists = true;
                time = Math.floor(song.length * 1000);
            }
        });
        if (exists) {
            roomSongs[client.room] = packetContents[0];
            util.broadcast("MC", packetContents, client.room);
            clearInterval(musicIntervals[client.room]);
            if (roomSongs[client.room] != "~stop.mp3")
                musicIntervals[client.room] = setInterval(loopMusic, time, client.room);
        }
        if (!exists) {
            if (config.rooms.includes(packetContents[0])) {
                client.room = config.rooms.indexOf(packetContents[0]);
                util.send(socket, "CT", ["Server", "You moved to room number " + client.room + ", " + packetContents[0]], client.websocket);
                util.send(socket, "BN", [config.backgrounds[client.room]]);
                util.send(socket, "LE", evidenceLists[client.room], client.websocket);
                if (roomSongs[client.room] == "")
                    util.send(socket, "MC", ["~stop.mp3", -1], client.websocket);
                else
                    util.send(socket, "MC", [roomSongs[client.room], -1], client.websocket);
            }
        }
    },
    // Call mod
    // TODO: Implement this lol
    "ZZ": (packetContents, socket, client) => {

    },
    // CE/WT
    // TODO: Muting and rate limiting
    // TODO: Check player position
    "RT": (packetContents, socket, client) => {
        util.broadcast("RT", packetContents, client.room);
    },
    // Judge HP bars
    // TODO: Check player position
    "HP": (packetContents, socket, client) => {
        util.broadcast("HP", packetContents, client.room);
    },
    // Add evidence
    "PE": (packetContents, socket, client) => {
        var evidence = packetContents[0] + "&" + packetContents[1] + "&" + packetContents[2];
        evidenceLists[client.room].push(evidence);
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.room], client.room);
    },
    // Remove evidence
    "DE": (packetContents, socket, client) => {
        evidenceLists[client.room].splice(packetContents[0], 1);
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.room], client.room);
    },
    // Edit evidence
    "EE": (packetContents, socket, client) => {
        var id = packetContents[0];
        packetContents.shift();
        evidenceLists[client.room][id] = packetContents[0] + "&" + packetContents[1] + "&" + packetContents[2];
        fs.writeFileSync("./evidence.json", JSON.stringify(evidenceLists));
        util.broadcast("LE", evidenceLists[client.room], client.room);
    }
};

module.exports = {
    PacketHandler: PacketHandler,
    taken: taken,
    players: players
};