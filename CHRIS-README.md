# Spark: Unlock the Next Discovery

Your gold dot is now a full game. It has six levels, a title screen, stars, sound, phone controls and a "Discovery Unlocked" ending. It uses the same tools you already set up: **Vite + Phaser 4.2.1, plain JavaScript**.

## New in version 2

- **Play as Chris or Shelley.** Pick a face the first time you press START, or later with the **PLAYER** button on the title screen. The face replaces the gold dot, with a gold glow and rim, and it bobs gently as it moves. Your ghost uses the same face, see-through.
- **3 lives (hearts).** Touching Static or running out of light costs a heart. Spark flashes and goes back to the level's start. At 0 hearts you get a **Try again** screen, and can start a new run.
- **Harder from level 2.** The light really runs out now. Level 2 adds the first slow Static and a Closing Door. Levels 3 to 6 add more and faster Static, and their par times are tighter. Level 1 is still easy.
- **Sharp graphics.** The game now draws at your screen's real resolution (Retina too), so text, icons and faces stay crisp.
- **Calm mode** still exists for a gentler game: unlimited lives, slower Static, and light that never runs out.

**Why found discoveries stay found after you lose a heart:** losing a heart sends you back to the start, and the clock keeps running, which is already a real cost. Taking away discoveries too would make one slip on a big level like 5 or 6 feel like starting over. When you run out of hearts, the run ends.

This guide covers:
1. Putting the new files into your `spark-game` folder
2. Running the game
3. How to play
4. What each file does
5. Editing levels and tweaking the game
6. Fixes for common problems

---

## 1. Put the new files into your spark-game folder

**Updating from version 1?** Stop the server and unzip the new `spark-game-delivery.zip`. Then drag these items into your `spark-game` folder and click **Replace**:

| Drag this | Why |
|---|---|
| `src` folder | **Replace.** Almost every file changed, and there are 2 new scenes (`CharacterSelectScene.js`, `TryAgainScene.js`). |
| `public` folder | **Replace.** It has a **new `public/characters/` folder** with `chris.png` and `shelley.png`, which the game loads. |
| `art` folder | **Add (new).** This is the face artwork: big 1024px versions, the 256px and 128px versions, `faces-preview.png`, and the original cartoons in `art/source/`. The game doesn't need this folder to run. |
| `tools` folder | **Replace.** It adds `process-faces.py`, the face tool. |
| `CHRIS-README.md` | **Replace.** |
| `screenshots` folder | Optional. The new pictures are in `screenshots/v2/`. |

`index.html`, `package.json`, `package-lock.json` and `vite.config.js` didn't change. Copying them again is harmless. You don't need to run `npm install` again, so just run `npm run dev`.

Your saved progress and stars carry over. Because some mazes changed, old ghost routes are cleared once.

**First time setting up?** Follow the steps below. You only have to do this once.

1. **Stop the game server.** Click in the VS Code terminal and press **Control + C**.
2. **Unzip** `spark-game-delivery.zip` (double-click it in Finder). You'll get a folder called `spark-game-delivery`.
3. Open your own `spark-game` folder in a second Finder window.
4. Select these items in `spark-game-delivery` and drag them into your `spark-game` folder:

   | Drag this | What happens |
   |---|---|
   | `src` folder | **Replace** your old `src` folder. Your old `main.js` is replaced, and `counter.js` and `assets` are no longer needed. |
   | `public` folder | **Replace** it (new little Spark icon for the browser tab) |
   | `tools` folder | **Add** (the level checker) |
   | `index.html` | **Replace** |
   | `package.json` | **Replace** (adds the `check-levels` command) |
   | `package-lock.json` | **Replace** |
   | `vite.config.js` | **Add** (new file) |
   | `CHRIS-README.md` | **Add** (this guide) |
   | `screenshots` folder | Optional. These show what the game should look like. |

   When Finder asks, click **Replace**.

   **Don't** drag in a `node_modules` folder. Yours stays where it is, and the zip doesn't include one.

