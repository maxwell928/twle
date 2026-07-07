// ============================================================
// TWLE WORD LIST — this is the file you edit, not the others
// ============================================================
//
// Every word below is a possible "word of the day." Everything
// else in the game (grid size, keyboard, colors) figures itself
// out automatically from whatever words are in this list — you
// never need to touch script.js or index.html to change words.
//
// RULES FOR EVERY ENTRY:
//   1. Lowercase only.
//   2. Use ɛ and ɔ where the Twi spelling needs them (not e/o).
//      Tap-and-hold "e" or "o" on a phone keyboard usually offers
//      them, or copy them from here: ɛ ɔ
//   3. One word per entry. No spaces, no hyphens.
//   4. Length can be anything from 3 to about 9 letters — the
//      board resizes itself to fit whatever word is picked.
//
// IMPORTANT — PLEASE READ:
// I (the AI that wrote this) am not a Twi speaker. This starter
// list is ~35 common Asante Twi words I have reasonable confidence
// in, so you have something to test with immediately. Before you
// tell real players about this game, please have a Twi speaker
// proofread every single word below, fix anything wrong, and add
// many more. The bigger this list, the less often the daily word
// repeats (today's word = day-number mod list-length, see script.js).
//
// To add a word: add a new line with "yourword", inside the quotes.
// To remove a word: delete its line.
const TWLE_WORDS = [
  // --- everyday / greetings ---
  "akwaaba",  // welcome
  "medaase",  // thank you
  "yoo",      // okay
  "aane",     // yes
  "daabi",    // no

  // --- people / family ---
  "maame",    // mother
  "agya",     // father
  "abusua",   // family
  "mmɔfra",   // children
  "ɔhene",    // king / chief
  "ɔhemaa",   // queen
  "kraman",   // dog
  "papa",     // father / good

  // --- everyday things ---
  "sika",     // money
  "kwan",     // road, way
  "nkwa",     // life
  "ɔman",     // nation, country
  "adaka",    // box
  "sukuu",    // school
  "adwuma",   // work
  "aduane",   // food
  "nkyene",   // salt
  "nsa",      // hand

  // --- nature ---
  "dua",      // tree
  "nsuo",     // water
  "anɔmaa",   // bird
  "ani",      // eye

  // --- time / day ---
  "anɔpa",    // morning
  "anadwo",   // night
  "ɛnnɛ",     // today
  "ɔkyena",   // tomorrow

  // --- colors ---
  "tuntum",   // black
  "fitaa",    // white
  "kɔkɔɔ",    // red

  // --- numbers ---
  "baako",    // one
];
