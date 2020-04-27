const { getParser } = require('codemod-cli').jscodeshift;

module.exports = function transformer(file, api) {
  const j = getParser(api);

  function changeDecs(path, objDecs1) {
    let objDecs = objDecs1;

    let { body: bodyDecs } = path.value.body;
    let typeExludedArray = ['ThisExpression'];
    for (let i = 1; i < objDecs.length; i++) {
      let { varDecPosition, declarationPos } = objDecs[i];
      let currentNodetype = objDecs[i].declaration.init.type;
      let currentNodeProps = objDecs[i].declaration.id.properties;
      let currentNodeName = objDecs[i].declaration.init.name;
      for (let j = i - 1; j > -1; j--) {
        let nodeType = objDecs[j].declaration.init.type;
        let nodeName = objDecs[j].declaration.init.name;
        // eslint-disable-next-line prettier/prettier
        if (currentNodetype === nodeType && (typeExludedArray.includes(nodeType) || (currentNodetype === 'Identifier' && currentNodeName === nodeName))) {
          let nodeProps = objDecs[j].declaration.id.properties;
          objDecs[j].declaration.id.properties = [...nodeProps, ...currentNodeProps];
          if (bodyDecs[varDecPosition].declarations.length === 1) {
            bodyDecs.splice(varDecPosition, 1);
          } else {
            bodyDecs[varDecPosition].declarations.splice(declarationPos, 1);
          }
          objDecs = getObjDecs(path);
          i = 1;
          break;
        }
      }
    }
  }

  function getObjDecs(path) {
    let varDecs = [];
    path.value.body.body.forEach((node, index) => {
      node.type === 'VariableDeclaration' && varDecs.push({ index, node });
    });
    let objDecs = [];
    varDecs.forEach(({ node, index }) => {
      let { declarations } = node;
      for (let i = 0; i < declarations.length; i++) {
        declarations[i].id.type === 'ObjectPattern' &&
          objDecs.push({ varDecPosition: index, declarationPos: i, declaration: declarations[i] });
      }
    });
    return objDecs;
  }

  let root = j(file.source);
  root
    .find(j.FunctionDeclaration)
    .filter((p) => p.value && p.value.body && p.value.body.body)
    .forEach((path) => {
      changeDecs(path, getObjDecs(path));
    });

  root
    .find(j.FunctionExpression)
    .filter((p) => p.value && p.value.body && p.value.body.body)
    .forEach((path) => {
      changeDecs(path, getObjDecs(path));
    });
  return root.toSource();
};
