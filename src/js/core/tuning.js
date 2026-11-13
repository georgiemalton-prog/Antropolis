/* core/tuning.js
   Balance numbers for the newer systems, in one place so they can be tuned after playtesting.
   Changing a value here changes the game. Older systems still keep their numbers next to their code.
   Part of Antropolis. All files are joined into one script by tools/build.py (see README). */

var TUNING = {
    // the four nest chambers along the main tunnel (Fungus Garden, Nursery, Barracks, Royal Court). Since build 76
    // they live in the Nest tab only; true brings back the tunnel chambers, their keepers and the dig-and-explore event
    tunnelRooms: false,
    // the chamber and building upgrade lists on the Colony tab; since build 76 they are on each building's card
    // in the Nest tab (press and hold); true shows the lists again
    colonyLists: false,
    // First session (the opening minutes)
    start: {
        tunnelOpen: .04,      // share of the first tunnel dug before ants start using it (was .1)
        loadsGoal: 30,        // the "Bring home N loads of food" goal (was 40)
        firstFoes: 2,         // wood lice in the early first fight (Burrow stage, 2+ soldiers, tunnel 15% dug)
        firstFoesHp: 5,       // their health, in seconds of the colony's soldier damage
        firstFoesDelay: 20,   // seconds after those conditions are met
        earlyLay: .6,         // build 92: eggs come this much quicker while the colony is small (the 15-20 and 30-35 ant waits)
        earlyLayUpTo: 50,
        firstSide: 2.2,       // build 92: the first side tunnel digs this much faster (it was a 5-minute wait on goal 15)     // ...below this many ants, before the Anthill stage
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
    // Rival ant raids on the brood (threats/rivals.js)
    rivals: {
        firstAt: 480,         // seconds of play (Colony stage, tunnel open) before the first raid
        gapMin: 600,          // seconds between raids: gapMin + random x gapRand
        gapRand: 420,
        scoutLead: 25,        // seconds of warning: the scout is seen this long before the raid
        count: 2,             // raiders: count + nest stage + 1 per 12 waves
        hpMul: 1.1,           // toughness against the colony's soldiers (1 = like an invader wave)
        speed: .045,          // share of the main tunnel per second (invaders move .02)
        foodShare: .03,       // food a raider takes when there are no eggs to steal
        lootShare: .05,       // food won when no egg is lost
        winJelly: 2,
        hideMax: .6,          // panic alarm (build 91): nurses hide eggs; share of grabs that find none, at most
        hideNurses: 30        // nurses needed for half of hideMax
    },
    // Fights (build 91)
    fights: {
        wallSlow: .25,        // invaders pressing on a super major move at this share of their speed
        wallReach: .02        // how far ahead of an invader (share of the main tunnel) a super major blocks it
    },
    // Protecting the queen (threats/queenguard.js)
    queen: {
        near: .8,             // invaders past this share of the main tunnel count as close to the queen
        guardMax: 6,          // royal guard: 2 + 1 per 20 soldiers and super majors, up to this
        perGuard: .12,        // each guard in the ring takes this share off the harm reaching her
        minHarm: .3,
        stayAfter: 4,         // seconds the ring holds after the last invader has gone
        hurtAt: .6,           // below this share of her health she lays more slowly...
        hurtLay: .6           // ...at this share of her usual speed
    },
    // Counter-raid on the rival nest after a raid (threats/counter.js)
    counter: {
        window: 240,          // seconds the Raid token stays up after a rival raid ends
        squadMin: 3,
        squadMax: 12,         // 4 + 1 per 15 soldiers, up to this
        away: 25,             // seconds inside the rival nest
        baseWin: .45,         // chance to win with the smallest squad; +.04 per extra ant, +.03 per soldier level
        foodShare: .06,       // share of the food store brought back on a win
        jelly: 3,
        delay: 600,           // seconds added before the next rival raid after a win
        hurtMin: 2, hurtMax: 4 // soldiers that come back injured after a loss
    },
    // Deep layers (layers/*.js)
    larder: { carriers: 6, nursesPer: 8, storeBonus: 1.25, awayHours: 10, awayHoursOff: 8, reserve: 1, refill: .02 },
    armoury: { drillers: 6, soldiersPer: 10, injuryMul: .75 },
    caves: { scouts: 4, scoutsPer: 6, shardsPerJelly: 6, jellyPerDay: 4, goldenMul: 1.5 }
};
