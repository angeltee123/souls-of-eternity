const SAVE_KEY = "noWayOutSave";

const classStats = {

  Warrior: { hp: 140, strength: 12 },
  Mage: { hp: 90, strength: 20 },
  Rogue: { hp: 110, strength: 16 }

};

const skills = {

  Warrior: [
    {
      name: "Power Strike",
      damage: 35
    }
  ],

  Mage: [
    {
      name: "Fireball",
      damage: 45
    }
  ],

  Rogue: [
    {
      name: "Backstab",
      damage: 40
    }
  ]

};

const monsterTemplates = [

  {
    name: "Goblin",
    hp: 40,
    attack: 6
  },

  {
    name: "Skeleton",
    hp: 60,
    attack: 10
  },

  {
    name: "Slime",
    hp: 25,
    attack: 4
  },

  {
    name: "Dungeon Lord",
    hp: 250,
    attack: 20,
    boss: true
  }

];

const worldMap = {

  town: {
    name: "Safe Haven",
    desc: "A peaceful town.",
    exits: ["forest", "shop"],
    monsters: []
  },

  forest: {
    name: "Whispering Forest",
    desc: "Dark trees surround you.",
    exits: ["town", "dungeon0"],
    monsters: ["Goblin", "Slime"]
  },

  shop: {
    name: "Merchant Shop",
    desc: "Buy useful items.",
    exits: ["town"],
    monsters: []
  }

};

function generateDungeon() {

  for (let i = 0; i < 5; i++) {

    worldMap[`dungeon${i}`] = {

      name: `Dungeon Room ${i}`,
      desc: "A dangerous dungeon chamber.",
      exits: [],
      monsters: ["Goblin", "Skeleton"]

    };

  }

  for (let i = 0; i < 4; i++) {

    worldMap[`dungeon${i}`]
      .exits.push(`dungeon${i + 1}`);

  }

  worldMap["dungeon4"].monsters = ["Dungeon Lord"];

}

generateDungeon();

class Player {

  constructor(name, playerClass) {

    this.name = name;
    this.playerClass = playerClass;

    this.level = 1;
    this.xp = 0;
    this.gold = 50;

    this.maxHp = classStats[playerClass].hp;
    this.hp = this.maxHp;

    this.strength = classStats[playerClass].strength;

    this.location = "town";

    this.weapon = null;
    this.armor = null;

    this.skills = skills[playerClass];

    this.inventory = [

      {
        name: "Health Potion",
        heal: 40,
        quantity: 2
      }

    ];

  }

  attackDamage() {

    let weaponBonus =
      this.weapon ? this.weapon.damage : 0;

    return (
      Math.floor(Math.random() * 6)
      + this.strength
      + weaponBonus
    );

  }

  takeDamage(amount) {

    let armor =
      this.armor ? this.armor.defense : 0;

    amount -= armor;

    if (amount < 0) amount = 0;

    this.hp -= amount;

    if (this.hp < 0) this.hp = 0;

  }

  heal(amount) {

    this.hp += amount;

    if (this.hp > this.maxHp) {
      this.hp = this.maxHp;
    }

  }

  gainXp(amount) {

    this.xp += amount;

    while (this.xp >= this.level * 50) {
      this.levelUp();
    }

  }

  levelUp() {

    this.level++;

    this.maxHp += 20;
    this.hp = this.maxHp;

    this.strength += 3;

    log(`✨ LEVEL UP! Level ${this.level}`);

  }

}

class Monster {

  constructor(data) {

    this.name = data.name;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.attack = data.attack;
    this.boss = data.boss || false;

  }

}

let player = null;
let currentMonster = null;

const UI = {

  screenStart:
    document.getElementById("screen-start"),

  screenClass:
    document.getElementById("screen-class"),

  screenGame:
    document.getElementById("screen-game"),

  stats:
    document.getElementById("stats"),

  inventory:
    document.getElementById("inventory"),

  room:
    document.getElementById("room"),

  actions:
    document.getElementById("actions"),

  log:
    document.getElementById("log")

};

function goToClassSelection() {

  UI.screenStart.classList.add("hidden");

  UI.screenClass.classList.remove("hidden");

}

function startGame(selectedClass) {

  const name =
    document.getElementById("char-name").value
    || "Hero";

  player = new Player(name, selectedClass);

  UI.screenClass.classList.add("hidden");

  UI.screenGame.classList.remove("hidden");

  log(`Welcome ${player.name}!`);

  updateUI();

  enterRoom(player.location);

}

function saveGame() {

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );

  log("💾 Game Saved");

}

function loadGame() {

  const save =
    localStorage.getItem(SAVE_KEY);

  if (!save) {

    alert("No save found.");

    return;

  }

  const data = JSON.parse(save);

  player = Object.assign(
    new Player(data.name, data.playerClass),
    data
  );

  UI.screenStart.classList.add("hidden");

  UI.screenGame.classList.remove("hidden");

  updateUI();

  enterRoom(player.location);

  log("📂 Save Loaded");

}

function log(text) {

  const p = document.createElement("p");

  p.textContent = `> ${text}`;

  UI.log.appendChild(p);

  UI.log.scrollTop =
    UI.log.scrollHeight;

}

