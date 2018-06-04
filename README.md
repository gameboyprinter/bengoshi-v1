# bengoshi
simple and good ao2 server

licensed AGPL (you know who you are)

features
---
- automatic spam bans (configurable)
- full webAO support
- rooms
- auto loop music
- moderator commands
- no botnet guarantee

to use:
---
- download zip
- install node.js (google how!!!)
- run the bat file (or if youre on linux i think you can figure it out)
- yay!!

config
---
- port: this is the server port
- msip: master server ip
- msport: master server port
- private: do not list on master server
- maxPlayers: most players allowed
- name: name in master server
- description: message box in master server
- motd: sent when client connects
- rooms: each room is an objext with the following properties:
- - name: room name in music list
- - background: default background
- - BGLock: prevent background changes (UNIMPLEMENTED)
- - CELock: prevent WT/CE messages (UNIMPLEMENTED)
- - private: only moderators can join
- bans: people who can't connect, object with ip property and hwid property
- mods: array of ip strings with moderator powers
- maxRepeats: number of consecutive messages that are identical before autoban
- maxArgLength: the most fields allowed in a packet before autoban, DO NOT SET BELOW 16
- maxBadPackets: number of invalid packets before autoban
- wsTime: milliseconds before a connection is assumed to not be a websocket. lower values may cause webAO problems on hosts with bad internet, but higher values will introduce a loading delay for non-webAO users
- songs: objects with properties name and time in seconds
- - time is needed for autoloop
- - set category to true, and it will be an unclickable song category
- characters: array of character name strings