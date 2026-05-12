// ======================
// GAME STATE
// ======================

const state = {
  player: null,
  monster: null,
  inCombat: false
};

// ======================
// DATA
// ======================

const classes = {
  Warrior: { hp: 120, str: 12 },
  Mage: { hp: 80, str: 20 },
  Rogue: { hp: 100, str: 15 }
};

const monsters = [
  { name: "Goblin", hp: 40, atk: 6 },
  { name: "Skeleton", hp: 60, atk: 10 },
  { name: "Slime", hp: 30, atk: 4 }
];

const world = {
  town: {
    name: "Town",
    desc: "Safe area.",
    enemies: []
  },
  forest: {
    name: "Forest",
    desc: "Danger ahead.",
    enemies: ["Goblin", "Slime"]
  }
};

// ======================
// PLAYER CLASS
// ======================

class Player {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.level = 1;
    this.xp = 0;

    this.maxHp = classes[type].hp;
    this.hp = this.maxHp;
    this.str = classes[type].str;

    this.gold = 0;
    this.inventory = [{ name: "Potion", heal: 30, qty: 2 }];

    this.location = "town";
  }

  damage() {
    return Math.floor(Math.random() * 6) + this.str;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  xpGain(amount) {
    this.xp += amount;

    if (this.xp >= this.level * 50) {
      this.level++;
      this.maxHp += 20;
      this.str += 2;
      this.hp = this.maxHp;
      log("LEVEL UP!");
    }
  }
}

// ======================
// NAVIGATION
// ======================

function goToCreate() {
  show("create");
}

function startGame(type) {
  const name = document.getElementById("nameInput").value || "Hero";

  state.player = new Player(name, type);

  show("game");

  enterRoom("town");
  updateUI();
}

// ======================
// ROOM SYSTEM
// ======================

function enterRoom(id) {
  state.player.location = id;

  const room = world[id];

  document.getElementById("room").innerHTML = `
    <h2>${room.name}</h2>
    <p>${room.desc}</p>
  `;

  let html = "";

  if (room.enemies.length > 0) {
    html += `<button onclick="startFight()">Fight</button>`;
  } else {
    html += `<button onclick="rest()">Rest</button>`;
  }

  html += `<button onclick="enterRoom('town')">Town</button>`;
  html += `<button onclick="enterRoom('forest')">Forest</button>`;

  document.getElementById("actions").innerHTML = html;

  updateUI();
}

// ======================
// COMBAT
// ======================

function startFight() {
  const room = world[state.player.location];

  const enemyName =
    room.enemies[
      Math.floor(Math.random() * room.enemies.length)
    ];

  const base = monsters.find(m => m.name === enemyName);

  state.monster = {
    ...base,
    hp: base.hp + state.player.level * 10
  };

  state.inCombat = true;

  renderFight();
}

function attack() {
  if (!state.inCombat) return;

  const pDmg = state.player.damage();

  state.monster.hp -= pDmg;

  log(`You hit for ${pDmg}`);

  if (state.monster.hp <= 0) {
    win();
    return;
  }

  enemyTurn();

  renderFight();
}

function enemyTurn() {
  const dmg = state.monster.atk;

  state.player.takeDamage(dmg);

  log(`Enemy hits for ${dmg}`);

  if (state.player.hp <= 0) {
    log("YOU DIED");
  }

  updateUI();
}

function win() {
  log("Enemy defeated!");

  state.player.gold += 10;
  state.player.xpGain(20);

  state.inCombat = false;
  state.monster = null;

  enterRoom(state.player.location);
}

function renderFight() {
  document.getElementById("room").innerHTML = `
    <h2>${state.monster.name}</h2>
    <p>HP: ${state.monster.hp}</p>
  `;

  document.getElementById("actions").innerHTML = `
    <button onclick="attack()">Attack</button>
  `;
}

// ======================
// INVENTORY
// ======================

function useItem(i) {
  const item = state.player.inventory[i];

  if (item.name === "Potion") {
    state.player.heal(item.heal);
    item.qty--;

    if (item.qty <= 0) {
      state.player.inventory.splice(i, 1);
    }

    log("Healed");
  }

  updateUI();
}

// ======================
// UI
// ======================

function updateUI() {
  const p = state.player;
  if (!p) return;

  document.getElementById("stats").innerHTML = `
    <h3>${p.name}</h3>
    <p>HP: ${p.hp}/${p.maxHp}</p>
    <p>Level: ${p.level}</p>
    <p>Gold: ${p.gold}</p>
  `;

  let inv = "<h3>Inventory</h3>";

  p.inventory.forEach((i, idx) => {
    inv += `
      <p>
        ${i.name} x${i.qty}
        <button onclick="useItem(${idx})">Use</button>
      </p>
    `;
  });

  document.getElementById("inventory").innerHTML = inv;
}

function log(msg) {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
}

// ======================
// SAVE SYSTEM
// ======================

function saveGame() {
  localStorage.setItem("save", JSON.stringify(state.player));
  log("Saved");
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem("save"));

  state.player = Object.assign(new Player(), data);

  show("game");
  enterRoom(state.player.location);
}

// ======================
// HELPERS
// ======================

function show(id) {
  document.querySelectorAll(".screen")
    .forEach(s => s.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
}
