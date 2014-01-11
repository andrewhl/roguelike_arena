var ARENA = ARENA || {};

var settings = {
  FONT: 32, // default font size
  ROWS: 10, // map dimensions
  COLS: 15,
  ACTORS: 15 // number of actors per level, including player
};

ARENA.namespace = function (ns_string) {
  var parts = ns_string.split('.'),
      parent = ARENA,
      i;

  // strip redundant leading global
  if (parts[0] === 'ARENA') {
    parts= parts.slice(1);
  }

  for (i = 0; i < parts.length; i += 1) {
    // create a property if it doesn't exist
    if (typeof parent[parts[i]] === 'undefined') {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }
  return parent;
};

var ARENA = {
  map: null,
  screen: null, // the ascii display, as a 2d array of characters

  // a list of all actors, 0 is the player
  player: null,
  actorList: null,
  livingEnemies: null,

  // points to each actor in its position, for quick searching
  actorMap: null,

  // initialize phaser, call create() once done
  game: new Phaser.Game(settings.COLS * settings.FONT * 0.6, settings.ROWS * settings.FONT, Phaser.AUTO, null, {
    create: create
  }),

  drawMap: function() {
    for (var y = 0; y < settings.ROWS; y++)
      for (var x = 0; x < settings.COLS; x++)
        this.screen[y][x].content = this.map[y][x];
  }

};




function create() {
  // init keyboard commands
  ARENA.game.input.keyboard.addCallbacks(null, null, onKeyUp);

  // initialize map
  initMap();

  // initialize screen
  ARENA.screen = [];
  for (var y = 0; y < settings.ROWS; y++) {
    var newRow = [];
    ARENA.screen.push(newRow);
    for (var x = 0; x < settings.COLS; x++)
      newRow.push(initCell('', x, y));
  }

  // initialize actors
  initActors();

  // draw level
  ARENA.drawMap();
  drawActors();
}

function initCell(chr, x, y) {
  // add a single cell in a given position to the ascii display
  var style = {
    font: settings.FONT + "px monospace",
    fill: "#fff"
  };
  return ARENA.game.add.text(settings.FONT * 0.6 * x, settings.FONT * y, chr, style);
}

function initMap() {
  // create a new random map
  ARENA.map = [];
  for (var y = 0; y < settings.ROWS; y++) {
    var newRow = [];
    for (var x = 0; x < settings.COLS; x++) {
      if (Math.random() > 0.8)
        newRow.push('#');
      else
        newRow.push('.');
    }
    ARENA.map.push(newRow);
  }
}



function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function initActors() {
  // create actors at random locations
  ARENA.actorList = [];
  ARENA.actorMap = {};
  for (var e = 0; e < settings.ACTORS; e++) {
    // create new actor
    var actor = {
      x: 0,
      y: 0,
      hp: e == 0 ? 3 : 1
    };
    do {
      // pick a random position that is both a floor and not occupied
      actor.y = randomInt(settings.ROWS);
      actor.x = randomInt(settings.COLS);
    } while (ARENA.map[actor.y][actor.x] == '#' || ARENA.actorMap[actor.y + "_" + actor.x] != null);

    // add references to the actor to the actors list & map
    ARENA.actorMap[actor.y + "_" + actor.x] = actor;
    ARENA.actorList.push(actor);
  }

  // the player is the first actor in the list
  ARENA.player = ARENA.actorList[0];
  ARENA.livingEnemies = settings.ACTORS - 1;
}

function drawActors() {
  for (var a in ARENA.actorList) {
    if (ARENA.actorList[a] != null && ARENA.actorList[a].hp > 0)
      ARENA.screen[ARENA.actorList[a].y][ARENA.actorList[a].x].content = a == 0 ? '' + ARENA.player.hp : 'e';
  }
}

function canGo(actor,dir) {
  return  actor.x+dir.x >= 0 &&
      actor.x+dir.x <= settings.COLS - 1 &&
      actor.y+dir.y >= 0 &&
      actor.y+dir.y <= settings.ROWS - 1 &&
      ARENA.map[actor.y+dir.y][actor.x +dir.x] == '.';
}

function moveTo(actor, dir) {
  // check if actor can move in the given direction
  if (!canGo(actor,dir))
    return false;

  // moves actor to the new location
  var newKey = (actor.y + dir.y) +'_' + (actor.x + dir.x);
  // if the destination tile has an actor in it
  if (ARENA.actorMap[newKey] != null) {
    //decrement hitpoints of the actor at the destination tile
    var victim = ARENA.actorMap[newKey];
    victim.hp--;

    // if it's dead remove its reference
    if (victim.hp == 0) {
      ARENA.actorMap[newKey]= null;
      ARENA.actorList[ARENA.actorList.indexOf(victim)]=null;
      if(victim!=ARENA.player) {
        ARENA.livingEnemies--;
        if (ARENA.livingEnemies == 0) {
          // victory message
          var victory = ARENA.game.add.text(ARENA.game.world.centerX, ARENA.game.world.centerY, 'Victory!\nCtrl+r to restart', { fill : '#2e2', align: "center" } );
          victory.anchor.setTo(0.5,0.5);
        }
      }
    }
  } else {
    // remove reference to the actor's old position
    ARENA.actorMap[actor.y + '_' + actor.x]= null;

    // update position
    actor.y+=dir.y;
    actor.x+=dir.x;

    // add reference to the actor's new position
    ARENA.actorMap[actor.y + '_' + actor.x]=actor;
  }
  return true;
}

function onKeyUp(event) {
  // draw map to overwrite previous actors positions
  ARENA.drawMap();

  // act on player input
  var acted = false;
  switch (event.keyCode) {
    case Phaser.Keyboard.LEFT:
      acted = moveTo(ARENA.player, {x:-1, y:0});
      break;

    case Phaser.Keyboard.RIGHT:
      acted = moveTo(ARENA.player,{x:1, y:0});
      break;

    case Phaser.Keyboard.UP:
      acted = moveTo(ARENA.player, {x:0, y:-1});
      break;

    case Phaser.Keyboard.DOWN:
      acted = moveTo(ARENA.player, {x:0, y:1});
      break;
  }

  // enemies act every time the player does
  if (acted)
    for (var enemy in ARENA.actorList) {
      // skip the player
      if(enemy==0)
        continue;

      var e = ARENA.actorList[enemy];
      if (e != null)
        aiAct(e);
    }

  // draw actors in new positions
  drawActors();
}

function aiAct(actor) {
  var directions = [ { x: -1, y:0 }, { x:1, y:0 }, { x:0, y: -1 }, { x:0, y:1 } ];
  var dx = ARENA.player.x - actor.x;
  var dy = ARENA.player.y - actor.y;

  // if player is far away, walk randomly
  if (Math.abs(dx) + Math.abs(dy) > 6)
    // try to walk in random directions until you succeed once
    while (!moveTo(actor, directions[randomInt(directions.length)])) { };

  // otherwise walk towards player
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) {
      // left
      moveTo(actor, directions[0]);
    } else {
      // right
      moveTo(actor, directions[1]);
    }
  } else {
    if (dy < 0) {
      // up
      moveTo(actor, directions[2]);
    } else {
      // down
      moveTo(actor, directions[3]);
    }
  }
  if (ARENA.player.hp < 1) {
    // game over message
    var gameOver = ARENA.game.add.text(ARENA.game.world.centerX, ARENA.game.world.centerY, 'Game Over\nCtrl+r to restart', { fill : '#e22', align: "center" } );
    gameOver.anchor.setTo(0.5,0.5);
  }
}