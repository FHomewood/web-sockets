class Dwarf{
    constructor(id, x, y){
        this.id = id;
        this.pos = {x: x, y: y};
    }
}

function connect(ip, port){
    const socket = new WebSocket(`ws://${ip}:${port}`);
    console.log('| CLIENT |', 'socket created')

    // listen for messages
    socket.onmessage = ({ data }) => {
        // console.log('| SERVER |', data.toString());
        let dict = JSON.parse(data.toString());
        switch (dict.message_code) {
            case 'NEW_CLIENT':
                id = dict.assigned_id;
                break;
            case 'PLAYERS_UPDATE':
                new_dwarves = {}
                for (let i = 0; i < dict.players.length; i++) {
                    let player = dict.players[i];
                    if (player.id == id) break;
                    if (player.id in Object.keys(dwarves)){
                        Object.assign(new_dwarves, {
                            `df_${player.id}`: dwarves[i]
                        });
                    }
                    else {
                        Object.assign(new_dwarves, {player.id: new Dwarf(
                            id=player.id,
                            x= player.x,
                            y=plaiyer.y
                        )});
                    }
                }
                dwarves = new_dwarves;
                console.log(`incoming data:\n\t${data}\ndwarves:\n\t${dwarves['0']}`)
                break;
            default:
                break;
        }
    };

    window.onbeforeunload = ({ event }) => {
        socket.send(JSON.stringify({message_code: 'EXIT', client_id: id}))
    }
    window.onabort = ({ event }) => {
        socket.send(JSON.stringify({message_code: 'EXIT', client_id: id}))
    }
    function informServer() {
        // console.log('| SEND |', JSON.stringify({message_code: 'PLAYER_LOC', client_id: id, pos: pos}))
        socket.send(JSON.stringify({message_code: 'PLAYER_LOC', client_id: id, pos: pos}));
    }
    setInterval(informServer, 1000);
}


let socket = undefined;  
let id = undefined;

let pos = {x: 0, y: 0};
let col = {r: 128, g: 255, b: 128, a: 1}
let el = document.createElement('div')

el.className = 'player'
el.style.backgroundColor=`rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`
el.style.width='10px'
el.style.height='10px'
el.style.position = 'absolute';
document.getElementById('player-container').appendChild(el)

dwarves = {}


document.addEventListener('keydown', function(event) {
    if (event.key == 'ArrowRight') pos.x++;
    if (event.key == 'ArrowLeft') pos.x--;
    if (event.key == 'ArrowUp') pos.y--;
    if (event.key == 'ArrowDown') pos.y++;
});


function update() {
    el.style.left = `${pos.x * 10}px`;
    el.style.top = `${pos.y * 10}px`;
}

setInterval(update, 50);