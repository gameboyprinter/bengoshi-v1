const fs = require("fs");
const yml = require("js-yaml");
const ini = require("ini-parser");

var tsuFound = 
  fs.existsSync("config/") && 
  fs.existsSync("config/areas.yaml") && 
  fs.existsSync("config/characters.yaml") && 
  fs.existsSync("config/config.yaml") && 
  fs.existsSync("config/backgrounds.yaml") && 
  fs.existsSync("config/music.yaml");

var sDFound = 
  fs.existsSync("base/") &&
  fs.existsSync("base/banlist.txt") &&
  fs.existsSync("base/HDbanlist.txt") &&
  fs.existsSync("base/masterserver.ini") &&
  fs.existsSync("base/musiclist.txt") &&
  fs.existsSync("base/settings.ini") &&
  fs.existsSync("base/scene/AAOPublic2/init.ini") &&
  fs.existsSync("base/scene/AAOPublic2/areas.ini");

if (!fs.existsSync("config.json") && tsuFound) {
  console.log("tsuserver config directory detected, entering import mode.");

  var areas = yml.safeLoad(fs.readFileSync("config/areas.yaml"));
  var backgrounds = yml.safeLoad(fs.readFileSync("config/backgrounds.yaml"));
  var characters = yml.safeLoad(fs.readFileSync("config/characters.yaml"));
  var config = yml.safeLoad(fs.readFileSync("config/config.yaml"));
  var music = yml.safeLoad(fs.readFileSync("config/music.yaml"));

  // New configs that aren't in tsu
  var newConfig = {
    maxRepeats: 20,
    maxArgLength: 30,
    wsTime: 750,
    bans: [],
    mods: []
  };

  // Simple stuff
  newConfig.port = config.port;
  newConfig.msip = config.masterserver_ip;
  newConfig.msport = config.masterserver_port;
  newConfig.private = !config.use_masterserver;
  newConfig.maxPlayers = config.playerlimit;
  newConfig.modpass = config.modpass;
  newConfig.name = config.masterserver_name;
  newConfig.description = config.masterserver_description;
  newConfig.motd = config.motd;
  newConfig.backgrounds = backgrounds;
  newConfig.characters = characters;

  // Music and rooms are a little different
  var songs = [];
  var rooms = [];

  music.forEach((category) => {
    songs.push({
      name: category.category,
      category: true
    });

    category.songs.forEach((song) => {
      songs.push({
        name: song.name,
        length: song.length
      });
    });
  });
  newConfig.songs = songs;

  areas.forEach((area) => {
    rooms.push({
      name: area.area,
      background: area.background,
      BGLock: area.bglock,
      CELock: false,
      private: false,
    });
  });
  newConfig.rooms = rooms;

  fs.writeFileSync("config.json", JSON.stringify(newConfig, null, 2));
  console.log("New config generated. Restart server to use it!");
  process.exit(0);
} 
else if (!fs.existsSync("config.json") && sDFound) {
  console.log("serverD config directory detected, entering import mode.");

  var settings = ini.parse(fs.readFileSync("base/settings.ini").toString().replace(new RegExp("(?<!\r)\n", "g"), "\r\n"));
  var musiclist = fs.readFileSync("base/musiclist.txt").toString().replace(new RegExp("(?<!\r)\n", "g"), "\r\n");
  var masterserver = ini.parse(fs.readFileSync("base/masterserver.ini").toString().replace(new RegExp("(?<!\r)\n", "g"), "\r\n"));
  var areas = ini.parse(fs.readFileSync("base/scene/AAOPublic2/areas.ini").toString().replace(new RegExp("(?<!\r)\n", "g"), "\r\n"));
  var scene = ini.parse(fs.readFileSync("base/scene/AAOPublic2/init.ini").toString().replace(new RegExp("(?<!\r)\n", "g"), "\r\n"));
  
  var newConfig = {
    maxRepeats: 20,
    maxArgLength: 30,
    maxBadPackets: 10,
    wsTime: 750,
    bans: [],
    mods: []
  };

  newConfig.port = settings.net.port;
  newConfig.msip = masterserver.list[0];
  newConfig.msport = 27016;
  newConfig.private = !settings.net.public;
  newConfig.maxPlayers = scene.chars.number;
  newConfig.modpass = settings.net.oppassword;
  newConfig.name = settings.server.name;
  newConfig.description = settings.server.desc;
  newConfig.motd = "Welcome to the server!";
   
  var backgrounds = [];
  var rooms = [];
  var songs = [];
  var characters = [];

  musiclist.split("\r\n").forEach((song) => {
    song = song.split("*")[0];
    if(!(song.charAt(0) == ">")){
      if(song.substr(0, 3) == "---"){
        songs.push({
          name: song,
          category: true
        });
      }
      else{
        songs.push({
          name: song,
          length: 0
        });
      }
    }
  });

  for(var i = 1; i <= areas.Areas.number; i++){
    rooms.push({
      name: areas.Areas[i],
      background: areas.filename[i],
      BGLock: false,
      CELock: false,
      private: areas.hidden[i] == 1
    });
    backgrounds.push(areas.filename[i]);
  }

  for(var i = 0; i < scene.chars.number; i++){
    characters[i] = scene.chars[i];
  }

  newConfig.backgrounds = backgrounds;
  newConfig.rooms = rooms;
  newConfig.songs = songs;
  newConfig.characters = characters;

  fs.writeFileSync("config.json", JSON.stringify(newConfig, null, 2));
  console.log("New config generated. Restart server to use it!");
  process.exit(0);
}
else if (!fs.existsSync("config.json")) {
  var defaultConfig = {
    "port": 27016,
    "msip": "master.aceattorneyonline.com",
    "msport": 27016,
    "private": false,
    "maxPlayers": 100,
    "modpass": "password",
    "name": "My New Server",
    "description": "My super flashy new server!",
    "motd": "Welcome to the server!",
    "backgrounds": [
      "Anime",
      "Christmas",
      "CountyCourt",
      "CruiseCourt",
      "DGSEnglishCourt",
      "DGSJapanCourt",
      "DualDestinies",
      "EnglishCourt",
      "GS4Night",
      "HD",
      "Khura'in",
      "NewCourt",
      "RuinedCourt",
      "Sky",
      "SpaceCourt",
      "Themis",
      "TouhouCourt",
      "WitchTrialCourt",
      "Zetta",
      "birthday",
      "default",
      "gs4",
      "mlp"
    ],
    "rooms": [{
        "name": "Lobby",
        "background": "default",
        "BGLock": true,
        "CELock": true,
        "private": false
      },
      {
        "name": "Case 1",
        "background": "Anime",
        "BGLock": false,
        "CELock": true,
        "private": false
      },
      {
        "name": "Case 2",
        "background": "birthday",
        "BGLock": true,
        "CELock": true,
        "private": false
      },
      {
        "name": "Case 3",
        "background": "CountyCourt",
        "BGLock": true,
        "CELock": true,
        "private": false
      },
      {
        "name": "Moderator",
        "background": "TouhouCourt",
        "BGLock": true,
        "CELock": true,
        "private": true
      }
    ],
    "bans": [{
      "ip": "8.8.8.8",
      "hwid": "example"
    }],
    "mods": [
      "127.0.0.1"
    ],
    "maxRepeats": 15,
    "maxArgLength": 30,
    "wsTime": 750,
    "songs": [{
        "name": "~stop.mp3"
      },
      {
        "name": "Vanilla",
        "category": true
      },
      {
        "name": "01_turnabout_courtroom_-_prologue.mp3",
        "length": 40.150204
      },
      {
        "name": "113 Confrontation ~ Presto 2009.mp3",
        "length": 186.77551
      },
      {
        "name": "114 Pursuit(Miles).mp3",
        "length": 196.675918
      },
      {
        "name": "Annonce The Truth(AA).mp3",
        "length": 79.725714
      },
      {
        "name": "Annonce The Truth(AJ).mp3",
        "length": 59.533061
      },
      {
        "name": "Annonce The Truth(JFA).mp3",
        "length": 98.063673
      },
      {
        "name": "Annonce The Truth(Miles).mp3",
        "length": 152.711837
      },
      {
        "name": "Annonce The Truth(T&T).mp3",
        "length": 126.040816
      },
      {
        "name": "Crises of Fate.mp3",
        "length": 143.56898
      },
      {
        "name": "Forgotten Legend.mp3",
        "length": 141.348571
      },
      {
        "name": "Ghost Trick - 4 Minutes Before Death.mp3",
        "length": 229.651448
      },
      {
        "name": "Ghost Trick - Countdown.mp3",
        "length": 118.966129
      },
      {
        "name": "Ghost Trick - The World of the Dead.mp3",
        "length": 174.251214
      },
      {
        "name": "Godot - The Fragrance of Dark Coffee.mp3",
        "length": 148.062041
      },
      {
        "name": "Great Revival ~ Franziska von Karma.mp3",
        "length": 86.047347
      },
      {
        "name": "Great Revival ~ Miles Edgeworth.mp3",
        "length": 89.652245
      },
      {
        "name": "Hotline of Fate.mp3",
        "length": 51.043265
      },
      {
        "name": "Interesting People.mp3",
        "length": 142.680816
      },
      {
        "name": "logic_and_trick.mp3",
        "length": 152.42449
      },
      {
        "name": "Luke Atmey ~ I Just Want Love.mp3",
        "length": 103.053061
      },
      {
        "name": "Noisy People.mp3",
        "length": 91.428571
      },
      {
        "name": "OBJECTIOM(AJ).mp3",
        "length": 96.078367
      },
      {
        "name": "OBJECTION (AA).mp3",
        "length": 73.325714
      },
      {
        "name": "OBJECTION (JFA).mp3",
        "length": 93.675102
      },
      {
        "name": "OBJECTION(trixie).mp3",
        "length": 135.841774
      },
      {
        "name": "OBJECTION (T&T).mp3",
        "length": 119.04
      },
      {
        "name": "OBJECTION(Miles).mp3",
        "length": 175.856327
      },
      {
        "name": "Others ~ Guilty love.mp3",
        "length": 98.742857
      },
      {
        "name": "Prelude(AA).mp3",
        "length": 77.818776
      },
      {
        "name": "Prelude(AJ).mp3",
        "length": 71.235918
      },
      {
        "name": "Pursuit ~ I Want to Find the Truth(Orchestra).mp3",
        "length": 333.93503
      },
      {
        "name": "PURSUIT(AA) - variation.mp3",
        "length": 90.383673
      },
      {
        "name": "PURSUIT(AA).mp3",
        "length": 96.417959
      },
      {
        "name": "PURSUIT(AJ).mp3",
        "length": 109.061224
      },
      {
        "name": "PURSUIT(JFA) - variation.mp3",
        "length": 76.042449
      },
      {
        "name": "PURSUIT(JFA).mp3",
        "length": 82.050612
      },
      {
        "name": "PURSUIT(T&T) - variation.mp3",
        "length": 114.050612
      },
      {
        "name": "PURSUIT(T&T).mp3",
        "length": 120.058776
      },
      {
        "name": "Questioning T&T (Moderato).mp3",
        "length": 115.931429
      },
      {
        "name": "Questioning T&T (Allegro).mp3",
        "length": 160.034063
      },
      {
        "name": "Questioning JFA (Moderato).mp3",
        "length": 89.895313
      },
      {
        "name": "Questioning AJ (Allegro).mp3",
        "length": 103.21775
      },
      {
        "name": "Questioning JFA (Allegro).mp3",
        "length": 103.166875
      },
      {
        "name": "Questioning AJ (Moderato).mp3",
        "length": 80.308375
      },
      {
        "name": "Questioning(AA-allergo).mp3",
        "length": 126.850612
      },
      {
        "name": "Questioning(AA-normal).mp3",
        "length": 104.672653
      },
      {
        "name": "Speak up, Pup!.mp3",
        "length": 167.000816
      },
      {
        "name": "Super Trixie.mp3",
        "length": 147.581625
      },
      {
        "name": "Suspence(AA).mp3",
        "length": 92.630204
      },
      {
        "name": "The Great Truth Burglar.mp3",
        "length": 148.924082
      },
      {
        "name": "Trial(AA).mp3",
        "length": 108.930612
      },
      {
        "name": "Trial(AJ).mp3",
        "length": 125.884082
      },
      {
        "name": "Trial(Miles).mp3",
        "length": 275.670204
      }
    ],
    "characters": [
      "Adrian",
      "Apollo",
      "April",
      "Armstrong",
      "Atmey",
      "Butz",
      "Diego",
      "Edgeworth",
      "Edgeworthw",
      "Ema",
      "EmaSkye",
      "Franny",
      "Franziska",
      "Gant",
      "Gavin",
      "Gavin K",
      "Godot",
      "Gregory",
      "Grossberg",
      "Gumshoe",
      "Gumshoey",
      "Hawk",
      "Hobo_Phoenix",
      "Ini",
      "Judge",
      "Judge's Bro",
      "Klav",
      "Klavier",
      "Kristoph",
      "Lana",
      "Layton",
      "Lotta",
      "Luis",
      "Maggey",
      "Manfred",
      "Marshall",
      "Matt",
      "Maya",
      "Mia",
      "Miles",
      "Oldbag",
      "Payne",
      "Pearl",
      "Phoenix",
      "Valant",
      "Vasquez",
      "Wellington",
      "Winston",
      "WinstonPayne",
      "Young Mia",
      "Zak"
    ]
  };

  fs.writeFileSync("config.json", JSON.stringify(defaultConfig, null, 2));
  console.log("No config.json, tsuserver config, or serverD config found; using default config. Restart server to import a config!");
  process.exit(0);
}