function updateUI() {

  UI.stats.innerHTML = `

    <h2>${player.name}</h2>

    <p>
      ${player.playerClass}
      Lv.${player.level}
    </p>

    <p>
      HP:
      ${player.hp}/${player.maxHp}
    </p>

    <div class="hp-bar">
      <div
        class="hp-fill"
        style="
          width:
          ${(player.hp/player.maxHp)*100}%
        "
      ></div>
    </div>

    <p>Gold: ${player.gold}</p>

    <p>
      XP:
      ${player.xp}/${player.level * 50}
    </p>

  `;

  let inventoryHTML =
    `<h2>Inventory</h2>`;

  player.inventory.forEach((item, index) => {

    inventoryHTML += `

      <div class="item">

        ${item.name}
        x${item.quantity}

        <button
          onclick="useItem(${index})"
        >
          Use
        </button>

      </div>

    `;

  });

  UI.inventory.innerHTML = inventoryHTML;

}

function enterRoom(roomId) {

  player.location = roomId;

  currentMonster = null;

  const room = worldMap[roomId];

  UI.room.innerHTML = `

    <h2>${room.name}</h2>

    <p>${room.desc}</p>

  `;

  let html = "";

  if (room.monsters.length > 0) {

    html += `
      <button onclick="huntMonster()">
        Hunt Monsters
      </button>
    `;

  } else {

    html += `
      <button onclick="rest()">
        Rest
      </button>
    `;

  }

  room.exits.forEach(exit => {

    html += `
      <button onclick="enterRoom('${exit}')">
        Go To ${worldMap[exit].name}
      </button>
    `;

  });

  if (roomId === "shop") {

    html += `
      <button onclick="buyPotion()">
        Buy Potion (20G)
      </button>

      <button onclick="buySword()">
        Buy Sword (50G)
      </button>
    `;

  }

  UI.actions.innerHTML = html;

}

function rest() {

  player.hp = player.maxHp;

  log("You rested.");

  updateUI();

}

function huntMonster() {

  const room =
    worldMap[player.location];

  const randomMonster =
    room.monsters[
      Math.floor(
        Math.random()
        * room.monsters.length
      )
    ];

  const template =
    monsterTemplates.find(
      m => m.name === randomMonster
    );

  currentMonster = new Monster({

    ...template,

    hp:
      template.hp
      + player.level * 10,

    attack:
      template.attack
      + player.level * 2

  });

  renderBattle();

  log(`A ${currentMonster.name} appeared!`);

}

function renderBattle() {

  UI.room.innerHTML = `

    <h2>${currentMonster.name}</h2>

    <p>
      HP:
      ${currentMonster.hp}
      /
      ${currentMonster.maxHp}
    </p>

    <div class="hp-bar">
      <div
        class="hp-fill"
        style="
          width:
          ${(currentMonster.hp/currentMonster.maxHp)*100}%
        "
      ></div>
    </div>

  `;

  UI.actions.innerHTML = `

    <button onclick="attack()">
      Attack
    </button>

    <button onclick="useSkill()">
      Skill
    </button>

    <button onclick="flee()">
      Flee
    </button>

  `;

}

function attack() {

  const damage =
    player.attackDamage();

  currentMonster.hp -= damage;

  if (currentMonster.hp < 0) {
    currentMonster.hp = 0;
  }

  log(`You hit for ${damage}`);

  if (currentMonster.hp <= 0) {

    victory();

    return;

  }

  monsterTurn();

  renderBattle();

}

function useSkill() {

  const skill =
    player.skills[0];

  currentMonster.hp -= skill.damage;

  log(
    `🔥 ${skill.name}
    dealt ${skill.damage}`
  );

  if (currentMonster.hp <= 0) {

    victory();

    return;

  }

  monsterTurn();

  renderBattle();

}

function monsterTurn() {

  if (currentMonster.boss) {

    bossTurn();

    return;

  }

  player.takeDamage(
    currentMonster.attack
  );

  log(
    `${currentMonster.name}
    hits for
    ${currentMonster.attack}`
  );

  if (player.hp <= 0) {

    death();

  }

  updateUI();

}

function bossTurn() {

  const move = Math.random();

  if (move < 0.3) {

    let damage =
      currentMonster.attack * 2;

    player.takeDamage(damage);

    log("💥 CRUSHING SLAM!");

  } else {

    player.takeDamage(
      currentMonster.attack
    );

    log("Boss attacks!");

  }

  if (player.hp <= 0) {
    death();
  }

  updateUI();

}

function victory() {

  log(
    `Defeated ${currentMonster.name}`
  );

  player.gold += 20;

  player.gainXp(30);

  if (Math.random() < 0.3) {

    let potion =
      player.inventory.find(
        i => i.name === "Health Potion"
      );

    if (potion) {

      potion.quantity++;

    }

  }

  currentMonster = null;

  updateUI();

  enterRoom(player.location);

}

function death() {

  log("💀 YOU DIED");

  UI.actions.innerHTML = `
    <button onclick="location.reload()">
      Restart
    </button>
  `;

}

function flee() {

  log("You fled.");

  enterRoom("town");

}

function useItem(index) {

  const item =
    player.inventory[index];

  if (item.name === "Health Potion") {

    player.heal(item.heal);

    item.quantity--;

    log(
      `Recovered ${item.heal} HP`
    );

    if (item.quantity <= 0) {

      player.inventory.splice(index, 1);

    }

  }

  updateUI();

}

function buyPotion() {

  if (player.gold < 20) {

    log("Not enough gold.");

    return;

  }

  player.gold -= 20;

  let potion =
    player.inventory.find(
      i => i.name === "Health Potion"
    );

  if (potion) {

    potion.quantity++;

  }

  updateUI();

  log("Bought potion.");

}

function buySword() {

  if (player.gold < 50) {

    log("Not enough gold.");

    return;

  }

  player.gold -= 50;

  player.weapon = {

    name: "Iron Sword",
    damage: 5

  };

  log("Equipped Iron Sword");

  updateUI();

}
