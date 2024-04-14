class Dwarf{
    constructor(client_id, x, y){
        this.id = id;
        this.pos = {x: x, y: y};
    }
}

function connect(ip, port){
    const socket = new WebSocket(`ws://${ip}:${port}`);
    console.log('| CLIENT |', 'socket created')

    socket.onmessage = ({ data }) => {
        console.log('| SERVER |', data.toString());
        let dict = JSON.parse(data.toString());
        switch (dict.message_code) {
            case 'NEW_CLIENT':
                id = dict.assigned_id;
                break;
            case 'PLAYERS_UPDATE':
                let new_dwarves = {}
                for (let i = 0; i < dict.players.length; i++) {
                    let player = dict.players[i];
                    if (player.id == id) continue;
                    else {
                        let dwarf = {}
                        dwarf[`${player.id}`] = new Dwarf(
                            client_id=player.id,
                            x= player.x,
                            y=player.y
                        )
                        Object.assign(new_dwarves, dwarf);
                    }
                }
                dwarves = new_dwarves;
                // console.log(`incoming data:\n\t${data}\ndwarves:\n\t${dwarves['0']}`)
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
    setInterval(informServer, 30);
}


let socket = undefined;  
let id = undefined;

let pos = {x: 0, y: 0};
let col = {r: 128, g: 255, b: 128, a: 1}
let el = createPixelElement(pos.x, pos.y)
el.className = 'player'
el.style.backgroundColor=`rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`;
document.getElementById('player-container').appendChild(el)

dwarves = {}


document.addEventListener('keydown', function(event) {
    if (event.key == 'ArrowRight') pos.x++;
    if (event.key == 'ArrowLeft') pos.x--;
    if (event.key == 'ArrowUp') pos.y--;
    if (event.key == 'ArrowDown') pos.y++;
});

function createPixelElement(position, color){
    let element = document.createElement('div')
    
    element.style.width='10px'
    element.style.height='10px'
    element.style.position = 'absolute';
    element.style.left = `${position.x * 10}px`;
    element.style.top = `${position.y * 10}px`;
    return element
}

function drawDwarves(){
    // document.getElementById('dwarf-container').innerHTML = null
    let d_col = {r: 64, g: 128, b:64, a:1};
    for (let i = 0; i < Object.keys(dwarves).length; i++) {
        let key = Object.keys(dwarves)[i]
        console.log(`drawing dwarf ${key}`)
        let d_el = createPixelElement(dwarves[key].pos)
        d_el.style.backgroundColor = `rgba(${d_col.r}, ${d_col.g}, ${d_col.b}, ${d_col.a})`;
        document.getElementById('dwarf-container').appendChild(d_el)
    }

}

function update() {
    el.style.left = `${pos.x * 10}px`;
    el.style.top = `${pos.y * 10}px`;

    drawDwarves();
}

setInterval(update, 50);