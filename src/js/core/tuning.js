/* core/tuning.js
   Balance numbers for the newer systems, in one place so they can be tuned after playtesting.
   Changing a value here changes the game. Older systems still keep their numbers next to their code.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var TUNING = {
    // First session (the opening minutes)
    start: {
        tunnelOpen: .04,      // share of the first tunnel dug before ants start using it (was .1)
        loadsGoal: 30,        // the "Bring home N loads of food" goal (was 40)
        firstFoes: 2,         // wood lice in the early first fight (Burrow stage, 2+ soldiers, tunnel 15% dug)
        firstFoesHp: 5,       // their health, in seconds of the colony's soldier damage
        firstFoesDelay: 20,   // seconds after those conditions are met
        queenBig: 1.3         // queen drawn this much bigger at the Dirt hole stage (halfway there at Burrow)
    },
    // Giant Mole (threats/mole.js) and the Great Hall built after beating it
    mole: {
        maxHp: 900000,        // mole health; damage between fights is kept
        regenPerHour: .05,    // share of max health it heals back per hour
        lossPerHit: .006,     // soldiers lost per mole hit, as a share of all soldiers
        superLoss: .12,       // chance a hit also kills a super major
        injureChance: .5,     // chance a hit also injures a soldier
        retreatAt: .4,        // army falls back when damage drops below this share of its start
        winJelly: 30          // royal jelly for beating it
    },
    hall: {
        maxLevel: 4,
        foodBase: .4,         // cost in food = food store x (foodBase + foodStep x level)
        foodStep: .15,
        jellyBase: 25,        // cost in jelly = jellyBase + jellyStep x level
        jellyStep: 25,
        bonus: .1             // food and soldier damage bonus per level
    },
    // Termite raids (threats/termites.js)
    termites: {
        armouryBonus: 1.2,    // army strength multiplier with the Armoury built
        lootShare: .05,       // food won, as a share of the food store, on a win
        lossShare: .06        // food lost, as a share of the food store, on a loss
    },
    // Cave crickets (threats/crickets.js)
    crickets: {
        firstAt: 300,         // seconds before the first visit
        gapMin: 420,          // seconds between visits: gapMin + random x gapRand
        gapRand: 300,
        hp: 10,
        stealShare: .025,     // food each cricket steals, as a share of the food store
        lootShare: .03        // food won per cricket beaten
    },
    // Deep layers (layers/*.js)
    larder: { carriers: 6, nursesPer: 8, storeBonus: 1.25, awayHours: 10, awayHoursOff: 8, reserve: 1, refill: .02 },
    armoury: { drillers: 6, soldiersPer: 10, injuryMul: .75 },
    caves: { scouts: 4, scoutsPer: 6, shardsPerJelly: 6, jellyPerDay: 4, goldenMul: 1.5 }
};
