# egg-dora-handlebars
egg view plugin for handlebars with extend

## 安装
```bash
npm i egg-view-handlebarsp-extend --save
```
## 使用

```js
// {app_root}/config/plugin.js
exports.handlebars = {
  enable: true,
  package: 'egg-dora-handlebars',
};
```

```js
// {app_root}/config/config.default.js
module.exports = appInfo => {
  const config = (exports = {});

  /**
  * view
  * @member
  * @property defaultViewEngine: string setup default view engine
  * @property defaultExtension: string template file extension
  * @property mapping: Object {string: string}
  */
  config.view = {
    defaultViewEngine: 'handlebars',
    defaultExtension: '.handlebars',
    mapping: {
      '.handlebars': 'handlebars',
    },
  };
  /**
  * handlebars
  * @member
  * @property layoutsPath: string the path of layouts
  * @property partialsPath: string the path of partials
  * @property cache: Bollen use cache true|false
  */
  config.handlebars = {
    'layoutsPath': path.join(appInfo.root, 'app/view/layouts'),
    'partialsPath': path.join(appInfo.root, 'app/view'),
    'cache': true
  };

  return config;
}
```
## 获取handlebars

```js
const handlebars = require('egg-view-handlebarsp-extend').handlebars
```


## 支持继承
继承主要的用法如下：

在父模板中可以用`{{#block "name"}}{{/block}}`块来划分区块，父模板必须在layoutsPath中，如：
``` handlebars
{{#block "header"}}这里是父模板的内容{{/block}}
```

在子模板中使用如下的方式继承：
``` handlebars
{{#extend "layout"}}
    {{#content "header" mode="append"}}这里是子模板的内容{{/content}}
{{/extend}}
```

mode支持：

1. append: 追加在父模板对应的block内容之后
2. insert: 插入到父模板对应的block内容之前
3. replace: 替换父模板对应的block内容
默认为append模式。

注意：不在`{{#extend}}{{/extend}}`和`{{#content}}{{/content}}`对中的内容不会被渲染

## 支持部件

部件支持.handlebars, .hbs, .html三种后缀的文件，部件文件必须在partialsPath中