// =====================
// STATE
// =====================

const state = {
  player: null,
  monster: null,
  inCombat: false
};

const SAVE_KEY = "souls_save";

// =====================
// CLASSES
// =====================

const classes = {
  Warrior: { hp: 120, str: 12 },
  Mage: { hp: 80, str: 20 },
  Rogue: { hp: 100, str: 15 }
};

// =====================
// WORLD (ALL ZONES FIXED)
// =====================

const world = {

  town: {
    name: "Town",
    type: "safe",
    desc: "Starting town.",
    exits: ["forest", "shop"]
  },

  shop: {
    name: "Merchant Shop",
    type: "safe",
    desc: "Buy and sell items.",
    exits: ["town"]
  },

  forest: {
    name: "Forest",
    type: "danger",
    desc: "Weak monsters roam here.",
    exits: ["town", "graveyard", "catacombs"]
  },

  graveyard: {
    name: "Graveyard",
    type: "danger",
    desc: "Undead rise from graves.",
    exits: ["forest", "tower"]
  },

  catacombs: {
    name: "Catacombs",
    type: "danger",
    desc: "Dangerous underground maze.",
    exits: ["forest", "cat2"]
  },

  cat2: {
    name: "Catacomb Depth 2",
    type: "danger",
    desc: "No easy return ahead.",
    exits: ["cat3"]
  },

  cat3: {
    name: "Catacomb Depth 3",
    type: "danger",
    desc: "Final descent.",
    exits: ["boss_cat"]
  },

  boss_cat: {
    name: "Catacomb Boss",
    type: "boss",
    desc: "The Rot Lord awakens.",
    exits: []
  },

  tower: {
    name: "Arcane Tower",
    type: "danger",
    desc: "Mage-infested tower.",
    exits: ["graveyard", "boss_tower"]
  },

  boss_tower: {
    name: "Tower Boss",
    type: "boss",
    desc: "Arcane King awaits.",
    exits: []
  }
};

// =====================
// SHOP ITEMS
// =====================

const shopItems = [
  { id: "potion", name: "Potion", type: "consumable", price: 20, heal: 40 },
  { id: "sword", name: "Iron Sword", type: "weapon", price: 60, damage: 5 },
  { id: "armor", name: "Leather Armor", type: "armor", price: 50, defense: 3 }
];

// =====================
// MONSTERS
// =====================

const monsters = [
  { name: "Goblin", hp: 40, atk: 6 },
  { name: "Skeleton", hp: 60, atk: 10 },
  { name: "Slime", hp: 30, atk: 4 },
  { name: "Bone Horror", hp: 80, atk: 12 },
  { name: "Wraith", hp: 90, atk: 14 },
  { name: "Mage Sentinel", hp: 100, atk: 16 },
  { name: "Catacomb Lord", hp: 200, atk: 18 },
  { name: "Arcane King", hp: 220, atk: 20 }
];

// =====================
// PLAYER
// =====================

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

    this.inventory = [{ id: "potion", qty: 2 }];
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

  heal(a) {
    this.hp = Math.min(this.maxHp, this.hp + a);
  }
}

// =====================
// NAVIGATION
// =====================

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

// =====================
// ⭐ FIX: SINGLE ROOM RENDER SYSTEM
// =====================

function renderRoom() {

  const room = world[state.player.location];

  let html = `
    <h2>${room.name}</h2>
    <p>${room.desc}</p>
  `;

  if (room.type === "safe") {
    html += `<button onclick="rest()">Rest</button>`;
    if (state.player.location === "shop") html += renderShop();
  }

  if (room.type === "danger") {
    html += `<button onclick="startFight()">Explore</button>`;
  }

  if (room.type === "boss") {
    html += `<button onclick="startBossFight()">Boss Fight</button>`;
  }

  html += `<hr><h4>Travel</h4>`;

  room.exits.forEach(e => {
    html += `
      <button onclick="enterRoom('${e}')">
        ${world[e].name}
      </button>
    `;
  });

  document.getElementById("room").innerHTML = html;
}

// =====================
// ROOM ENTRY
// =====================

function enterRoom(id) {

  // lock rule example
  if (state.player.location === "cat2" && id === "forest") {
    log("Path collapsed.");
    return;
  }

  state.player.location = id;

  renderRoom();
  updateUI();
}

// =====================
// COMBAT
// =====================

function startFight() {

  const pool = ["Goblin", "Skeleton", "Slime"];
  const name = pool[Math.floor(Math.random() * pool.length)];

  const base = monsters.find(m => m.name === name);

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

  log("Hit " + dmg);

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

  log("Enemy hits " + dmg);

  updateUI();
}

function win() {

  log("Enemy defeated");

  state.player.gold += 20;
  state.player.xp += 30;

  state.inCombat = false;
  state.monster = null;

  renderRoom();
}

// =====================
// FIGHT UI
// =====================

function renderFight() {
  document.getElementById("room").innerHTML = `
    <h2>${state.monster.name}</h2>
    <p>HP: ${state.monster.hp}</p>
  `;

  document.getElementById("actions").innerHTML = `
    <button onclick="attack()">Attack</button>
  `;
}

// =====================
// SHOP
// =====================

function renderShop() {

  let html = "<h3>Shop</h3>";

  shopItems.forEach(i => {
    html += `
      <p>${i.name} (${i.price})</p>
      <button onclick="buy('${i.id}')">Buy</button>
    `;
  });

  return html;
}

function buy(id) {

  const item = shopItems.find(i => i.id === id);

  if (state.player.gold < item.price) return;

  state.player.gold -= item.price;

  if (item.type === "weapon") state.player.weapon = item;
  if (item.type === "armor") state.player.armor = item;

  updateUI();
}

// =====================
// UI
// =====================

function updateUI() {

  const p = state.player;

  document.getElementById("stats").innerHTML = `
    HP ${p.hp}/${p.maxHp}<br>
    Level ${p.level}<br>
    Gold ${p.gold}<br>
    Weapon: ${p.weapon ? p.weapon.name : "None"}<br>
    Armor: ${p.armor ? p.armor.name : "None"}
  `;

  let inv = "<h3>Inventory</h3>";

  p.inventory.forEach(i => {
    inv += `<p>${i.id} x${i.qty}</p>`;
  });

  document.getElementById("inventory").innerHTML = inv;
}

// =====================
// LOG
// =====================

function log(t) {
  document.getElementById("log").innerHTML += `<p>${t}</p>`;
}

// =====================
// SAVE / LOAD
// =====================

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state.player));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  state.player = Object.assign(new Player(), data);

  show("game");
  renderRoom();
}

// =====================
// HELPERS
// =====================

function show(id) {
  document.querySelectorAll("section")
    .forEach(s => s.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
}
