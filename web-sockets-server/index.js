const WebSocket = require('ws');
const port = '8080'
const server = new WebSocket.Server({ port: port });
console.log('| SERVER | online on port', port)

let connections = 0
let players = []
let world_map = buildWorldMap(200,200)
server.on('connection', socket => {
    players.push({
        id: GeneratePlayerId(),
        x: 0,
        y: 0
    })
    socket.send(JSON.stringify(
        {
            message_code: 'NEW_CLIENT',
            assigned_id: players[players.length-1].id,
            world_map: world_map
        }))
    
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
    socket.send(JSON.stringify({message_code: 'PLAYERS_UPDATE', players: players}))
}

function buildWorldMap(width, height){
    let islands = [[width/2, height/2], [Math.random()*width, Math.random()*height], [Math.random()*width, Math.random()*height]]
    array = []
    for (let i = 0; i < width; i++) {
        array.push([])
        for (let j = 0; j < height; j++) {
            let land_height = Math.exp(-Math.pow((i-islands[0][0])/(2*10),2))
            land_height += Math.exp(-Math.pow((j-islands[0][1])/(2*10),2))
            land_height += Math.exp(-Math.pow((i-islands[1][0])/(2*20),2))
            land_height += Math.exp(-Math.pow((j-islands[1][1])/(2*20),2))
            land_height += Math.exp(-Math.pow((i-islands[2][0])/(2*30),2))
            land_height += Math.exp(-Math.pow((j-islands[2][1])/(2*30),2))
            if (land_height > 1.5) array[i].push(0)
            else if (land_height > 1.2) array[i].push(1)
            else if (land_height > 1) array[i].push(2)
            else array[i].push(3)
        }
    }
    return array

}