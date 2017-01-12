const jsdom = require("jsdom");
const jquery = __dirname+'/node_modules/jquery/dist/jquery.js';
const Widget = require('./widget');
const vm = require('vm');
const express = require('express');
const path = require('path');
const args = require('minimist')(process.argv);
const app = express();

const wPath = args.w || args.widget;

if (!wPath || args.h || args.help) {
  console.log(`
  Usage: ${args._[0]} -w path/to/my.widget
    -w widget path
  `);
  process.exit(1);
}

const html = `<html><body><div id="widget"></div></body></html>`;
jsdom.env(html, [jquery], function (err, window) {
  const ctx = vm.createContext();
  const $ = window.$;
  const document = window.document;
  ctx.console = console;
  ctx.window = window;
  ctx.document = document;
  ctx.$ = $
  const w = new Widget(wPath, ctx);
  w._init();
  app.use('/'+path.basename(wPath), express.static(wPath));
  app.get('/', (req, res) => res.send(w.html()));
});
app.listen(3000, () => {
  console.log('ubersicht mini server listening on port 3000');
});
