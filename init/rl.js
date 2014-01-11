var ARENA = ARENA || {};

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

ARENA.namespace('settings');
ARENA.settings = {
  FONT: 32, // default font size
  ROWS: 10, // map dimensions
  COLS: 15,
  ACTORS: 15 // number of actors per level, including player
};

ARENA.namespace('properties');
ARENA.properties = (function () {
  return {
    map: null,
    screen: null, // the ascii display, as a 2d array of characters

    // a list of all actors, 0 is the player
    player: null,
    actorList: null,
    livingEnemies: null,

    // points to each actor in its position, for quick searching
    actorMap: null,

    // initialize phaser, call create() once done
    game: new Phaser.Game(ARENA.settings.COLS * ARENA.settings.FONT * 0.6, ARENA.settings.ROWS * ARENA.settings.FONT, Phaser.AUTO, null, {
      create: create
    }),
    drawMap: function() {
      for (var y = 0; y < ARENA.settings.ROWS; y++)
        for (var x = 0; x < ARENA.settings.COLS; x++)
          ARENA.properties.screen[y][x].content = this.map[y][x];
    }
  };
})();



ARENA.namespace('utilities');
ARENA.utilities.numberUtils = (function () {
  return {
    randomInt: function(max) {
      return Math.floor(Math.random() * max);
    }
  };
}());



function create() {
  // init keyboard commands
  ARENA.properties.game.input.keyboard.addCallbacks(null, null, onKeyUp);

  // initialize map
  initMap();

  // initialize screen
  ARENA.properties.screen = [];
  for (var y = 0; y < ARENA.settings.ROWS; y++) {
    var newRow = [];
    ARENA.properties.screen.push(newRow);
    for (var x = 0; x < ARENA.settings.COLS; x++)
      newRow.push(initCell('', x, y));
  }

  // initialize actors
  initActors();

  // draw level
  ARENA.properties.drawMap();
  drawActors();
}

function initCell(chr, x, y) {
  // add a single cell in a given position to the ascii display
  var style = {
    font: ARENA.settings.FONT + "px monospace",
    fill: "#fff"
  };
  return ARENA.properties.game.add.text(ARENA.settings.FONT * 0.6 * x, ARENA.settings.FONT * y, chr, style);
}

function initMap() {
  // create a new random map
  ARENA.properties.map = [];
  for (var y = 0; y < ARENA.settings.ROWS; y++) {
    var newRow = [];
    for (var x = 0; x < ARENA.settings.COLS; x++) {
      if (Math.random() > 0.8)
        newRow.push('#');
      else
        newRow.push('.');
    }
    ARENA.properties.map.push(newRow);
  }
}





function initActors() {
  // create actors at random locations
  ARENA.properties.actorList = [];
  ARENA.properties.actorMap = {};
  for (var e = 0; e < ARENA.settings.ACTORS; e++) {
    // create new actor
    var actor = {
      x: 0,
      y: 0,
      hp: e == 0 ? 3 : 1
    };
    do {
      // pick a random position that is both a floor and not occupied
      actor.y = ARENA.utilities.numberUtils.randomInt(ARENA.settings.ROWS);
      actor.x = ARENA.utilities.numberUtils.randomInt(ARENA.settings.COLS);
    } while (ARENA.properties.map[actor.y][actor.x] == '#' || ARENA.properties.actorMap[actor.y + "_" + actor.x] != null);

    // add references to the actor to the actors list & map
    ARENA.properties.actorMap[actor.y + "_" + actor.x] = actor;
    ARENA.properties.actorList.push(actor);
  }

  // the player is the first actor in the list
  ARENA.properties.player = ARENA.properties.actorList[0];
  ARENA.properties.livingEnemies = ARENA.settings.ACTORS - 1;
}

function drawActors() {
  for (var a in ARENA.properties.actorList) {
    if (ARENA.properties.actorList[a] != null && ARENA.properties.actorList[a].hp > 0)
      ARENA.properties.screen[ARENA.properties.actorList[a].y][ARENA.properties.actorList[a].x].content = a == 0 ? '' + ARENA.properties.player.hp : 'e';
  }
}

