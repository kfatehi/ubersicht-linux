const jsdom = require("jsdom");
const jquery = __dirname+'/node_modules/jquery/dist/jquery.js';
const Widget = require('./widget');
const vm = require('vm');
const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const args = require('minimist')(process.argv);
const app = express();
const spawn = require('child_process').spawn;
const PORT = args.p || args.port || 3000;
const SURF = args.s || args.surf;

const wPath = args.w || args.widget;

if (!wPath || args.h || args.help) {
  console.log(`
  Usage: ${args._[0]} -w path/to/my.widget [-e path1 -e path2]
    -w widget path
    -e extra file paths to watch and reload for
  `);
  process.exit(1);
}

const watchPaths = [wPath];

const extras = args.e || args.extras;
if ( extras ) {
  if (extras.forEach) {
    extras.forEach(e=>watchPaths.push(e));
  } else {
    watchPaths.push(extras);
  }
}
const watcher = chokidar.watch(watchPaths, { ignoreInitial: true });

let w = null;
let surfProc = null;

const reload = () => {
  const html = `<html><head><title>ubersicht-mini</title></head><body><div id="widget"></div></body></html>`;
  jsdom.env(html, [jquery], function (err, window) {
    const ctx = vm.createContext();
    const $ = window.$;
    const document = window.document;
    ctx.console = console;
    ctx.window = window;
    ctx.document = document;
    ctx.$ = $
    w = null;
    w = new Widget(wPath, ctx);
    w._init().then(()=>{
      setTimeout(()=> {
        if (SURF) {
          if (surfProc === null) {
            surfProc = spawn('surf', ['0.0.0.0:'+PORT]);
          } else {
            surfProc.kill('SIGHUP'); // this reloads surf
          }
        }
      }, 100);
    });
  });
}

watcher.on('add', reload);
watcher.on('change', reload);
watcher.on('unlink', reload);

reload();

app.use('/'+path.basename(wPath), express.static(wPath));
app.get('/', (req, res) => {
  if (w) {
    res.send(w.html());
  } else {
    res.send('No widget loaded');
  }
});
app.listen(PORT);
