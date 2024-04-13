const WebSocket = require('ws');

const server = new WebSocket.Server({ port: '8080' });
console.log('| SERVER | online on port 8080')

let connections = 0
let players = []
server.on('connection', socket => {
    players.push({
        id: GeneratePlayerId(),
        x: 0,
        y: 0
    })
    socket.send(JSON.stringify({message_code: 'NEW_CLIENT', assigned_id: players[players.length-1].id}))
    
    console.log('| SERVER |', `${players.length} open connections`)
    socket.on('message', message => {
        let data = JSON.parse(message.toString());
        switch (data.message_code) {
            case 'EXIT': clientExitEvent(socket, data); break;
            case 'PLAYER_LOC': clientPlayerLocationEvent(socket, data); break;
        
            default:
                break;
        }
    });
    connections++;
});

function GeneratePlayerId(){
    let ids = [];
    for (let i = 0; i < players.length; i++) {
        ids.push(players[i].id)
    }
    generated_id = 0;
    while (true) {
        if (ids.indexOf(generated_id) == -1) return generated_id;
        generated_id++;
    }
}

function getPlayerIndex(id){
    for (let i = 0; i < players.length; i++) {
        if (players[i].id == id){
            return i
        }
    }
}

function clientExitEvent(socket, data){
    console.log(`\n| TERM ${data.client_id} |`, data)
    players.splice(getPlayerIndex(data.client_id), 1)
    console.log('| SERVER |', `${players.length} open connections`)
}

function clientPlayerLocationEvent(socket, data){
    // console.log('\n| RECIEVE |', data, '\n|  SEND   |', players)
    pindex = getPlayerIndex(data.client_id)
    if (typeof pindex == 'undefined') return;
    players[pindex].x = data.pos.x
    players[pindex].y = data.pos.y
    socket.send(JSON.stringify({message_code: 'PLAYERS_UPDATE', players}))
}