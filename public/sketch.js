let rectHeight = 100;
let rectWidth = 30;

let rectColour = 230;

let window_sizeX = 1400;
let window_sizeY = 800;

let paddleX = 0;
let paddleY = 0;

let lastPaddleX = 0;
let lastPaddleY = 0;

let paddle_timeout = 16;

let timer = 59;

let originX;
let originY;

let ballX = 0;
let ballY = 0;
let ballRad = 40;
let ballSpeedX = 0;
let ballSpeedY = 0;

let ballDamp = 0.5;

let ignore_hit = false;

let playerScore = 0;

let socket;

let otherPlayers = {};


function setup() {
  createCanvas(window_sizeX, window_sizeY);

  noCursor();

  originX = window_sizeX / 2;
  originY = window_sizeY / 2;

  socket = io.connect("http://10.184.121.139:3000");

  socket.on("update", update);
  socket.on("timer", updateTimer);

  socket.on("paddle", drawPaddles);
  socket.on("removePaddle", deletePaddle);

}

function update(data) {
  ballX       = data.x;
  ballY       = data.y;
  ballSpeedX  = data.speedX;
  ballSpeedY  = data.speedY;
  ballRad     = data.r;
}

function updateTimer(data) {
  console.log(timer)
  if(timer == 0) {
    console.log("finished")
    alert("Hello world!");
  }
  else{
    timer = data.timeLeft;
  }
  
}

function drawPaddles(data) {
  otherPlayers[data.id] = { x: data.x, y: data.y, colour: data.colour};
}

function deletePaddle(data) {
  delete otherPlayers[data.id];
}


function draw() {

  stroke(255);
  background(51);

  textSize(32);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(90);
  text('HIT THE BALL \n'+playerScore.toString(), originX, originY - originY / 3 *2);
  text(timer.toString(), window_sizeX - 50, 30);
  

  fill(200);


  paddleX = constrain(mouseX, 0, window_sizeX - rectWidth);
  paddleY = constrain(mouseY, 0, window_sizeY - rectHeight);

  let paddleData = {
    x: paddleX,
    y: paddleY
  };

  socket.emit("paddle", paddleData);


  let distanceX = originX - paddleX;
  let distanceY = originY - paddleY;

  let angle = atan2(distanceY, distanceX);

  hit = collide_Rect_Circle(paddleX, paddleY, rectWidth, rectHeight, ballX, ballY, ballRad);

  // move if inside
  // if ( ballX > paddleX && ballX < (paddleX+rectWidth) && ballY > paddleY && ballY < (paddleY+rectHeight) ) {
  //   fill(255, 0, 0);
  //   ignore_hit = true;
  // }

  // move if touching side
  
  if (hit == "left" || hit == "right" && ignore_hit == false) {
    playerScore++;
    fill(0, 255, 0);
    let paddleSpeedX = (paddleX - lastPaddleX);
    if (paddleSpeedX == 0.0){

      ballSpeedX *= -1;
    }
    else{
      ballSpeedX = paddleSpeedX;
    }
  }
  if (hit == "top" || hit == "bottom" && ignore_hit == false) {
    playerScore++;
    fill(0, 0, 255);
    let paddleSpeedY =  (paddleY - lastPaddleY);
    if (paddleSpeedY == 0.0){
      ballSpeedY += 0.1;
      ballSpeedY *= -1;
    }
    else{
      ballSpeedY = paddleSpeedY;
    }
  }

  if (hit != "") {
    ignore_hit = true;
    // fill(255, 200, 100);

    data = {
      x     : ballX, 
      y     : ballY, 
      speedX: ballSpeedX, 
      speedY: ballSpeedY, 
      r     : ballRad
    };

    socket.emit("hit", data);
  }
  else {
    if (paddle_timeout <= 0) {
      ignore_hit = false;
      paddle_timeout = 16;
    }
    paddle_timeout--;
  }

  circle(ballX, ballY, ballRad);

  rectMode(CORNER);

  // angleMode(RADIANS);
  // rotate(angle);

  for(let key in otherPlayers) {
    let value = otherPlayers[key];

    fill(value.colour);

    rect(value.x, value.y, rectWidth, rectHeight);
  }
  

  lastPaddleX = paddleX;
  lastPaddleY = paddleY;
}


// https://github.com/bmoren/p5.collide2D/blob/master/p5.collide2d.js
function collide_Rect_Circle(rx, ry, rw, rh, cx, cy, diameter) {
  
  let side = "";
  //2d
  // temporary variables to set edges for testing
  var testX = cx;
  var testY = cy;

  // which edge is closest?
  if (cx < rx){
    testX = rx;
    side = "left"      // left edge
  }else if (cx > rx+rw){
    testX = rx+rw
    side = "right"
  }   // right edge

  if (cy < ry){
    testY = ry       // top edge
    side = "top"
  }else if (cy > ry+rh){
    testY = ry+rh
    side = "bottom"
  }   // bottom edge

  // // get distance from closest edges
  var distance = this.dist(cx,cy,testX,testY)

  // if the distance is less than the radius, collision!
  if (distance <= diameter/2) {
    return side;
  }
  return "";
};