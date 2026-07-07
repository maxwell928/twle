# Twle

A daily Twi word-guessing game (Wordle-style) for the Ghanaian diaspora.
One shared word per day, 6 guesses, share your result to WhatsApp as an
emoji grid.

It's a **static site**: just `index.html`, `style.css`, `script.js`, and
`words.js`. No build step, no framework, no backend, no dependencies to
install. You can open `index.html` directly in a browser, or deploy the
whole folder as-is to Netlify, Vercel, or GitHub Pages.

## Files

| File | What it's for | Do you need to edit it? |
|---|---|---|
| `words.js` | The list of possible daily words | **Yes — start here.** |
| `index.html` | Page structure, help/stats text | Only for wording changes |
| `style.css` | Colors, sizes, layout | Only for visual changes |
| `script.js` | Game logic | Not unless you're adding a feature |

## Before you launch: fix the word list

`words.js` has a starter list of ~35 Twi words. **I'm not a Twi speaker —
that list needs a native speaker to proofread it** before real players see
it. Open `words.js`, and for each word: fix the spelling if it's wrong,
delete it if it's not right, and add more. Instructions are in the comments
at the top of the file.

The bigger the list, the less often words repeat — today's word is picked
as `(days since launch) % (number of words in the list)`, so with 35 words
the same word comes back every 35 days; with 365 words it comes back once
a year.

## Setting your launch date

Open `script.js` and find this near the top:

```js
const LAUNCH_DATE = new Date(2026, 0, 1); // Jan 1, 2026
```

Change it to the date you want puzzle #1 to appear, then **never change it
again** — every date after that is calculated relative to it, so changing
it later would shift which word everyone sees on which day.

## How the daily word works (no backend needed)

There's no server and no database. Every visitor's browser independently
calculates: "how many days have passed since `LAUNCH_DATE`?" and uses that
number to pick a word from `words.js`. Since everyone's clock agrees on
what today's date is, everyone gets the same word on the same day, for
free, forever, with zero hosting cost beyond serving static files.

Each player's own guesses and stats are saved only in their own browser
(`localStorage`) — there's no shared server state, so there's nothing to
break, no database to pay for, and no player data leaves their phone.

## Deploying

Any static host works. Push this folder to a GitHub repo, then:

- **Netlify**: New site from Git → pick the repo → leave build command
  blank, publish directory `/` → Deploy.
- **Vercel**: New Project → import the repo → Framework preset "Other" →
  Deploy.
- **GitHub Pages**: Repo Settings → Pages → Deploy from branch → pick
  `main` / root.

There's nothing to configure — no environment variables, no build step.

## Testing locally

Any local static server works, e.g. from inside this folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000` in your browser. Opening `index.html`
directly by double-clicking it also works in most browsers.

## Notes on the Twi keyboard

The on-screen keyboard includes `ɛ`, `ɔ`, and `ŋ` as extra keys since
those don't exist on a standard phone keyboard. All input happens by
tapping the on-screen keyboard, so it behaves identically for every
player regardless of their phone's own keyboard/language settings —
important since most players will be inside the WhatsApp in-app browser.

## Word validation

Right now, a guess is accepted as long as it's the right length — there
is no dictionary check against "real Twi words other than today's
answer," because a comprehensive Twi word list isn't available yet. If
you later get a bigger word list, you can add a stricter check in
`script.js`'s `submitGuess()` function.
