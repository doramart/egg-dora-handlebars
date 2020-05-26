'use strict';

const path = require('path');
const fs = require('mz/fs');
const handlebars = require('handlebars');

const COMPILE = Symbol('compile');

module.exports = app => {
  const partials = loadPartial(app);
  if (partials) {
    for (const key of Object.keys(partials)) {
      console.log('---partials[key]--', key)
      if (key) {
        handlebars.registerPartial(key, partials[key]);
      }
    }
  }
  // console.log('--partials--', partials)
  const helpers = loadHelper(app);
  if (helpers) {
    for (const key of Object.keys(helpers)) {
      handlebars.registerHelper(key, helpers[key]);
    }
  }
  class HandlebarsView {
    constructor(ctx) {
      this.app = ctx.app;
    }

    async render(name, context, options) {
      const content = await fs.readFile(name, 'utf8');
      return this[COMPILE](content, context, options);
    }

    async renderString(tpl, context, options) {
      return this[COMPILE](tpl, context, options);
    }

    [COMPILE](tpl, context, options) {
      return handlebars.compile(tpl, Object.assign({}, this.app.config.handlebars, options))(context);
    }
  }
  app.view.use('handlebars', HandlebarsView);
};

function loadPartial(app) {
  const partialsPath = app.config.handlebars.partialsPath;
  // istanbul ignore next
  if (!fs.existsSync(partialsPath)) return;

  const partials = {};
  const files = fs.readdirSync(partialsPath);

  // for (let name of files) {
  //   const file = path.join(partialsPath, name);
  //   const stat = fs.statSync(file);
  //   if (!stat.isFile()) continue;

  //   name = name
  //     .replace(/\.\w+$/, '')
  //   // .replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase());
  //   // partials[name] = fs.readFileSync(file).toString();
  //   partials[name] = fs.readFileSync(file).toString();
  // }
  const readDir = (entry) => {
    const dirInfo = fs.readdirSync(entry);
    dirInfo.forEach(item => {
      const location = path.join(entry, item);
      const info = fs.statSync(location);
      if (info.isDirectory()) {
        console.log(`dir:${location}`);
        readDir(location);
      } else {
        console.log(`item:${item}`);
        item = item.replace(/\.\w+$/, '')
        partials[item] = fs.readFileSync(location).toString();
      }
    })
  }

  readDir(partialsPath);
  return partials;
}

function loadHelper(app) {
  const helperPath = resolveModule(app.config.handlebars.helperPath);
  if (!fs.existsSync(helperPath)) return;

  return app.loader.loadFile(helperPath) || {};
}

function resolveModule(filepath) {
  try {
    return require.resolve(filepath);
  } catch (e) {
    // istanbul ignore next
    return undefined;
  }
}