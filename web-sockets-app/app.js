function connect(ip, port) {
    socket = new WebSocket(`ws://${ip}:${port}`);

    socket.addEventListener("open", (event)=>{
        function informServer() {
            socket.send(JSON.stringify({ message_code: 'PLAYER_LOC', client_id: id, pos: pos }));
            socket.send(JSON.stringify({ message_code: 'WALL_REQUEST', client_id: id, wall_map: wall_map}))
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
                const worldX = dict.world_map[0].length;
                const worldY = dict.world_map.length;
                world_map = dict.world_map;
                wall_map = dict.wall_map;
                r_noise = noiseMap(worldX,worldY);
                g_noise = noiseMap(worldX,worldY);
                b_noise = noiseMap(worldX,worldY);
                pos = { 
                    x: Math.round(world_map[0].length / 2), 
                    y: Math.round(world_map.length / 2) 
                }
                let wall_canv = document.getElementById('wall-canvas')
                wall_canv.width = dict.wall_map[0].length * gridSize;
                wall_canv.height = dict.wall_map.length * gridSize;
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
            case 'WALLS_UPDATE':
                wall_map = dict.wall_map;
                drawWalls(dict.wall_map);
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
let wall_map = undefined;

let r_noise = undefined;
let b_noise = undefined;
let g_noise = undefined;

let gridSize = 14;

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
    clickCoordX = Math.floor(pos.x + (event.pageX - box.clientWidth / 2) / gridSize);
    clickCoordY = Math.floor(pos.y + (event.pageY - box.clientHeight / 2) / gridSize);
    wall_map[clickCoordX][clickCoordY]++;
    socket.send(JSON.stringify({ message_code: 'WALL_UPDATE', client_id: id, wall_map: wall_map}))
})
document.getElementById('world-box').addEventListener('mouseenter', function (event) {
    const highlight = document.getElementById('highlight-box');
    highlight.style.display = ''
    highlight.style.width = `${gridSize}px`;
    highlight.style.height = `${gridSize}px`;
})
document.getElementById('world-box').addEventListener('mousemove', function (event) {
    const box = document.getElementById('world-box');
    const highlight = document.getElementById('highlight-box');
    clickCoordX = Math.floor(pos.x + (event.pageX - box.clientWidth / 2) / gridSize);
    clickCoordY = Math.floor(pos.y + (event.pageY - box.clientHeight / 2) / gridSize);

    highlight.style.left = `${clickCoordX * gridSize}px`;
    highlight.style.top = `${clickCoordY * gridSize}px`;
})
document.getElementById('world-box').addEventListener('mouseleave', function (event) {
    const highlight = document.getElementById('highlight-box');
    highlight.style.display = 'none';
})

function noiseMap(w,h){
    array = [];
    for (let i = 0; i < w; i++){
        array.push([])
        for (let j = 0; j < h; j++){
            array[i].push(Math.random())
        }
    }
    return array
}

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

function drawWalls(mapArray) {
    if (typeof mapArray == 'undefined') return;
    const canv = document.getElementById('wall-canvas');
    const ctx = canv.getContext('2d');
    for (let i = 0; i < mapArray[0].length; i++) {
        for (let j = 0; j < mapArray.length; j++) {
            drawWallTile(ctx, mapArray[i][j], i, j)
        }
    }
}

function drawWallTile(context, val, i, j){
    switch (val){
        case 0:   break;
        case 1:  drawRect(context,i,j,r = 80, g = 80 + 12 * g_noise[i][j], b = 80 + 6 * b_noise[i][j]); break;
        case 2:  drawRect(context,i,j,r = 100, g = 100 + 12 * g_noise[i][j], b = 100 + 6 * b_noise[i][j]); break;
        default: drawRect(context,i,j,r = 120, g = 120 + 12 * g_noise[i][j], b = 120 + 6 * b_noise[i][j]); break;
    }
}

function drawWorld(mapArray) {
    if (typeof mapArray == 'undefined') return;
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
        case 0: drawRect(context,i,j,r = 80, g = 140 + 12 * g_noise[i][j], b = 80 + 6 * b_noise[i][j]); break;
        case 1: drawRect(context,i,j,r = 140 + 4 * r_noise[i][j], g = 140 + 4 * g_noise[i][j], b = 80); break;
        case 2: drawRect(context,i,j,r = 100 + 3 * r_noise[i][j], g = 120 + 10 * g_noise[i][j], b = 180); break;
        case 3: drawRect(context,i,j,r = 80 + 3 * r_noise[i][j], g = 80 + 10 * g_noise[i][j], b = 140); break;
    }
    return context;
}
function drawRect(canvas,i,j,r,g,b) {
    canvas.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
    canvas.fillRect(i*gridSize,j*gridSize,gridSize,gridSize)
    
}
function update() {
    let worldView = document.getElementById('world-view')
    let box = document.getElementById('world-box');

    worldView.style.transform = `Translate(${-pos.x * gridSize + box.clientWidth / 2}px, ${-pos.y * gridSize + box.clientHeight / 2}px)`

    el.style.left = `${pos.x * gridSize}px`;
    el.style.top = `${pos.y * gridSize}px`;
    el.style.transform = `rotate(${rot}deg)`

    drawDwarves();
    drawWalls(wall_map);
}