5. In the VS Code terminal, run these two commands one at a time:

   ```
   npm install
   npm run dev
   ```

6. Open **http://localhost:5173**. You should see the SPARK title screen.

> What changed from your version: the fog in `src/game/Fog.js` still uses the idea you built (fill with darkness, erase a circle, then `.render()`). Movement in `src/game/Player.js` now goes square by square instead of using physics, which is what stops Spark from snagging on corners.

---

## 2. Running the game

| Command | What it does |
|---|---|
| `npm run dev` | Runs the game at http://localhost:5173. It reloads every time you save a file. |
| `npm run check-levels` | Checks that every level can be finished (useful after you edit a map) |
| `npm run build` | Makes a finished copy of the game in a `dist` folder, ready to put on a website |
| `npm run preview` | Plays the `dist` copy so you can check it before sharing |

**Play it on your phone:** stop the server, run `npm run dev -- --host`, then open the "Network" address it prints (something like `http://192.168.1.20:5173`) on your phone. Your phone has to be on the same Wi-Fi as your Mac.

If `npm install` reports "vulnerabilities," that warning is about a Vite helper used only while you build, not about the game. **Don't** run `npm audit fix --force`, because it would downgrade Vite.

---

## 3. How to play

You're **Spark**, a point of light exploring a research maze hidden in fog.

- **Goal:** find every **discovery** (the lime keys). Each one restores your light. Once you have them all, the gold **keyhole** unlocks. Reach it to finish the level.
- **Light:** from level 2 on, your glow drains as you explore. If you stand around without picking anything up, it runs out in about 25 to 35 seconds, depending on the level, and you lose a heart. **Gold gifts ($)** brighten it again, and a **discovery** fills it back up. When the light gets low, the meter turns red and flashes, and a "LOW LIGHT" warning appears.
- **Hearts:** you start a run with 3 and carry them between levels. Losing one sends you back to the level start with full light and 2 seconds of flashing protection. Discoveries and gifts you've already found stay found. At 0 hearts you get **Try again**.
- **Data dots** (blue) add points.
- **Static** (flickering specks) is noisy data. Touching it costs a heart. In Calm mode it just dims your light and pushes you back.
- **Closing Doors** (gold stripes) open and shut on a timer, and the number shows the seconds left. They never close on top of you.
- **Numbered gates** open once you hold that many discoveries.
- **Places you've already lit stay a little brighter**, so you can remember the way.
- **Stars:** ★ finish the level · ★ collect all 3 gifts · ★ beat the par time
- **Ghost:** after you set a best time, a see-through copy of your character replays your best route so you can race yourself.
- **Calm mode** (title screen): everything runs at 70% speed, you have unlimited lives, the light drains half as fast and never runs out, and the timer is hidden. The par time stretches to match.
- **Character:** press START the first time (or PLAYER on the title screen) to choose Chris or Shelley. Your choice is saved.

**Controls**

| | Computer | Phone |
|---|---|---|
| Move | Arrow keys or W A S D | The round d-pad (slide your thumb), or swipe anywhere on the maze |
| Pause | P or Esc, or the ❚❚ button | ❚❚ button (top right) |
| Restart level | R | RESTART button |
| Sound on/off | M, or the speaker button | SOUND button |

Steering works a bit like Pac-Man. Tap a direction and Spark glides to the next place it could turn, then waits. Hold the direction to keep going. You can press your next turn early, and Spark takes it at the first chance. Because Spark moves square by square, it can't snag on corners.

Progress (unlocked levels, stars, best times, ghosts and settings) saves in the browser automatically.

---

## 4. What each file does

