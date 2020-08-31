const util = require("../util.js");

module.exports = {
    name: 'pos',
    description: '',
    respond(cmd, args, socket, client, config, rooms) {
        if (args.length < 1) {
            util.send(socket, "CT", ["Server", "/pos (new position)"], client.websocket);
        }
        else {
            let pos = args[0];
            if (pos == "wit" || pos == "def" || pos == "jud" || pos == "hlp" || pos == "hld" || pos == "pro") {
                client.pos = pos;
            }
        }
        return;
    }
}