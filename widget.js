const fs = require('fs');
const path = require('path');
const cs = require('coffee-script');
const Promise = require('bluebird');
const exec = require('child_process').exec;
const execPromise = Promise.promisify(exec);

class Widget {
  constructor(dir, ctx) {
    const widgetFile = path.join(dir, 'index.coffee');
    const widgetSrc = fs.readFileSync(widgetFile);
    const w = cs.eval(widgetSrc.toString(), {sandbox: ctx});
    this.ctx = ctx;
    this.w = w;
    this.w.run = exec;
    setInterval(this._init.bind(this), w.refreshFrequency);
  }
  _init(cb) {
    return new Promise((resolve, reject) => {
      if ( this.w.command ) {
        return execPromise(this.w.command).
          then(result => this.w.render(result)).
          then(resolve).
          catch(reject);
      } else {
        resolve(this.w.render());
      }
    }).then((html) => {
      this.getElement().empty().append(html);
      let fun = this.w.afterRender;
      if ( fun ) {
        fun.bind(this.w)(this.getElement());
      }
    }).catch(err=>{
      console.log(err);
    });
  }
  getElement() {
    return this.ctx.$("#widget");
  }
  html(){
    return this.ctx.document.documentElement.innerHTML;
  }
}

module.exports = Widget;