```
spark-game/
├── index.html              the web page that holds the game
├── vite.config.js          Vite settings (rarely touched)
├── package.json            project info and the npm commands
├── tools/check-levels.mjs  tests that every level can be finished
├── tools/process-faces.py  turns a face picture into the game's PNGs
├── art/                    face artwork (big + small versions, preview)
├── public/characters/      chris.png, shelley.png (what the game loads)
└── src/
    ├── main.js             starts Phaser and lists the scenes
    ├── config.js           ⭐ the settings panel: speeds, light, colors, scores
    ├── levels.js           ⭐ every level, drawn as text, plus the story text
    ├── style.css           page styling around the game
    ├── scenes/             the "screens" of the game
    │   ├── BootScene.js          loads the faces, draws all other pictures, opens the title
    │   ├── TitleScene.js         start screen and settings (Sound / Calm / Ghost / Player)
    │   ├── CharacterSelectScene.js  choose Chris or Shelley
    │   ├── TryAgainScene.js      shown when you run out of hearts
    │   ├── LevelSelectScene.js   pick a level
    │   ├── PlayScene.js          ⭐ the game itself: one level
    │   ├── PauseScene.js         the pause menu
    │   ├── LevelCompleteScene.js stars, score and the next story chapter
    │   └── EndScene.js           "Discovery Unlocked" and the real story
    ├── game/               the pieces inside a level
    │   ├── Maze.js         turns the text map into walls, dots, gifts, doors…
    │   ├── Player.js       Spark and its grid movement
    │   ├── Fog.js          the darkness and the circle of light
    │   ├── StaticBlob.js   the wandering "noisy data"
    │   └── Ghost.js        records and replays your best route
    ├── systems/            helpers used everywhere
    │   ├── textures.js     draws every picture with code (no image files)
    │   ├── sound.js        makes every sound with code (no audio files)
    │   ├── save.js         remembers progress (localStorage)
    │   └── layout.js       picks the game size and sharpness (RES) for the screen
    └── ui/
        ├── widgets.js      buttons, text, panels, stars
        └── TouchControls.js the phone d-pad and swipe
```

**What a "scene" is:** each screen is a scene. A scene has `create()`, which runs once to set things up, and `update()`, which runs about 60 times a second. You already wrote both of these in your first version. `PlayScene.js` is the big one, and its comments walk through each step.

**How a level gets built:** `PlayScene` takes a level from `levels.js`. `Maze.js` reads the map letter by letter and puts a wall, dot, gift and so on on each square. Then `Player.js` places Spark on the `S`, and `Fog.js` covers everything in darkness.

**Pictures and sounds:** the only image files are the two faces in `public/characters/`. `textures.js` draws every other picture on a hidden canvas when the game starts, at your screen's real sharpness, and `sound.js` builds every sound from tones with Web Audio. Everything runs offline.

**How it stays sharp:** `layout.js` works out `RES`, which is how many real screen pixels there are per game pixel (up to 3). The canvas is made that much bigger and each scene's camera zooms by `RES`. So all the game code still uses normal sizes, like a 40-pixel square. If an image ever looks the wrong size, use `sized(image, width, height)` from `textures.js` instead of `setDisplaySize`.

---

## 5. Editing levels and tweaking the game

### Edit a level

Open `src/levels.js`. Each level has a `map` made of rows of text:

```
#  wall              .  floor with a data dot     (space)  floor, no dot
S  Spark's start     E  the keyhole (exit)        K  a discovery (must collect all)
$  a gold gift       N  a Static blob starts here C  a Closing Door
1-9  a gate that opens once you hold that many discoveries
```

Rules:
- Every row must be **the same length**.
- The outside edge must be all `#`.
- There must be exactly one `S` and one `E`.

Try this: change a `.` to `$` to add a gift, or a `#` to `.` to open a shortcut. Save the file, and the browser reloads with your change.

After you edit, run `npm run check-levels`. It tells you if a discovery, gift or the keyhole can't be reached.

### Add a new level

Copy one whole level block in `levels.js`, from its `{` down to its `},`. Paste it where you want it in the list, then change these:
- `id`: a new short name with no spaces, like `'mine'`
- `stage`, `name`, `tip`, `par` (target seconds), and the `map`
- `light`: `fadePerSecond` (how fast the light drains; use `0` for no draining). You can also set `start` and `max`.
- `staticSpeed`: how fast this level's Static moves
- `story`: the chapter shown after the level

