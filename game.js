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
var cellLocation = "";  // User input
var cellSize = CANVAS_SIZE / boardSize;
let canvas;
let context; 
let canvasOffset = 0;
let lastColor = "black";
let suggestedMove = [-1, -1];
let isShowingMove = false;
let draggingStartMouseX = 0;
let draggingStartMouseY = 0;
let isDragging = false;
let isDragged = new Array(boardSize);

var initCandyImages = function() {
  $("#canvas").prepend("<img id='blue-candy' src='graphics/blue-candy.png' />");
  $("#canvas").prepend("<img id='green-candy' src='graphics/green-candy.png' />");
  $("#canvas").prepend("<img id='orange-candy' src='graphics/orange-candy.png' />");
  $("#canvas").prepend("<img id='purple-candy' src='graphics/purple-candy.png' />");
  $("#canvas").prepend("<img id='red-candy' src='graphics/red-candy.png' />");
  $("#canvas").prepend("<img id='yellow-candy' src='graphics/yellow-candy.png' />");
  $("#canvas").prepend("<img id='arrow' src='graphics/arrow.png' />");
}

// Disable all arrow buttons at the beginning and when there is no possible move (including invalid input).
var lockArrowButtons = function() {
    $("#btnUpArrow").prop("disabled", true);
    $("#btnDownArrow").prop("disabled", true);
    $("#btnLeftArrow").prop("disabled", true);
    $("#btnRightArrow").prop("disabled", true);
    $("#btnCrushOnce").prop("disabled", true);
}

// Check if user's input is valid (column ranges from "a" to "h", row ranges from 1 to 8, input contains exactly two characters)
var validateMoveInput = function(cellLocation) {
  return (cellLocation.length > 0 && cellLocation.length <= 3 && 
    COLUMN_NAME.indexOf(cellLocation[0].toLowerCase()) != -1 && 
    parseInt(cellLocation[1]) >= 0 && parseInt(cellLocation[1]) <= boardSize);
}

// Flip two candies
var moveCandy = function(col, row, direction) {
  if (IS_DEBUGGING) console.log(COLUMN_NAME[col] + row.toString() + ", " + direction);

  var selectedCandy = board.getCandyAt(row, col);
  var targetCandy = board.getCandyInDirection(selectedCandy, direction);
  if (IS_DEBUGGING) console.log(targetCandy.row, targetCandy.col);

  context.clearRect(col*cellSize, row*cellSize, CANVAS_SIZE, CANVAS_SIZE);
  context.clearRect(targetCandy.col*cellSize, targetCandy.row*cellSize, CANVAS_SIZE, CANVAS_SIZE);
  lastColor = selectedCandy.color;
  board.flipCandies(selectedCandy, targetCandy);
}

