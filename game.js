// By default, the first board loaded by your page will be the same 
// each time you load (which is accomplished by "seeding" the random
// number generator. This makes testing (and grading!) easier!
Math.seedrandom(0);


// A short jQuery extension to read query parameters from the URL.
$.extend({
  getUrlVars: function() {
    var vars = [], pair;
    var pairs = window.location.search.substr(1).split('&');
    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i].split('=');
      vars.push(pair[0]);
      vars[pair[0]] = pair[1] &&
          decodeURIComponent(pair[1].replace(/\+/g, ' '));
    }
    return vars;
  },
  getUrlVar: function(name) {
    return $.getUrlVars()[name];
  }
});

// constants
let DEFAULT_boardSize = 8;
let TABLE_HEIGHT = 320;
let CANVAS_SIZE = 320;
let COLUMN_NAME = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t"];
let ROW_NAME = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
let IS_DEBUGGING = true;

// data model at global scope for easier debugging
var board;
var rules;

// initialize board
if ($.getUrlVar('size') && $.getUrlVar('size') >= 3) {
  board = new Board($.getUrlVar('size'));
} else {
  board = new Board(DEFAULT_boardSize);
}

// load a rule
rules = new Rules(board);

var boardSize = board.getSize();
var cellSize = CANVAS_SIZE / boardSize;
let canvas;
let context; 
let canvasOffset;
let lastColor = "black";
let suggestedMove = [-1, -1];
let isShowingMove = false;
let draggingStartMouseX = 0;
let draggingStartMouseY = 0;
let isDragging = false;
let draggedCandyRow = -1;
let draggedCandyCol = -1;
let draggedCandyX = 0;
let draggedCandyY = 0;
let dragDirection = "";
let suggestedArrow;

var initCandyImages = function() {
  $("#canvas").prepend("<img id='blue-candy' src='graphics/blue-candy.png' />");
  $("#canvas").prepend("<img id='green-candy' src='graphics/green-candy.png' />");
  $("#canvas").prepend("<img id='orange-candy' src='graphics/orange-candy.png' />");
  $("#canvas").prepend("<img id='purple-candy' src='graphics/purple-candy.png' />");
  $("#canvas").prepend("<img id='red-candy' src='graphics/red-candy.png' />");
  $("#canvas").prepend("<img id='yellow-candy' src='graphics/yellow-candy.png' />");
  $("#canvas").prepend("<img id='arrow' src='graphics/arrow.png' />");
}

// Flip two candies
var moveCandy = function(col, row, direction) {
  if (IS_DEBUGGING) console.log(COLUMN_NAME[col] + row.toString() + ", " + direction);

  let selectedCandy = board.getCandyAt(row, col);
  let targetCandy = board.getCandyInDirection(selectedCandy, direction);

  /*
  let selectedCandyX = col*cellSize;
  let selectedCandyY = row*cellSize;
  let targetCandyX = targetCandy.col*cellSize;
  let targetCandyY = targetCandy.row*cellSize;
  let startX = col*cellSize;
  let startY = row*cellSize;
  let endX = targetCandy.col*cellSize;
  let endY = targetCandy.row*cellSize;
  let selectedImg = document.getElementById(selectedCandy.color + "-candy");
  let targetImg = document.getElementById(targetCandy.color + "-candy");

  setTimeout(function() { 
    context.clearRect(selectedCandyX, selectedCandyY, cellSize, cellSize);
    context.clearRect(targetCandyX, targetCandyY, cellSize, cellSize);

    if (endX != startX) {
      selectedCandyX += Math.abs(endX-startX)/(endX-startX);  // 1 or -1
      targetCandyX -= Math.abs(endX-startX)/(endX-startX);  // 1 or -1
    }
    if (endY != startY) {
      selectedCandyY += Math.abs(endY-startY)/(endY-startY);  // 1 or -1
      targetCandyY -= Math.abs(endY-startY)/(endY-startY);  // 1 or -1
    }
    
    context.drawImage(selectedImg, selectedCandyX, selectedCandyY, cellSize, cellSize);
    context.drawImage(targetImg, targetCandyX, targetCandyY, cellSize, cellSize);
  }, 1000);
  */
  
  lastColor = selectedCandy.color;
  board.flipCandies(selectedCandy, targetCandy);
}

var updateCandyLocation = function() {
  for (var row = 0; row < boardSize; row++) {
    for (var col = 0; col < boardSize; col++) {
      let img = document.getElementById(board.getCandyAt(row, col).color + "-candy");
      context.drawImage(img, col*cellSize, row*cellSize, cellSize, cellSize);
    }
  }
}

// Group functions that are called together at the end of each flip or crush.
//  - Update the latest position of each candy.
//  - Check if there is any crush.
var updateBoard = function() {
  updateCandyLocation();
  if (rules.getCandyCrushes().length > 0) crush();
} 

