// --- Game Data ---
const classStats = {
  Warrior: { hp: 120, strength: 12 },
  Mage:    { hp: 70,  strength: 20 },
  Rogue:   { hp: 90,  strength: 15 }
};

const worldMap = {
  town: {
    name: "Safe Haven Town",
    desc: "A quiet town where players rest. There are no monsters here.",
    exits: ["forest"],
    monsters: []
  },
  forest: {
    name: "Whispering Forest",
    desc: "The trees are thick and block out the sun. Danger lurks.",
    exits: ["town", "cave"],
    monsters: ["Goblin", "Slime"]
  },
  cave: {
    name: "Deep Cave",
    desc: "It is pitch black. Bones litter the floor.",
    exits: ["forest"],
    monsters: ["Skeleton"]
  }
};

const monsterTemplates = [
  { name: "Goblin", hp: 30, attack: 5 },
  { name: "Skeleton", hp: 40, attack: 7 },
  { name: "Slime", hp: 20, attack: 3 }
];

// --- Player Class ---
class Player {
  constructor(name, playerClass) {
    this.name = name;
    this.playerClass = playerClass;
    this.level = 1;
    this.maxHp = classStats[playerClass].hp;
    this.hp = this.maxHp;
    this.strength = classStats[playerClass].strength;
    this.gold = 30;
    this.xp = 0;
    
    // New Inventory System
    this.inventory = [
      { name: "Health Potion", heal: 30, quantity: 2 }
    ];
    this.location = "town"; // Map System
  }

  attackDamage() {
    return Math.floor(Math.random() * 6) + this.strength;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.level * 50) this.levelUp();
  }

  levelUp() {
    this.level++;
    this.maxHp += 20;
    this.hp = this.maxHp;
    this.strength += 3;
    log(`✨ LEVEL UP! You are now a Level ${this.level} ${this.playerClass}!`);
  }
}

class Monster {
  constructor(template) {
    this.name = template.name;
    this.hp = template.hp;
    this.maxHp = template.hp;
    this.attack = template.attack;
  }
}

// --- Game State ---
let player = null;
let currentMonster = null;

const UI = {
  screenStart: document.getElementById("screen-start"),
  screenClass: document.getElementById("screen-class"),
  screenGame: document.getElementById("screen-game"),
  stats: document.getElementById("stats"),
  inventory: document.getElementById("inventory"),
  room: document.getElementById("room"),
  log: document.getElementById("log"),
  actions: document.getElementById("actions")
};

// --- Screen Navigation ---
function goToClassSelection() {
  UI.screenStart.classList.add("hidden");
  UI.screenClass.classList.remove("hidden");
}

function startGame(selectedClass) {
  const nameInput = document.getElementById("char-name").value || "Hero";
  player = new Player(nameInput, selectedClass);
  
  UI.screenClass.classList.add("hidden");
  UI.screenGame.classList.remove("hidden");
  
  log(`Welcome to the world, ${player.name} the ${player.playerClass}!`);
  updateUI();
  enterRoom(player.location);
}

// --- UI Updates ---
function log(text) {
  const entry = document.createElement("p");
  entry.textContent = `> ${text}`;
  UI.log.appendChild(entry);
  UI.log.scrollTop = UI.log.scrollHeight;
}

function updateUI() {
  if (!player) return;

  // Stats
  UI.stats.innerHTML = `
    <h2>${player.name}</h2>
    <table>
      <tr><td>Class:</td><td>${player.playerClass} (Lv ${player.level})</td></tr>
      <tr><td>HP:</td><td>${player.hp}/${player.maxHp}</td></tr>
      <tr><td>Gold:</td><td>${player.gold}</td></tr>
      <tr><td>XP:</td><td>${player.xp}/${player.level * 50}</td></tr>
    </table>
  `;

  // Inventory
  let invHTML = `<h2>Backpack</h2><ul>`;
  if (player.inventory.length === 0) {
    invHTML += `<li>Empty</li>`;
  } else {
    player.inventory.forEach((item, index) => {
      invHTML += `<li>${item.name} x${item.quantity} 
                  <button onclick="useItem(${index})" style="padding: 2px 5px; font-size: 12px; margin-left: 10px;">Use</button></li>`;
    });
  }
  invHTML += `</ul>`;
  UI.inventory.innerHTML = invHTML;
}

