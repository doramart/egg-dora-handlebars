var fs = require('fs');
var path = require('path');

var layoutsPath = null;
var layoutCache = {};
var cache = true;

exports.init = function (config) {
  layoutsPath = config.layoutsPath;
  cache = config.cache;
}

exports.parse = function (content) {
  var extendReg = /\{\{#extend[\s]*"(.*?)"[\s]*?\}\}([\s\S]*?)\{\{\/extend\}\}/g;
  var ret = extendReg.exec(content);
  if (!ret) {
    return content;
  }

  var layout = ret[1]; // 继承的布局模板
  var selfContent = ret[2]; // 自己的模板内容
  var content = serializeContent(selfContent);

  var layoutFile = path.join(layoutsPath, layout + '.handlebars');
  var layoutContent = layoutCache[layoutFile] || serializeLayout(layoutFile);

  var newContent = '';

  for (var i = 0, len = layoutContent.length; i < len; i++) {
    var item = layoutContent[i];
    if (typeof item === 'string') {
      newContent += item;
    } else {
      var ct = content[item.name];
      var str = ct ? ct.content : '';
      var sc = item.content;

      // 如果block里有内容
      if (ct) {
        switch (ct.method) {
          case 'append':
            str = sc + str;
            break;
          case 'insert':
            str = str + sc;
            break;
          case 'replace':
            break;
          default:
            str = sc + str;
        }
      }

      newContent += str;
    }
  }

  return newContent;
}

function serializeLayout(layout) {
  var layoutReg = /\{\{#block[\s]*"(.*?)"[\s]*?\}\}([\s\S]*?)\{\{\/block\}\}/g;
  var data = fs.readFileSync(layout, 'utf-8').toString();

  data = data.replace(layoutReg, function (str, blockName, blockContent) {
    return '||block||' + blockName + '~~block~~' + blockContent + '||block||'
  });

  var temp = data.split('||block||');
  var ret = [];
  temp.forEach(function (item) {
    var arr = item.split('~~block~~');
    if (arr.length === 1) {
      ret.push(item);
    } else {
      ret.push({
        name: arr[0],
        content: arr[1]
      });
    }
  });

  if (cache === true) {
    layoutCache[layout] = ret;
  }
  return ret;
}

function serializeContent(content) {
  var contentReg = /\{\{#content[\s]*"(\w+)"[\s]*?[mode="]*?(\w+)*?["]*?[\s]*?\}\}([\s\S]*?)\{\{\/content\}\}/g;
  var ret = {};

  content.replace(contentReg, function (str, contentName, method, con) {
    ret[contentName] = {
      method: method || 'append',
      content: con
    };

    return '';
  });

  return ret;
}