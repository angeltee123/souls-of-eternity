class Player {
  constructor(name, playerClass) {

    this.name = name;
    this.playerClass = playerClass;

    this.level = 1;
    this.hp = 100;
    this.maxHp = 100;
    this.gold = 30;
    this.xp = 0;

    this.strength = 10;
  }

  attackDamage() {
    return Math.floor(Math.random() * 6) + this.strength;
  }
}

class Monster {
  constructor(name, hp, attack) {
    this.name = name;
    this.hp = hp;
    this.attack = attack;
  }
}

const monsters = [
  new Monster("Goblin", 30, 5),
  new Monster("Skeleton", 40, 7),
  new Monster("Slime", 20, 3)
];

let player = new Player("Hero", "Warrior");

let currentMonster = null;

const statsDiv = document.getElementById("stats");
const roomDiv = document.getElementById("room");
const logDiv = document.getElementById("log");
const actionsDiv = document.getElementById("actions");

function log(text) {
  logDiv.innerHTML += text + "<br>";
  logDiv.scrollTop = logDiv.scrollHeight;
}

function updateStats() {

  statsDiv.innerHTML = `
    <h2>${player.name}</h2>
    HP: ${player.hp}/${player.maxHp}<br>
    Gold: ${player.gold}<br>
    XP: ${player.xp}<br>
    Level: ${player.level}
  `;
}

function showMainMenu() {

  roomDiv.innerHTML = `
    <h2>Dungeon Entrance</h2>
    <p>The darkness waits...</p>
  `;

  actionsDiv.innerHTML = `
    <button onclick="exploreRoom()">Explore Room</button>
    <button onclick="saveGame()">Save</button>
    <button onclick="loadGame()">Load</button>
  `;
}

function exploreRoom() {

  currentMonster =
    monsters[Math.floor(Math.random() * monsters.length)];

  roomDiv.innerHTML = `
    <h2>${currentMonster.name}</h2>
    <p>A monster appears!</p>
    <p>HP: ${currentMonster.hp}</p>
  `;

  actionsDiv.innerHTML = `
    <button onclick="attack()">Attack</button>
    <button onclick="runAway()">Run</button>
  `;

  log("A " + currentMonster.name + " attacks!");
}

function attack() {

  let damage = player.attackDamage();

  currentMonster.hp -= damage;

  log(
    "You hit the " +
    currentMonster.name +
    " for " +
    damage +
    " damage."
  );

  if (currentMonster.hp <= 0) {

    log("You defeated the " + currentMonster.name + "!");

    player.gold += 10;
    player.xp += 20;

    if (player.xp >= player.level * 50) {
      player.level++;
      player.maxHp += 20;
      player.hp = player.maxHp;

      log("LEVEL UP!");
    }

    updateStats();
    showMainMenu();

    return;
  }

  monsterAttack();

  roomDiv.innerHTML = `
    <h2>${currentMonster.name}</h2>
    <p>HP: ${currentMonster.hp}</p>
  `;

  updateStats();
}

function monsterAttack() {

  let damage = currentMonster.attack;

  player.hp -= damage;

  log(
    currentMonster.name +
    " hits you for " +
    damage +
    " damage."
  );

  if (player.hp <= 0) {

    log("YOU DIED.");

    actionsDiv.innerHTML = `
      <button onclick="restartGame()">
        Restart
      </button>
    `;
  }
}

function runAway() {

  log("You escaped.");

  showMainMenu();
}

function restartGame() {

  player = new Player("Hero", "Warrior");

  updateStats();

  showMainMenu();

  logDiv.innerHTML = "";
}

function saveGame() {

  localStorage.setItem(
    "noWayOutSave",
    JSON.stringify(player)
  );

  log("Game Saved.");
}

function loadGame() {

  const save =
    JSON.parse(localStorage.getItem("noWayOutSave"));

  if (save) {

    player = save;

    updateStats();

    log("Game Loaded.");

  } else {

    log("No save found.");
  }
}

updateStats();
showMainMenu();