// After a move is done, clear the user's input and re-focus on the text field.
var clearAndFocusTextField = function() {
  let cellLocationTextarea = $("#cellLocation");
  cellLocationTextarea.val("");

  if (rules.getCandyCrushes().length == 0) {
    cellLocationTextarea.prop("disabled", false);
    cellLocationTextarea.focus();
  } else {
    cellLocationTextarea.prop("disabled", true);
  }
  
  cellLocation = "";
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
//  - Clear any value in the text field and re-focus to it.
//  - Lock the arrow buttons as the text field is empty.
//  - Check if there is any crush.
var updateBoard = function() {
  updateCandyLocation();
  clearAndFocusTextField();
  lockArrowButtons();

  if (rules.getCandyCrushes().length > 0) $("#btnCrushOnce").prop("disabled", false);
} 

// Final initialization entry point: the Javascript code inside this block
// runs at the end of start-up when the page has finished loading.
$(document).ready(function()
{
  // Your code here.
  initCandyImages();
  
  // Canvas.
  canvas = document.getElementById("canvas");
  console.log(canvas);

  // listen for mouse events on canvas.
  canvas.onmousedown = canvasMouseDown;
  canvas.onmouseup = canvasMouseUp;
  canvas.onmousemove = canvasMouseMove;

  context = canvas.getContext("2d");
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  isDragging = false;
  for (let i = 0; i < boardSize; i++) {
    isDragged[i] = new Array(boardSize);
    for (let j = 0; j < boardSize; j++) {
      isDragged[i][j] = false;
    }
  }

  $("#score").css("background-color", "#000000");
  $("#score").css("color", "#ffffff");

  // Suggestion arrow
  $("#suggestedArrow").attr("width", cellSize);
  $("#suggestedArrow").hide();

  rules.prepareNewGame();
  updateBoard();

  console.log($("#mainColumn"));
});


/* Event Handlers */
// access the candy object with info.candy

// add a candy to the board
$(board).on('add', function(e, info)
{
  // Your code here.
});

// move a candy on the board
$(board).on('move', function(e, info)
{
  // Your code here.
  if (IS_DEBUGGING) console.log(e, info);
  
});

// remove a candy from the board
$(board).on('remove', function(e, info)
{
  // Your code here.
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


$(document).on('click', "#btnUpArrow", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnUpArrow clicked.");

  if (isShowingMove) removeSuggestedArrow();

  let col = COLUMN_NAME.indexOf(cellLocation[0]);
  let row = parseInt(cellLocation.substring(1, cellLocation.length))-1;
  moveCandy(col, row, "up");
  updateBoard();
});


$(document).on('click', "#btnDownArrow", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnDownArrow clicked.");

  if (isShowingMove) removeSuggestedArrow();

  let col = COLUMN_NAME.indexOf(cellLocation[0]);
  let row = parseInt(cellLocation.substring(1, cellLocation.length))-1;
  moveCandy(col, row, "down");
  updateBoard();
});


$(document).on('click', "#btnLeftArrow", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnLeftArrow clicked.");

  if (isShowingMove) removeSuggestedArrow();

  let col = COLUMN_NAME.indexOf(cellLocation[0]);
  let row = parseInt(cellLocation.substring(1, cellLocation.length))-1;
  moveCandy(col, row, "left");
  updateBoard();
});


$(document).on('click', "#btnRightArrow", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnRightArrow clicked.");

  if (isShowingMove) removeSuggestedArrow();

  let col = COLUMN_NAME.indexOf(cellLocation[0]);
  let row = parseInt(cellLocation.substring(1, cellLocation.length))-1;
  moveCandy(col, row, "right");
  updateBoard();
});


// Crush button
$(document).on('click', "#btnCrushOnce", function(evt)
{
  // Your code here.
  if (IS_DEBUGGING) console.log("btnCrushOnce clicked.");

  if (isShowingMove) removeSuggestedArrow();

  $("#cellLocation").prop("disabled", true);

  rules.removeCrushes(rules.getCandyCrushes());

  // After a crush is removed, the system waits 0.5 second to
  //   - Move candies down
  //   - Re-populate the board
  //   - Accept new input
  //   - Redraw the whole board
  setTimeout(function() {
    rules.moveCandiesDown();
    context.clearRect(0,0,CANVAS_SIZE, CANVAS_SIZE);
    rules.populateBoard();
    $("#cellLocation").prop("disabled", false);
    updateBoard();
  }, 500);
});


// keyboard events arrive here
$(document).on('keydown', function(evt) {
  // Your code here.
});