// Final initialization entry point: the Javascript code inside this block
// runs at the end of start-up when the page has finished loading.
$(document).ready(function()
{
  // Your code here.
  initCandyImages();

  cellLocationTextarea = $("#cellLocation");
  
  // Canvas.
  canvas = document.getElementById("canvas");
  canvasOffset = $('#canvas').offset();
  if (IS_DEBUGGING) console.log("Canvas offset top: " + canvasOffset.top + "\nCanvas offset left: " + canvasOffset.left);

  // Context.
  context = canvas.getContext("2d");
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Listen for mouse events on canvas.
  // Reference: https://stackoverflow.com/questions/28284754/dragging-shapes-using-mouse-after-creating-them-with-html5-canvas
  canvas.onmousedown = canvasMouseDown;
  canvas.onmouseup = canvasMouseUp;
  canvas.onmousemove = canvasMouseMove;

  // Scoreboard
  $("#score").css("background-color", "#000000");
  $("#score").css("color", "#ffffff");

  // Suggestion arrow
  suggestedArrow = $("#suggestedArrow");
  suggestedArrow.attr("width", cellSize);
  suggestedArrow.hide();

  rules.prepareNewGame();
  updateBoard();
});


/* Event Handlers */
// access the candy object with info.candy

// add a candy to the board
$(board).on('add', function(e, info)
{
  // Your code here.
  //if (IS_DEBUGGING) console.log(e, info);

  let currY = -cellSize;
  let currX = info.candy.toCol * cellSize;
  let targetY = info.toRow * cellSize;
  let targetX = info.toCol * cellSize;
  let img = document.getElementById(info.candy.color + "-candy");  
  context.drawImage(img, currX, currY, cellSize, cellSize);
  
  /*
  while (currY < targetY) {
    if (IS_DEBUGGING) console.log(currY, targetY);

    // Put an empty slot at the dragged candy
    context.clearRect(currX, currY, cellSize, cellSize);

    // Update location
    currY++;

    // Draw candy at the new location
    context.drawImage(img, currX, currY, cellSize, cellSize);
  }
  */
});

// move a candy on the board
$(board).on('move', function(e, info)
{
  // Your code here.
  //if (IS_DEBUGGING) console.log(e, info);

  let currY = info.candy.fromRow * cellSize;
  let currX = info.candy.fromCol * cellSize;
  let targetY = info.candy.toRow * cellSize;
  let targetX = info.candy.toCol * cellSize;
  let color = info.candy.color;

  /*
  
  while (targetX != currX && targetY != currY) {
    context.clearRect(currX, currY, cellSize, cellSize);

    if (targetX != currX) 
      currX += Math.abs(targetX-currX) / (targetX-currX);  // 1 or -1
    if (targetY != currY) 
      currY += Math.abs(targetY-currY) / (targetY-currY);  // 1 or -1

    // Get the candy's image
    let img = document.getElementById(color + "-candy");   

    // Draw candy at the new location
    context.drawImage(img, currX, currY, cellSize, cellSize);
  }
  */
});

// remove a candy from the board
$(board).on('remove', function(e, info)
{
  // Your code here.
  let row = info.candy.fromRow;
  let col = info.candy.fromCol;

  context.clearRect(col*cellSize, row*cellSize, cellSize, cellSize);

  if (IS_DEBUGGING) console.log("remove a candy " + info.candy.color);

  let img = document.getElementById(info.candy.color + "-candy");
  context.save();
  context.globalAlpha = 0.4;
  context.drawImage(img, col*cellSize, row*cellSize, cellSize, cellSize);
  context.restore();
});

// move a candy on the board
$(board).on('scoreUpdate', function(e, info)
{
  // Your code here. To be implemented in pset 2.
  $("#score").css("background-color", lastColor);
  if (lastColor == "yellow") {
    $("#score").css("color", "#000000");
  } else {
    $("#score").css("color", "#ffffff");
  }
  $("#score").text(board.score + " points");
});

// Button Events
$(document).on('click', "#btnNewGame", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnNewGame clicked.");

  if (isShowingMove) removeSuggestedArrow();

  board.clear();
  board.resetScore();
  context.clearRect(0,0,CANVAS_SIZE, CANVAS_SIZE);

  $("#score").css("background-color", "#000000");
  $("#score").css("color", "#ffffff");
  $("#score").text("0 point");
  
  rules.prepareNewGame();
  updateBoard();
});

function crush() {
  rules.removeCrushes(rules.getCandyCrushes());

  // After a crush is removed, the system waits 0.5 second to
  //   - Move candies down
  //   - Re-populate the board
  //   - Redraw the whole board
  setTimeout(function() {
    rules.moveCandiesDown();
    context.clearRect(0,0,CANVAS_SIZE, CANVAS_SIZE);
    rules.populateBoard();
    updateBoard();
  }, 500);
}

// keyboard events arrive here
$(document).on('keydown', function(evt) {
  // Your code here.
});