function canGo(actor,dir) {
  return  actor.x+dir.x >= 0 &&
      actor.x+dir.x <= ARENA.settings.COLS - 1 &&
      actor.y+dir.y >= 0 &&
      actor.y+dir.y <= ARENA.settings.ROWS - 1 &&
      ARENA.properties.map[actor.y+dir.y][actor.x +dir.x] == '.';
}

function moveTo(actor, dir) {
  // check if actor can move in the given direction
  if (!canGo(actor,dir))
    return false;

  // moves actor to the new location
  var newKey = (actor.y + dir.y) +'_' + (actor.x + dir.x);
  // if the destination tile has an actor in it
  if (ARENA.properties.actorMap[newKey] != null) {
    //decrement hitpoints of the actor at the destination tile
    var victim = ARENA.properties.actorMap[newKey];
    victim.hp--;

    // if it's dead remove its reference
    if (victim.hp == 0) {
      ARENA.properties.actorMap[newKey]= null;
      ARENA.properties.actorList[ARENA.properties.actorList.indexOf(victim)]=null;
      if(victim!=ARENA.properties.player) {
        ARENA.properties.livingEnemies--;
        if (ARENA.properties.livingEnemies == 0) {
          // victory message
          var victory = ARENA.properties.game.add.text(ARENA.properties.game.world.centerX, ARENA.properties.game.world.centerY, 'Victory!\nCtrl+r to restart', { fill : '#2e2', align: "center" } );
          victory.anchor.setTo(0.5,0.5);
        }
      }
    }
  } else {
    // remove reference to the actor's old position
    ARENA.properties.actorMap[actor.y + '_' + actor.x]= null;

    // update position
    actor.y+=dir.y;
    actor.x+=dir.x;

    // add reference to the actor's new position
    ARENA.properties.actorMap[actor.y + '_' + actor.x]=actor;
  }
  return true;
}

function onKeyUp(event) {
  // draw map to overwrite previous actors positions
  ARENA.properties.drawMap();

  // act on player input
  var acted = false;
  switch (event.keyCode) {
    case Phaser.Keyboard.LEFT:
      acted = moveTo(ARENA.properties.player, {x:-1, y:0});
      break;

    case Phaser.Keyboard.RIGHT:
      acted = moveTo(ARENA.properties.player,{x:1, y:0});
      break;

    case Phaser.Keyboard.UP:
      acted = moveTo(ARENA.properties.player, {x:0, y:-1});
      break;

    case Phaser.Keyboard.DOWN:
      acted = moveTo(ARENA.properties.player, {x:0, y:1});
      break;
  }

  // enemies act every time the player does
  if (acted)
    for (var enemy in ARENA.properties.actorList) {
      // skip the player
      if(enemy==0)
        continue;

      var e = ARENA.properties.actorList[enemy];
      if (e != null)
        aiAct(e);
    }

  // draw actors in new positions
  drawActors();
}

function aiAct(actor) {
  var directions = [ { x: -1, y:0 }, { x:1, y:0 }, { x:0, y: -1 }, { x:0, y:1 } ];
  var dx = ARENA.properties.player.x - actor.x;
  var dy = ARENA.properties.player.y - actor.y;

  // if player is far away, walk randomly
  if (Math.abs(dx) + Math.abs(dy) > 6)
    // try to walk in random directions until you succeed once
    while (!moveTo(actor, directions[ARENA.utilities.numberUtils.randomInt(directions.length)])) { };

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
  if (ARENA.properties.player.hp < 1) {
    // game over message
    var gameOver = ARENA.properties.game.add.text(ARENA.game.world.centerX, ARENA.game.world.centerY, 'Game Over\nCtrl+r to restart', { fill : '#e22', align: "center" } );
    gameOver.anchor.setTo(0.5,0.5);
  }
}