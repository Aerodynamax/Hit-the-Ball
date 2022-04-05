
const { randomInt } = require("crypto");
let express = require("express");
let socket = require("socket.io");

let port = 3000;
let ip = Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family==='IPv4' && !i.internal && i.address || []), [])), []);

console.log("Starting Server ...");
console.log("server ip: " + ip);

let app = express();
let server = app.listen(port);
app.use(express.static("public"));

let io = socket(server);

let timeLeft = 60; // seconds

let window_sizeX = 1400;
let window_sizeY = 800;

let ball_posX = 200;
let ball_posY = 200;
let ball_radius = 40;

let ball_speedX = 0.7;
let ball_speedY = 0.7;

function constrain(value, minValue, maxValue) {
    return Math.min(Math.max(value, minValue), maxValue);
}

setInterval(updateBall, 8);

// updates the ball position and sends it to the sketch
function updateBall() {

    if (ball_posX  + ball_radius >= window_sizeX || ball_posX - ball_radius <= 0) {
        ball_speedX *= -1;
    }

    if (ball_posY  + ball_radius >= window_sizeY || ball_posY - ball_radius <= 0) {
        ball_speedY *= -1;
    }
 
    ball_speedX = constrain(ball_speedX, -5, 5);
    ball_speedY = constrain(ball_speedY, -5, 5);

    ball_posX += ball_speedX;
    ball_posY += ball_speedY;

    data = {
        x       : ball_posX, 
        y       : ball_posY, 
        speedX  : ball_speedX, 
        speedY  : ball_speedY, 
        r       : ball_radius,
      }

    io.sockets.emit("update", data);
}

setInterval(updateTimer, 1000);

function updateTimer() {
    if(timeLeft > -1) {
        data = {
            timeLeft : timeLeft
        };
        io.sockets.emit("timer", data);
    }
    timeLeft--;
}



io.sockets.on("connection", newConnection);

function newConnection(socket) {
    console.log("new connection: " + socket.id);
    let paddleColour = randomInt(80, 220);
    socket.on("paddle", paddleMsg);

    function paddleMsg(data) {
        
        let data2 = {
            id: socket.id,
            x: data.x,
            y: data.y,
            colour  : paddleColour
        };

        // socket.broadcast.emit("paddle", data);
        io.sockets.emit("paddle", data2);
    }

    socket.on("hit", ballUpdate);

    function ballUpdate(data) {
        ball_speedX = data.speedX;
        ball_speedY = data.speedY;
        ball_radius = data.r;
    }


    socket.on("disconnect", removePaddle);

    function removePaddle() {
        console.log(socket.id + ": disconected");

        io.sockets.emit('removePaddle', {id: socket.id});
    }
}


console.log("Server Started ...");
