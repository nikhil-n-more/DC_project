/*var board1 = nullvar game = new Chess()var $status = $('#status')var $fen = $('#fen')var $pgn = $('#pgn')function onDragStart (source, piece, position, orientation) {// do not pick up pieces if the game is overif (game.game_over()) return false// only pick up pieces for the side to moveif ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||(game.turn() === 'b' && piece.search(/^w/) !== -1)) {return false}}function onSnapEnd () {board.position(game.fen())}function updateStatus () {var status = ''var moveColor = 'White'if (game.turn() === 'b') {moveColor = 'Black}// checkmate?if (game.in_checkmate()) {status = 'Game over, ' + moveColor + ' is in checkmate.'}// draw?else if (game.in_draw()) {status = 'Game over, drawn position'}// game still onelse {status = moveColor + ' to move'// check?if (game.in_check()) {status += ', ' + moveColor + ' is in check'}}$status.html(status)$fen.html(game.fen())$pgn.html(game.pgn())}function onDragMove (newLocation, oldLocation, source,piece, position, orientation) {console.log('New location: ' + newLocation)console.log('Old location: ' + oldLocation)console.log('Source: ' + source)console.log('Piece: ' + piece)console.log('Position: ' + Chessboard.objToFen(position))console.log('Orientation: ' + orientation)console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')}function onDrop (source, target) {// see if the move is legalvar move = game.move({from: source,to: target,promotion: 'q' // NOTE: always promote to a queen for example simplicity})// illegal moveif (move === null) return 'snapback'updateStatus()}function onSnapbackEnd (piece, square, position, orientation) {console.log('Piece: ' + piece)console.log('Square: ' + square)console.log('Position: ' + Chessboard.objToFen(position))console.log('Orientation: ' + orientation)console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')}function onMoveEnd (oldPos, newPos) {console.log('Move animation complete:')console.log('Old position: ' + Chessboard.objToFen(oldPos))console.log('New position: ' + Chessboard.objToFen(newPos))console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')}var config = {position: 'start',orientation: 'white',showNotation: false,draggable: true,onDragStart: onDragStart,onDragMove: onDragMove,onDrop: onDrop,onSnapbackEnd: onSnapbackEnd,onMoveEnd: onMoveEnd,onSnapEnd: onSnapEnd,dropOffBoard: 'snapback',moveSpeed: 'slow',snapbackSpeed: 500,snapSpeed: 100,}function clickShowPositionBtn(){console.log('Current position as an Object:')console.log(board.position())console.log('Current position as a FEN string:')console.log(board.fen())}board1 = ChessBoard('board1', config);*/

