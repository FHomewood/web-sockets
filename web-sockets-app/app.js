function connect(ip, port) {
    socket = new WebSocket(`ws://${ip}:${port}`);

    socket.addEventListener("open", (event)=>{
        function informServer() {
            socket.send(JSON.stringify({ message_code: 'PLAYER_LOC', client_id: id, pos: pos }));
        }
    
        function loop(){
            update()
            informServer()
            setTimeout(loop, 10)
        }
        loop()
    })
    socket.onmessage = ({ data }) => {
        let dict = JSON.parse(data.toString());
        switch (dict.message_code) {
            case 'NEW_CLIENT':
                id = dict.assigned_id;
                world_map = dict.world_map;
                pos = { x: Math.round(world_map[0].length / 2), y: Math.round(world_map.length / 2) }
                drawWorld(dict.world_map);
                break;
            case 'PLAYERS_UPDATE':
                let new_dwarves = {}
                for (let i = 0; i < dict.players.length; i++) {
                    let player = dict.players[i];
                    if (player.id == id) continue;
                    else {
                        let dwarf = {}
                        dwarf[`${player.id}`] = new Dwarf(
                            client_id = player.id,
                            x = player.x,
                            y = player.y
                        )
                        Object.assign(new_dwarves, dwarf);
                    }
                }
                dwarves = new_dwarves;
                break;
            default:
                break;
        }
    };

    window.onbeforeunload = ({ event }) => {
        socket.send(JSON.stringify({ message_code: 'EXIT', client_id: id }))
    }
    window.onabort = ({ event }) => {
        socket.send(JSON.stringify({ message_code: 'EXIT', client_id: id }))
    }
}

let socket = undefined;
let id = undefined;
let world_map = undefined;

let gridSize = 20;

let pos = { x: 0, y: 0 };
let rot = 45;
let col = { r: 97, g: 59, b: 48, a: 1 };
let el = createPixelElement(pos.x, pos.y)
el.className = 'player'
el.style.backgroundColor = `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`;
el.style.borderRadius = `0 100% 100% 100%`
document.getElementById('player-container').appendChild(el)

dwarves = {}


document.addEventListener('keyup', function (event) {
    if (event.key == 'ArrowRight' && pos.x < world_map[0].length - 1) {
        pos.x++;
        rot = 135;
    }
    if (event.key == 'ArrowLeft' && pos.x > 0) {
        pos.x--;
        rot = 315;
    }
    if (event.key == 'ArrowUp' && pos.y > 0) {
        pos.y--;
        rot = 45;
    }
    if (event.key == 'ArrowDown' && pos.y < world_map.length - 1) {
        pos.y++;
        rot = 225;
    }
});

document.getElementById('world-box').addEventListener('click', function (event) {
    const box = document.getElementById('world-box');
    clickCoordX = pos.x + (event.pageX - box.clientWidth / 2) / gridSize;
    clickCoordY = pos.y + (event.pageY - box.clientHeight / 2) / gridSize;
    let dbox = document.getElementById('debug-box');
    dbox.style.width = `${gridSize}px`
    dbox.style.height = `${gridSize}px`
    dbox.style.left = `${gridSize * Math.floor(clickCoordX)}px`
    dbox.style.top = `${gridSize * Math.floor(clickCoordY)}px`

})

function createPixelElement(position) {
    let element = document.createElement('div')

    element.style.width = `${gridSize}px`;
    element.style.height = `${gridSize}px`;
    element.style.position = 'absolute';
    element.style.left = `${position.x * gridSize}px`;
    element.style.top = `${position.y * gridSize}px`;
    return element
}

function drawDwarves() {
    document.getElementById('dwarf-container').innerHTML = null
    let d_col = { r: 137, g: 99, b: 88, a: 1 };
    for (let i = 0; i < Object.keys(dwarves).length; i++) {
        let key = Object.keys(dwarves)[i]
        let d_el = createPixelElement(dwarves[key].pos)
        d_el.style.backgroundColor = `rgba(${d_col.r}, ${d_col.g}, ${d_col.b}, ${d_col.a})`;
        d_el.style.borderRadius = "100%";
        document.getElementById('dwarf-container').appendChild(d_el)
    }

}
function drawWorld(mapArray) {
    const canv = document.createElement('canvas');
    canv.width = mapArray[0].length * gridSize;
    canv.height= mapArray.length * gridSize;
    const ctx = canv.getContext('2d');
    for (let i = 0; i < mapArray.length; i++) {
        for (let j = 0; j < mapArray[i].length; j++) {
            drawWorldTile(ctx, mapArray[i][j], i, j);
        }
    }
    document.getElementById('world-container').appendChild(canv);
}

function drawWorldTile(context, val, i, j) {
    switch (val) {
        case 0:
            let grass_col = { r: 80, g: 140 + 12 * Math.random(), b: 80 + 6 * Math.random(), a: 1 };
            context.fillStyle = `rgba(${grass_col.r}, ${grass_col.g}, ${grass_col.b}, ${grass_col.a})`;
            context.fillRect(i*gridSize,j*gridSize,gridSize,gridSize)
            break;
        case 1:
            let sand_col = { r: 140 + 4 * Math.random(), g: 140 + 4 * Math.random(), b: 80, a: 1 };
            context.fillStyle = `rgba(${sand_col.r}, ${sand_col.g}, ${sand_col.b}, ${sand_col.a})`;
            context.fillRect(i*gridSize,j*gridSize,gridSize,gridSize)
            break;
        case 2:
            let shallow_col = { r: 100 + 3 * Math.random(), g: 120 + 10 * Math.random(), b: 180, a: 1 };
            context.fillStyle = `rgba(${shallow_col.r}, ${shallow_col.g}, ${shallow_col.b}, ${shallow_col.a})`;
            context.fillRect(i*gridSize,j*gridSize,gridSize,gridSize)
            break;
        case 3:
            let deep_col = { r: 80 + 3 * Math.random(), g: 80 + 10 * Math.random(), b: 140, a: 1 };
            context.fillStyle = `rgba(${deep_col.r}, ${deep_col.g}, ${deep_col.b}, ${deep_col.a})`;
            context.fillRect(i*gridSize,j*gridSize,gridSize,gridSize)
            break;
        default:
            break;
    }
    return context;
}

function update() {
    let worldView = document.getElementById('world-view')
    let box = document.getElementById('world-box');

    worldView.style.transform = `Translate(${-pos.x * gridSize + box.clientWidth / 2}px, ${-pos.y * gridSize + box.clientHeight / 2}px)`

    el.style.left = `${pos.x * gridSize}px`;
    el.style.top = `${pos.y * gridSize}px`;
    el.style.transform = `rotate(${rot}deg)`

    drawDwarves();
}