// --- Inventory Logic ---
function useItem(index) {
  if (currentMonster) {
    log("You cannot use items during combat yet!");
    return;
  }
  
  let item = player.inventory[index];
  if (item.name === "Health Potion") {
    player.heal(item.heal);
    item.quantity--;
    log(`You drank a Health Potion. Restored ${item.heal} HP.`);
    
    if (item.quantity <= 0) {
      player.inventory.splice(index, 1); // Remove item if out
    }
  }
  updateUI();
}

// --- Map Logic ---
function enterRoom(roomId) {
  player.location = roomId;
  const roomData = worldMap[roomId];
  currentMonster = null; // Clear monsters on room entry

  UI.room.innerHTML = `
    <h2>Location: ${roomData.name}</h2>
    <p>${roomData.desc}</p>
  `;

  let actionHTML = "";

  // Check for monsters
  if (roomData.monsters.length > 0) {
    actionHTML += `<button onclick="huntMonster()">Hunt for Monsters</button>`;
  } else {
    actionHTML += `<button onclick="rest()">Rest (Restore HP)</button>`;
  }

  // Draw Exits
  roomData.exits.forEach(exitId => {
    actionHTML += `<button onclick="enterRoom('${exitId}')">Go to ${worldMap[exitId].name}</button>`;
  });

  UI.actions.innerHTML = actionHTML;
  updateUI();
}

function rest() {
  player.heal(player.maxHp);
  log("You rested at the inn. HP fully restored.");
  updateUI();
}

// --- Combat Logic ---
function huntMonster() {
  const roomData = worldMap[player.location];
  const monsterName = roomData.monsters[Math.floor(Math.random() * roomData.monsters.length)];
  const template = monsterTemplates.find(m => m.name === monsterName);
  
  currentMonster = new Monster(template);

  UI.room.innerHTML = `
    <h2>Combat!</h2>
    <p>A wild ${currentMonster.name} blocks your path!</p>
    <p>Monster HP: ${currentMonster.hp}/${currentMonster.maxHp}</p>
  `;

  UI.actions.innerHTML = `
    <button onclick="attack()">Attack</button>
    <button onclick="flee()">Flee to Town</button>
  `;

  log(`You encountered a ${currentMonster.name}!`);
}

function attack() {
  if (!currentMonster) return;

  const pDamage = player.attackDamage();
  currentMonster.hp -= pDamage;
  log(`You hit the ${currentMonster.name} for ${pDamage} damage.`);

  if (currentMonster.hp <= 0) {
    victory();
  } else {
    monsterTurn();
  }
  renderBattle();
}

function monsterTurn() {
  const mDamage = currentMonster.attack;
  player.takeDamage(mDamage);
  log(`${currentMonster.name} hits you for ${mDamage} damage.`);

  if (player.hp <= 0) {
    log("💀 YOU DIED.");
    UI.actions.innerHTML = `<button onclick="location.reload()">Restart Game</button>`;
  }
  updateUI();
}

function renderBattle() {
  if (currentMonster && currentMonster.hp > 0) {
    UI.room.innerHTML = `
      <h2>Combat: ${currentMonster.name}</h2>
      <p>Monster HP: ${currentMonster.hp} / ${currentMonster.maxHp}</p>
    `;
  }
}

function victory() {
  log(`You defeated the ${currentMonster.name}!`);
  player.gold += 15;
  player.gainXp(25);
  
  // 30% chance to drop a potion
  if (Math.random() < 0.3) {
    log("The monster dropped a Health Potion!");
    let potion = player.inventory.find(i => i.name === "Health Potion");
    if (potion) {
      potion.quantity++;
    } else {
      player.inventory.push({ name: "Health Potion", heal: 30, quantity: 1 });
    }
  }

  currentMonster = null;
  updateUI();
  enterRoom(player.location); // Reload the current room UI
}

function flee() {
  log("You ran away in terror!");
  enterRoom("town");
}
