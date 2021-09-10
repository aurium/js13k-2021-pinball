SPACEPINBALL
============
[**A JS13kGames 2021 Entry**](https://js13kgames.com/entries/spacepinball)

This is a mobile game inspired by pinball, based on the device's accelerometer.
You can also play this on a desktop and use your mouse to define the table rotation.
(I think will be better to understand if you try it on a desktop before trying on a mobile)

⚠️ It will take time to build in the first time. The next page load will be **much** faster!

Game features:
* 6 levels (or "pinball tables")
* You can travel between then using wormholes (the blue holes).
* Drop out the safe limits will kill the ball. Attention on tables without walls and specially on "Inferno", where the safe limit is only the painted area.
* Drop in black holes will kill the ball.
* The harder you hit the pin, more points you get.
* Pins can differ a lot! Pay attention.
* Each 150, 300, 600, 1200, 1800, 2700, ... points will give you a new ball on the table.
* Each 1000, 2000, 4000, 8000, ... points will give you a life up.
* Your life counter are the 3 rockets at the top. You can't have more than 3 lives at time.
* You lost a life when you reach zero ball on the table.
  * If you don't reach zero lives, you lost one for a new ball.
  * Else... Game over.
* The game will remember your record in this browser.

You can add `?lvl=<num>` to the game URL to start in a specific level.

On a debug build, you can add:
* `force-start` to start without the user initial interaction.
* `only-lvl=<num>` to generate only one level. (Good for testing with `lvl=<num>`)

Developing
----------

It's code is separated in function related files, but not modules. All this files will be joined in a single one by the builder, without code isolation or any thing alike, so the compacting result will be smaller.

Also this game uses a WebWorker to update the game status without conflicting with the main thread frame rate. However, this worker is nor a separated file. The script calls itself as a worker, and it will work as expected by testing the context. This allows both to share many configuration constants and helper functions. It helps to get a smaller pack size. We also don't need to communicate some initial states.

### Steps to code:
1. `cd` to cloned project dir;
2. `npm install` # to install dependencies;
3. `npm run buid` # creates the `dist` dir with the build result;
4. `npm start` # starts a local web server that allows you to play the game
5. Happy Hacking!
6. Repeat steps 3 to 5 until the sun rises.

### Hey! I want a watcher to update my build.

For sure! Run `npm run build:watch`

### I want to see logs and debugging.

Use `npm run build:dev` and `npm run build:dev:watch`

#### How debug code cleaner works?

The default builder mode is production, so it erases all:
* `log(...)` functions (not the `console.log()` ones!)
* Lines ended with `// DEBUG` or `<!--DEBUG-->`
* Blocks starting with `/* DEBUG INI */`, until next `/* <something> */`.
  In the place of `<something>` we use `/* DEBUG END */` for legibility.
