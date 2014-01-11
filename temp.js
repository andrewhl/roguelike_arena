// (function() {
//   var Arena = function() {
//     this.FONT = 32;
//     this.ROWS = 10;
//     this.COLS = 15;
//     this.ACTORS = 10;
//     this.map = [];
//     this.screen = [];
//     this.game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
//       create: create
//     });

//     return {
//       initMap: function() {
//         for (var y = 0; y < ROWS; y++) {
//           var newRow = [];
//           for (var x = 0; x < COLS; x++) {
//             if (Math.random() > 0.8)
//               newRow.push('#');
//             else
//               newRow.push('.');
//           }
//           this.map.push(newRow);
//         }
//       },
//       create: function() {
//         // init keyboard commands
//         game.input.keyboard.addCallbacks(null, null, onKeyUp);

//         initMap();
//       },
//       onKeyUp: function(event) {
//         switch (event.keyCode) {
//           case Keyboard.LEFT:
//           case Keyboard.RIGHT:
//           case Keyboard.UP:
//           case Keyboard.DOWN:
//         }
//       }
//     }
//   }
//   arena = new Arena();
// })();

var FONT = 32,
    ROWS = 15,
    COLS = 25,
    ACTORS = 10,
    map,
    screen,
    player,
    actorList,
    livingEnemies,
    actorMap;

// initialize phaser, call create() once done
var game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
  create: create
});

function create() {
  // init keyboard commands
  game.input.keyboard.addCallbacks(null, null, onKeyUp);

  initMap();

  screen = [];
  for (var y = 0; y < ROWS; y++) {
    var newRow = [];
    screen.push(newRow);
    for (var x = 0; x < COLS; x++)
      newRow.push( initCell('', x, y) );
  }
  drawMap();
  initActors();
  drawActors();
}

function initCell(char, x, y) {
  var style = { font: FONT + "px monospace", fill: "#fff" };
  return game.add.text(FONT * 0.6 * x, FONT * y, char, style);
}

function initMap() {
  map = [];
  for (var y = 0; y < ROWS; y++) {

    var newRow = [];

    for (var x = 0; x < COLS; x++) {
      if (y === 0 || x === 0 || x === COLS - 1 || y === ROWS - 1)
        newRow.push('#');
      else if ((Math.random() < 0.1))
        newRow.push('#');
      else
        newRow.push('.');
    }
    map.push(newRow);
  }
}

function drawMap() {
  for (var y = 0; y < ROWS; y++)
    for (var x = 0; x < COLS; x++)
      screen[y][x].content = map[y][x];
}

function onKeyUp(event) {
  switch (event.keyCode) {
    case Keyboard.LEFT:
    case Keyboard.RIGHT:
    case Keyboard.UP:
    case Keyboard.DOWN:
  }
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function initActors () {
  // create actors at random locations
  actorList = [];
  actorMap = {};
  for (var e = 0; e < ACTORS; e++) {
    // create new actor
    var actor = { x: 0, y: 0, hp: e === 0 ? 3 : 1 };
    do {
      // pick a random position that is both a floor and not occupied
      actor.y = randomInt(ROWS);
      actor.x = randomInt(COLS);
    } while ( map[actor.y][actor.x] === '#' || actorMap[actor.y + '_' + actor.x] !== null);

    // add references to the actor to the actors list & map
    actorMap[actor.y + '_' + actor.x] = actor;
    actorList.push(actor);

  }

  // the player is the first actor in the list
  player = actorList[0];
  livingEnemies = ACTORS - 1;

}

function drawActors () {
  for (var a in actorList) {
    if (actorList[a].hp > 0)
      screen[actorList[a].y][actorList[a].x].content = (a === 0 ? '' + player.hp : 'e');
  }
}