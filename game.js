// ======================
// STATE
// ======================

const state = {
  player: null,
  monster: null,
  inCombat: false
};

const SAVE_KEY = "souls_save";

// ======================
// CLASSES
// ======================

const classes = {
  Warrior: { hp: 120, str: 12 },
  Mage: { hp: 80, str: 20 },
  Rogue: { hp: 100, str: 15 }
};

// ======================
// WORLD (6 AREAS)
// ======================

const world = {

  town: {
    name: "Town",
    type: "safe",
    exits: ["forest", "shop"]
  },

  shop: {
    name: "Merchant Shop",
    type: "safe",
    exits: ["town"]
  },

  forest: {
    name: "Forest",
    type: "danger",
    exits: ["town", "graveyard", "catacombs"]
  },

  graveyard: {
    name: "Graveyard",
    type: "danger",
    exits: ["forest", "tower"]
  },

  catacombs: {
    name: "Catacombs",
    type: "bosspath",
    exits: ["forest", "boss_catacombs"]
  },

  tower: {
    name: "Tower",
    type: "danger",
    exits: ["graveyard", "boss_tower"]
  },

  boss_catacombs: {
    name: "Catacomb Boss",
    type: "boss",
    exits: ["catacombs"]
  },

  boss_tower: {
    name: "Tower Boss",
    type: "boss",
    exits: ["tower"]
  }
};

// ======================
// SHOP ITEMS
// ======================

const shopItems = [
  { id: "potion", name: "Potion", type: "consumable", price: 20, heal: 40 },
  { id: "sword", name: "Iron Sword", type: "weapon", price: 60, damage: 5 },
  { id: "armor", name: "Leather Armor", type: "armor", price: 50, defense: 3 }
];

// ======================
// MONSTERS
// ======================

const monsters = [
  { name: "Goblin", hp: 40, atk: 6 },
  { name: "Skeleton", hp: 60, atk: 10 },
  { name: "Slime", hp: 30, atk: 4 },
  { name: "Catacomb Lord", hp: 200, atk: 18 },
  { name: "Arcane King", hp: 220, atk: 20 }
];

// ======================
// PLAYER
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

    this.gold = 50;
    this.location = "town";

    this.weapon = null;
    this.armor = null;

    this.inventory = [
      { id: "potion", qty: 2 }
    ];
  }

  damage() {
    let w = this.weapon ? this.weapon.damage : 0;
    return Math.floor(Math.random() * 6) + this.str + w;
  }

  takeDamage(dmg) {
    let def = this.armor ? this.armor.defense : 0;
    dmg -= def;
    if (dmg < 0) dmg = 0;

    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
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
// ROOMS
// ======================

function enterRoom(id) {

  state.player.location = id;

  const room = world[id];

  let html = `<h2>${room.name}</h2>`;

  if (room.type === "safe") {
    html += `<button onclick="rest()">Rest</button>`;
  }

  if (room.type === "danger") {
    html += `<button onclick="startFight()">Fight</button>`;
  }

  if (room.type === "boss") {
    html += `<button onclick="startBossFight()">Boss Fight</button>`;
  }

  room.exits.forEach(e => {
    html += `<button onclick="enterRoom('${e}')">${world[e].name}</button>`;
  });

  document.getElementById("room").innerHTML = html;
  updateUI();
}

// ======================
// COMBAT
// ======================

function startFight() {

  const zone = state.player.location;

  const list = monsters.filter(m => m.name === "Goblin" || m.name === "Skeleton");

  const base = list[Math.floor(Math.random() * list.length)];

  state.monster = {
    ...base,
    hp: base.hp + state.player.level * 10
  };

  state.inCombat = true;

  renderFight();
}

function attack() {

  let dmg = state.player.damage();

  state.monster.hp -= dmg;

  log("You hit for " + dmg);

  if (state.monster.hp <= 0) {
    win();
    return;
  }

  enemyTurn();
  renderFight();
}

function enemyTurn() {
  let dmg = state.monster.atk;

  state.player.takeDamage(dmg);

  log("Enemy hits for " + dmg);

  if (state.player.hp <= 0) {
    log("YOU DIED");
  }

  updateUI();
}

function win() {
  log("Enemy defeated");

  state.player.gold += 20;
  state.player.xp += 30;

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
// SHOP
// ======================

function buyItem(id) {

  let item = shopItems.find(i => i.id === id);

  if (state.player.gold < item.price) return;

  state.player.gold -= item.price;

  if (item.type === "weapon") {
    state.player.weapon = item;
  }

  if (item.type === "armor") {
    state.player.armor = item;
  }

  if (item.type === "consumable") {
    let inv = state.player.inventory.find(i => i.id === id);

    if (inv) inv.qty++;
    else state.player.inventory.push({ id, qty: 1 });
  }

  updateUI();
}

// ======================
// UI
// ======================

function updateUI() {

  const p = state.player;

  document.getElementById("stats").innerHTML = `
    <h3>${p.name}</h3>
    HP: ${p.hp}/${p.maxHp}<br>
    Level: ${p.level}<br>
    Gold: ${p.gold}<br>
    Weapon: ${p.weapon ? p.weapon.name : "None"}<br>
    Armor: ${p.armor ? p.armor.name : "None"}
  `;

  let inv = "<h3>Inventory</h3>";

  p.inventory.forEach(i => {
    inv += `<p>${i.id} x${i.qty}</p>`;
  });

  document.getElementById("inventory").innerHTML = inv;
}

function log(msg) {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
}

// ======================
// SAVE
// ======================

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state.player));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  state.player = Object.assign(new Player(), data);

  show("game");
  enterRoom(state.player.location);
}

// ======================
// HELPERS
// ======================

function show(id) {
  document.querySelectorAll("section")
    .forEach(s => s.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
}
