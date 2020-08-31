const net = require("net");
const crypto = require("crypto");
const fs = require("fs");
require("./import.js");
if (!fs.existsSync("./config.json")) {
    while (true); // Hang, tsuimporter.js will close the process
}
let config = JSON.parse(fs.readFileSync("./config.json"));
const protocol = require("./protocol.js");
const util = require("./util.js");
let config = JSON.parse(fs.readFileSync("./config.json"));

require("./import.js");

if (!fs.existsSync("./config.json")) {
    while (true); // Hang, tsuimporter.js will close the process
}

function reloadConf() {
    config = JSON.parse(fs.readFileSync("./config.json"));
    protocol.reloadConf();
}

// Server Listener
const server = net.createServer((socket) => {
    const SOCKETNAME = socket.remoteAddress + ":" + socket.remotePort;

    let client = {
        oocmute: false,
        cemute: false,
        mute: false,
        area: 0,
        websocket: false,
        name: SOCKETNAME,
        socket: socket,
        id: util.clients.length
    };

    reloadConf();

    util.players = util.clients.length;
    util.clients.push(client);

    // WebSockets have 750ms to send a handshake
    // After that, it is assumed the client is an AO client
    let wsTimeout = setTimeout(() => {
        if (!socket.destroyed)
            socket.write("decryptor#34#%");
    }, config.wsTime);

    if (config.mods.includes(socket.remoteAddress)) {
        client.moderator = true;
    }

    if (config.bans.includes(socket.remoteAddress)) {
        socket.end();
    }

    socket.on("data", (data) => {
        console.log(data.toString("utf8").split("\r\n"))
        if (data.length == 0)
            return;

        let packetContents;
        let allPackets;

        // If client is confirmed WebSocket, process.
        // If the client isn't a confirmed WebSocket connection
        // Then wait for a WS header and if we get one, handshake
        if (client.websocket) {
            let content = util.decodeWs(data, socket);
            if (content == null)
                return;
            allPackets = content.split("%");
        } else {
            let ws = data.toString("utf8").split("\r\n");
            if (ws[0].includes("HTTP/1.1")) {
                // Handle websocket
                clearTimeout(wsTimeout);
                let key;
                ws.forEach((line) => {
                    let fields = line.split(": ");
                    if (fields[0] == "Sec-WebSocket-Key")
                        key = fields[1];
                });
                key = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
                key = crypto.createHash("sha1").update(key).digest("base64");
                let response = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + key + "\r\n\r\n"
                socket.write(response);
                util.send(socket, "decryptor", ["34"], true);
                client.websocket = true;
                return;
            }
            allPackets = data.toString("utf-8").split("%");
        }

        allPackets.pop(); // Remove entry after last delimiter

        allPackets.forEach(packet => {
            // extremely verbose info for testing reasons
            console.log(`data on wire: ${packet}`);
            packetContents = packet.toString("utf-8").split("#");

            if (packetContents == null)
                return;
            if (packetContents[0] == "") // for some reason random packets start with a #
                packetContents.shift();

            let header = util.fantaDecrypt(packetContents[0], 5);
            packetContents.shift();
            packetContents.pop();

            if (protocol.PacketHandler[header] == undefined) {
                console.log("Unimplemented packet: " + header);
                console.log(packetContents);
                console.log(SOCKETNAME);
                return;
            }

            protocol.PacketHandler[header](packetContents, socket, client);
        });
    });

})

server.on('error', (e) => {
    console.log(e);
});

server.on('close', () => {
    util.cleanup(client, protocol);
});

server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`)
});

process.on('uncaughtException', function (err) {
    console.error(err);
});

// Master server advertiser
if (!config.private) {
    let client = new net.Socket();
    client.connect(config.msport, config.msip, () => {
        console.log("Master server connection established");
        client.write(util.packetBuilder("SCC", [`${config.port}&${config.port}`, config.name, config.description, `bengoshi v${util.softVersion}`]));
    });
}