$(function () {
  "use strict";

///////////////////////////////////////////////////////
///////////////////CHAT Function///////////////////////
//////////////////////////////////////////////////////

  // for better performance - to avoid searching in DOM
  var content = $('#content');
  var input = $('#input');
  var status = $('#status');
  // my color assigned by the server
  var myColor = false;
  // my name sent to the server
  var myName = false;
  var hasMoved = false;
  var side = "white";
  var play = true;
  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  // if browser doesn't support WebSocket, just show
  // some notification and exit
  if (!window.WebSocket) {
    content.html($('<p>',
      { text:'Sorry, but your browser doesn\'t support WebSocket.'}
    ));
    input.hide();
    $('span').hide();
    return;
  }
  // open connection
  var connection = new WebSocket('ws://127.0.0.1:3000');
  connection.onopen = function () {
    // first we want users to enter their names
    input.removeAttr('disabled');
    status.text('Choose name:');
  };
  connection.onerror = function (error) {
    // just in there were some problems with connection...
    content.html($('<p>', {
      text: 'Sorry, but there\'s some problem with your '
         + 'connection or the server is down.'
    }));
  };
  

/////////////////////////////////////////////////////////
///////////////////Chess Function////////////////////////
////////////////////////////////////////////////////////

var board = null
var game = new Chess()
var $status = $('#report')
//var $fen = $('#fen')
//var $pgn = $('#pgn')
var whiteSquareGrey = '#0099ff'
var blackSquareGrey = '#ff66cc'

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
  if(game.turn() === 'w' && side === 'black'){
    return false;
  }
  if(game.turn() === 'b' && side === 'white'){
    return false;
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  /*if (game.game_over()) {
    //state.innerHTML = 'GAME OVER';
    //socket.emit('gameOver', roomId)
    connection.sendUTF(
      JSON.stringify({type:'warning', data: 'Game Over'}));
}*/
  // illegal move
  if (move === null){
    return 'snapback';
  }
  else{
    var moves = {
      type: "move",
      board: game.fen(),
      color: move.color,
      from: move.from,
      to: move.to,
      flags: move.flags,
      piece: move.piece,
      san: move.san,
      promotion: "q"
    }
    var json = JSON.stringify(moves);
    //console.log(json);
    connection.send(json);
    hasMoved = true;
  }

  updateStatus()
}

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  //$fen.html(game.fen())
  //$pgn.html(game.pgn())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
}
board = Chessboard('myBoard', config)

updateStatus()






//Ekagra yaha se dekhna 
//server json return karega and then I am parsing it retreive JSON object






// most important part - incoming messages
connection.onmessage = function (message) {
  // try to parse JSON message. Because we know that the server
  // always returns JSON this should work without any problem but
  // we should make sure that the massage is not chunked or
  // otherwise damaged.
  try {
    var json = JSON.parse(message.data);
  } catch (e) {
    console.log('Invalid JSON: ', message.data);
    return;
  }
  // NOTE: if you're not sure about the JSON structure
  // check the server source code above
  // first response from the server with user's color
  if (json.type === 'color') {    /////just ek field hai usko to kuch bhi naam de sakta hai
    myColor = json.data;
    side = json.side;
    console.log(side);
    status.text(myName + ': ').css('color', myColor);
    input.removeAttr('disabled').focus();
    // from now user can start sending messages
  } else if (json.type === 'history') { // entire message history
    // insert every single message to the chat window
    for (var i=0; i < json.data.length; i++) {
    addMessage(json.data[i].author, json.data[i].text,
        json.data[i].color, new Date(json.data[i].time));
    }
  } else if (json.type === 'message') { // it's a single message
    // let the user write another message

    //var moves = JSON.parse(json.data);

    input.removeAttr('disabled'); 
    addMessage(json.data.author, json.data.text,
               json.data.color, new Date(json.data.time));
  } else if (json.type === 'move'){
    //console.log(JSON.stringify(json));
    if(hasMoved){
      hasMoved = false;
    }
    else{
      //console.log("Begin Moving already");
      var move = {
        color: json.color,
        from: json.from,
        to: json.to,
        flags: json.flags,
        piece: json.piece,
        san: json.san,
        promotion: "q"
      }
      var fen = json.board;
      game.move(move);
      board.position(game.fen());
    }
  } else{
    console.log("Unknown data format");
  }
};
/**
 * Send message when user presses Enter key
 */
input.keydown(function(e) {
  if (e.keyCode === 13) {
    var msg = $(this).val();
    if (!msg) {
      return;
    }
    // send the message as an ordinary text
    connection.send(msg);
    $(this).val('');
    // disable the input field to make the user wait until server
    // sends back response
    input.attr('disabled', 'disabled');
    // we know that the first message sent from a user their name
    if (myName === false) {
      myName = msg;
    }
  }
});
/**
 * This method is optional. If the server wasn't able to
 * respond to the in 3 seconds then show some error message 
 * to notify the user that something is wrong.
 */
setInterval(function() {
  if (connection.readyState !== 1) {
    status.text('Error');
    input.attr('disabled', 'disabled').val(
        'Unable to communicate with the WebSocket server.');
  }
}, 3000);
/**
 * Add message to the chat window
 */
function addMessage(author, message, color, dt) {
  content.prepend('<p><span style="color:' + color + '">'
      + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
      + dt.getHours() : dt.getHours()) + ':'
      + (dt.getMinutes() < 10
        ? '0' + dt.getMinutes() : dt.getMinutes())
      + ': ' + message + '</p>');
}
});