Levels unlock in list order. A big map is fine, because the camera scrolls to follow Spark.

### Common tweaks (in `src/config.js`)

| What | Where | Example |
|---|---|---|
| Spark's speed | `PLAYER.speed` (squares per second) | `5.5` → `7` for faster |
| Light size | `LIGHT.max`, `LIGHT.start` (pixels) | Bigger is easier. Each level can override these in `levels.js`. |
| **How fast the light drains** | each level's `light.fadePerSecond` in `levels.js` (pixels per second) | Levels 2 to 6 use `3.5, 4.0, 4.3, 4.6, 5.0`. Seconds until dark = (150 − 26) ÷ that number, so 3.5 gives about 35 s. Lower is easier, and `0` turns it off. |
| When the light counts as "out" | `LIGHT.outAt` (pixels) | `26`. Lower it to give a few more seconds. |
| Low-light warning | `LIGHT.warnAt` | `60` |
| **Number of lives** | `LIVES.start` | `3` → `5` for easier |
| Protection after losing a life | `LIVES.invulnerableTime` (seconds) | `2` |
| Unlimited lives in Calm mode | `LIVES.calmUnlimited` | `true` / `false` |
| Static speed per level | `staticSpeed` in `levels.js` (default `HAZARDS.staticSpeed`) | Levels 2 to 6 use `2.2, 3.0, 3.3, 3.6, 3.9` |
| Face size in the maze | `FACE_SIZE` | `38` (a square is 40) |
| How much a gift brightens the light | `LIGHT.giftRefill` | `55` → `80` |
| How dark the fog is | `LIGHT.fogAlpha` (0 clear … 1 black) | `0.95` |
| How bright remembered places stay | `LIGHT.memoryAlpha` | lower = brighter memory |
| Static speed | `HAZARDS.staticSpeed` | `3` |
| Door timing | `HAZARDS.doorOpenTime`, `HAZARDS.doorClosedTime` | seconds |
| Points | `SCORE` | |
| Colors | `COLORS` (numbers like `0xF2C14E`) and `CSS` (text colors like `'#F2C14E'`) | |
| Where the "Help fund" button goes | `GIVE_URL` | |

### Swap a face

The game loads `public/characters/chris.png` and `public/characters/shelley.png`. Use a square PNG with a transparent background (256×256 is plenty) and keep the same file name.

If you have a new cartoon on a plain white background, the face tool cuts it out and makes every size for you. It needs Python with Pillow (`pip3 install pillow`):

```
python3 tools/process-faces.py path/to/new-chris.jpg chris
```

That writes `art/chris-1024.png`, `-256.png`, `-128.png`, updates `public/characters/chris.png`, and rebuilds `art/faces-preview.png`.

### Reset your progress while testing

In Chrome, press **Cmd + Option + J** to open the console. Type the line below, press Enter, and refresh:

```
localStorage.removeItem('spark-game-save-v1')
```

Or, to unlock every level for testing, paste this instead:

```
s=JSON.parse(localStorage.getItem('spark-game-save-v1')||'{}');s.unlocked=6;localStorage.setItem('spark-game-save-v1',JSON.stringify(s))
```

---

## 6. If something goes wrong

- **Blank or black screen:** press **Cmd + Option + J** in Chrome and look for red error text. The message names the file and line number. A missing `}` is the usual cause, just like before.
- **Changes don't show:** check for the white dot on the VS Code tab (unsaved changes) and press **Cmd + S**.
- **"Port 5173 is in use":** another server is still running. Press Control + C in the old terminal, or use the new address Vite prints.
- **No sound:** browsers only allow sound after your first click or key press. Also check that SOUND is ON.
- **Phaser 4 reminder:** when you draw on a RenderTexture or DynamicTexture (`clear`, `fill`, `erase`, `stamp`), nothing shows until you call `.render()`.