// Detect and parse input immediately when user is typing
$(document).on("keyup blur change", function(evt) {
  // Your code here.
  cellLocation = $("#cellLocation").val();
  if (IS_DEBUGGING) console.log(cellLocation);

  if (validateMoveInput(cellLocation)) {
    let col = COLUMN_NAME.indexOf(cellLocation[0]);
    let row = parseInt(cellLocation.substring(1, cellLocation.length))-1;
    let selectedCandy = board.getCandyAt(row, col);

    if (rules.isMoveTypeValid(selectedCandy, "up")) $("#btnUpArrow").prop("disabled", false);
    if (rules.isMoveTypeValid(selectedCandy, "down")) $("#btnDownArrow").prop("disabled", false);
    if (rules.isMoveTypeValid(selectedCandy, "left")) $("#btnLeftArrow").prop("disabled", false);
    if (rules.isMoveTypeValid(selectedCandy, "right")) $("#btnRightArrow").prop("disabled", false);

    if (rules.getCandyCrushes().length > 0) {
      $("#btnCrushOnce").prop("disabled", false);
      $("#cellLocation").disabled = true;
    } else {
      $("#cellLocation").disabled = false;
    }

  } else {
    lockArrowButtons();
  }
});

// Click a candy to select
$(document).on('click', function(e) {
  console.log(e);
  if (e.clientX >= canvasOffset.left && e.clientX <= canvasOffset.left + CANVAS_SIZE &&
    e.clientY >= canvasOffset.top && e.clientY <= canvasOffset.top + CANVAS_SIZE) {

    let col = Math.floor((e.clientX - canvasOffset.left)/cellSize);
    let row = Math.floor((e.clientY-canvasOffset.top)/cellSize);
    
    if (IS_DEBUGGING) console.log(row, col, board.getCandyAt(row, col));
    
    cellLocation = COLUMN_NAME[col] + ROW_NAME[row].toString();
    $("#cellLocation").val(cellLocation);
    console.log(cellLocation);
    
    if (validateMoveInput(cellLocation)) {
      var selectedCandy = board.getCandyAt(row, col);
  
      if (rules.isMoveTypeValid(selectedCandy, "up")) $("#btnUpArrow").prop("disabled", false);
      if (rules.isMoveTypeValid(selectedCandy, "down")) $("#btnDownArrow").prop("disabled", false);
      if (rules.isMoveTypeValid(selectedCandy, "left")) $("#btnLeftArrow").prop("disabled", false);
      if (rules.isMoveTypeValid(selectedCandy, "right")) $("#btnRightArrow").prop("disabled", false);
  
      if (rules.getCandyCrushes().length > 0) {
        $("#btnCrushOnce").prop("disabled", false);
        $("#cellLocation").disabled = true;
      }
  
    } else {
      lockArrowButtons();
    }
  }
});

let removeSuggestedArrow = function() {
  /*
  if (row > 0 && col > 0) {
    let leftCandy = board.getCandyAt(row, col-1);
    let suggestedCandy = board.getCandyAt(row, col);
  
    if (IS_DEBUGGING) console.log(board.square, leftCandy, suggestedCandy);
  
    context.clearRect((col-1)*cellSize, row*cellSize, cellSize*2, cellSize);
    
    let img = document.getElementById(leftCandy.color + "-candy");
    context.drawImage(img, (col-1)*cellSize, row*cellSize, cellSize, cellSize);
  
    img = document.getElementById(suggestedCandy.color + "-candy");
    context.drawImage(img, col*cellSize, row*cellSize, cellSize, cellSize);
  }
  */
  $("#suggestedArrow").hide();

  isShowingMove = false;
}

// "Show Move" button
$(document).on('click', "#btnShowMove", function(evt) {
  if (IS_DEBUGGING) console.log("btnShowMove clicked");

  if (!isShowingMove) {
    let candy = rules.getRandomValidMove().candy;
    if (IS_DEBUGGING) console.log(candy);    

    //context.drawImage(arrow, (candy.col-0.5)*cellSize, candy.row*cellSize, cellSize, cellSize);
    $("#suggestedArrow").css("margin-left:" + ($("mainColumn").offsetLeft + (candy.col-0.5)*cellSize) + "px");
    $("#suggestedArrow").css("margin-top:" + (candy.row*cellSize) + "px");
    $("#suggestedArrow").show();

    isShowingMove = true;
  } else {
    removeSuggestedArrow();
  }
});

function canvasMouseDown(e) {

}

function canvasMouseUp(e) {
  
}

function canvasMouseMove(e) {
  
}