let removeSuggestedArrow = function() {
  $("#suggestedArrow").hide();
  isShowingMove = false;
}

// "Show Move" button
$(document).on('click', "#btnShowMove", function(evt) {
  if (IS_DEBUGGING) console.log("btnShowMove clicked");

  if (!isShowingMove) {
    let move = rules.getRandomValidMove();
    if (IS_DEBUGGING) console.log(move);    

    let tempX = (move.candy.col-0.5)*cellSize; // + canvasOffset.left
    let tempY = move.candy.row*cellSize; // + canvasOffset.top

    if (IS_DEBUGGING) console.log(tempX, tempY, canvasOffset);

    suggestedArrow.css("margin-left", tempX + "px");
    suggestedArrow.css("margin-top", tempY + "px");
    if (IS_DEBUGGING) console.log(suggestedArrow.position());
    suggestedArrow.show();

    isShowingMove = true;
  } else {
    removeSuggestedArrow();
  }
});

function canvasMouseDown(e) {
  if (IS_DEBUGGING) console.log("canvasMouseDown");

  // tell the browser we're handling this mouse event
  e.preventDefault();
  e.stopPropagation();

  if (isShowingMove) removeSuggestedArrow();

  // If the mouse is inside the board
  if (e.clientX >= canvasOffset.left && e.clientX <= canvasOffset.left + CANVAS_SIZE &&
    e.clientY >= canvasOffset.top && e.clientY <= canvasOffset.top + CANVAS_SIZE) {

    // Save starting location
    draggingStartMouseX = e.clientX - canvasOffset.left;
    draggingStartMouseY = e.clientY - canvasOffset.top;

    // Find the selected candy's location
    draggedCandyCol = Math.floor((e.clientX - canvasOffset.left)/cellSize);
    draggedCandyRow = Math.floor((e.clientY-canvasOffset.top)/cellSize);
    draggedCandyX = draggedCandyCol*cellSize;
    draggedCandyY = draggedCandyRow*cellSize;
    
    isDragging = true;

    if (IS_DEBUGGING) console.log("isDragging = " + isDragging);
  }
}

function canvasMouseUp(e) {
  if (IS_DEBUGGING) console.log("canvasMouseUp"); 
  
  isDragging = false;
  if (IS_DEBUGGING) console.log("isDragging = " + isDragging);

  // Get the column and row number of where the dragged candy is
  if (IS_DEBUGGING) console.log("Final destination of the candy: " + draggedCandyX + ", " + draggedCandyY);
  let col = Math.round(draggedCandyX/cellSize);
  let row = Math.round(draggedCandyY/cellSize);

  // Get direction of the movement
  if (row > draggedCandyRow) dragDirection = "down";
  if (row < draggedCandyRow) dragDirection = "up";
  if (col > draggedCandyCol) dragDirection = "right";
  if (col < draggedCandyCol) dragDirection = "left";

  if (rules.isMoveTypeValid(board.getCandyAt(draggedCandyRow, draggedCandyCol), dragDirection)) {
    if (IS_DEBUGGING) console.log("Moved " + dragDirection + 
      " from (" + draggedCandyRow + ", " + draggedCandyCol + 
      ") to ("+ row + ", " + col + ") -- valid move!!!");
    
    moveCandy(draggedCandyCol, draggedCandyRow, dragDirection);
    
    // Clear the board and redraw other candies
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    updateBoard();
  
  } else {
    if (IS_DEBUGGING) console.log("Moved " + dragDirection + 
      " from (" + draggedCandyRow + ", " + draggedCandyCol + 
      ") to ("+ row + ", " + col + ") -- invalid move!!!");

    // Clear the board and redraw all candies
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    updateBoard();
  }
}

function canvasMouseMove(e) {
  if (isDragging) {
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();

    // Current location of the mouse
    let mouseX = e.clientX - canvasOffset.left;
    let mouseY = e.clientY - canvasOffset.top;

    // Calculate the distance of mouse movement
    let dx = mouseX - draggingStartMouseX;
    let dy = mouseY - draggingStartMouseY;

    // Update the candy's new location
    draggedCandyX += dx;
    draggedCandyY += dy;
    if (IS_DEBUGGING) console.log("Mouse location on the canvas: " + draggedCandyX + ", " + draggedCandyY);

    // Update the new starting location for another iteration
    draggingStartMouseX = mouseX;
    draggingStartMouseY = mouseY;

    // Get the candy's image
    let img = document.getElementById(board.getCandyAt(draggedCandyRow, draggedCandyCol).color + "-candy");

    // Clear the board and redraw other candies
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    updateBoard();

    // Put an empty slot at the dragged candy
    context.clearRect(draggedCandyCol*cellSize, draggedCandyRow*cellSize, cellSize, cellSize);    

    // Draw candy at the new location
    context.drawImage(img, draggedCandyX, draggedCandyY, cellSize, cellSize);
  }
}
