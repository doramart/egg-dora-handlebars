const fs = require('mz/fs');
const path = require('path');
const handlebars = require('handlebars');
const COMPILE = Symbol('compile');
const extend = require('./lib/extend');
const caches = {};

exports = module.exports = app => {
  const config = app.config.handlebars;
  const partialsPath = config.partialsPath;

  registerLayouts(config);
  registerPartials(partialsPath);

  class HandlebarsView {
    constructor(ctx) {
      this.app = ctx.app;
    }

    async render(name, context, options) {
      let content;
      const useCache = config['cache'] === true;

      if (caches[name] && useCache) {
        content = caches[name];
      } else {
        content = await fs.readFile(name, 'utf8');
        content = extend.parse(content);
        useCache && (caches[name] = content);
      }
      return this[COMPILE](content, context, options);
    }

    async renderString(tpl, context, options) {
      tpl = extend.parse(tpl);
      return this[COMPILE](tpl, context, options);
    }

    [COMPILE](tpl, context, options) {
      return handlebars.compile(tpl, Object.assign({}, config, options))(context);
    }
  }

  app.view.use('handlebars', HandlebarsView);
};

function registerLayouts(config) {
  extend.init(config);
}

function registerPartials(partialsDir) {
  var walk = function (filepath) {
    files = fs.readdirSync(filepath);
    files.forEach(function (item) {
      var tmpPath = filepath + '/' + item,
        stats = fs.statSync(tmpPath);

      if (stats.isDirectory()) {
        walk(tmpPath);
      } else {
        var isValidTemplate = /\.(html|hbs|handlebars)$/.test(tmpPath);
        if (isValidTemplate) {
          var ext = path.extname(tmpPath);
          var templateName = path.relative(partialsDir, tmpPath)
            .slice(0, -(ext.length)).replace(/[ -]/g, '_').replace(/\\/g, '/');

          var templateContent = fs.readFileSync(tmpPath, 'utf-8');
          handlebars.registerPartial(templateName, templateContent);
        }
      }
    });
  };

  walk(partialsDir);
}

exports.handlebars = handlebars;