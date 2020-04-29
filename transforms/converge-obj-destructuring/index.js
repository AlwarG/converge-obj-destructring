const { getParser } = require('codemod-cli').jscodeshift;

module.exports = function transformer(file, api) {
  const j = getParser(api);

  let root = j(file.source);
  root
    .find(j.BlockStatement)
    .filter((p) => p.value && p.value.body)
    .forEach((path) => changeDecs(path, getObjDecs(path)));

  function getObjDecs(path) {
    let varDecs = [];
    path.value.body.forEach((node, index) => {
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

  function changeDecs(path, objDecs) {
    let bodyDecs = path.value.body;
    for (let i = 1; i < objDecs.length; i++) {
      let { varDecPosition, declarationPos } = objDecs[i];
      let currentNodeProps = objDecs[i].declaration.id.properties;
      for (let j = i - 1; j > -1; j--) {
        if (canChangeDeclartion(objDecs[i].declaration, objDecs[j].declaration)) {
          let nodeProps = objDecs[j].declaration.id.properties;
          objDecs[j].declaration.id.properties = [...nodeProps, ...currentNodeProps];
          if (bodyDecs[varDecPosition].declarations.length === 1) {
            bodyDecs.splice(varDecPosition, 1);
          } else {
            bodyDecs[varDecPosition].declarations.splice(declarationPos, 1);
          }
          objDecs = getObjDecs(path);
          i = j;
          break;
        }
      }
    }

    function isFunCall(node) {
      return node.type === 'CallExpression' && node.callee.type === 'Identifier';
    }

    function isObjectMethod(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object &&
        node.callee.property
      );
    }

    function isObjectProp(node) {
      return (
        node.type === 'MemberExpression' && node.property && node.property.type === 'Identifier'
      );
    }

    function hasSimilarArgs(node1Args, node2Args) {
      if (node1Args.length !== node2Args.length) {
        return false;
      }
      let hasSimilarArgs = true;
      for (let i = 0; i < node1Args.length; i++) {
        if (
          ((node1Args[i].type === 'StringLiteral' || node1Args[i].type === 'Literal') && node1Args[i].type !== node2Args[i].type) ||
          node1Args[i].value !== node2Args[i].value ||
          !isNodeSame(node1Args[i], node2Args[i])
        ) {
          hasSimilarArgs = false;
          break;
        }
      }
      return hasSimilarArgs;
    }
    function isORLogicEmptyObjExp(node) {
      return (
        node &&
        node.init &&
        node.init.type === 'LogicalExpression' &&
        node.init.operator === '||' &&
        !!node.init.right &&
        node.init.right.type === 'ObjectExpression' &&
        !node.init.right.properties.length
      );
    }

    function isNodeSame(node1, node2) {
      let node1Obj = node1.init || node1;
      let node2Obj = node2.init || node2;
      if (isORLogicEmptyObjExp(node1) && isORLogicEmptyObjExp(node2)) {
        return isNodeSameWithoutLogic(node1Obj.left, node2Obj.left);
      }
      return isNodeSameWithoutLogic(node1, node2);
    }

    function isNodeSameWithoutLogic(node1, node2) {
      let node1Obj = node1.init || node1;
      let node2Obj = node2.init || node2;
      if (node1Obj.type !== node2Obj.type) {
        return false;
        // eslint-disable-next-line prettier/prettier
      } else if ((node1Obj.type === 'Identifier' || node1Obj.type === 'Literal' || node1Obj.type === 'StringLiteral') && node1Obj.value === node2Obj.value) {
        return true;
      } else if (isFunCall(node1Obj) && isFunCall(node2Obj)) {
        let node1ObjName = node1Obj.callee.name;
        let node2ObjName = node2Obj.callee.name;
        if (node1ObjName !== node2ObjName) {
          return false;
        }
        return hasSimilarArgs(node1Obj.arguments || [], node2Obj.arguments || []);
      } else if (isObjectMethod(node1Obj) && isObjectMethod(node2Obj)) {
        let node1ObjName = node1Obj.callee.name || node1Obj.callee.object.name;
        let node2ObjName = node2Obj.callee.name || node2Obj.callee.object.name;
        if (node1ObjName !== node2ObjName) {
          return false;
        }
        if (node1Obj.callee.property) {
          let node1PropName = node1Obj.callee.property.name;
          let node2PropName = node2Obj.callee.property.name;
          if (node1PropName !== node2PropName) {
            return false;
          }
        }
        return hasSimilarArgs(node1Obj.arguments || [], node2Obj.arguments || []);
      } else if (isObjectProp(node1Obj) && isObjectProp(node2Obj)) {
        if (node1Obj.property && node2Obj.property) {
          let node1PropName = node1Obj.property.name;
          let node2PropName = node2Obj.property.name;
          if (node1PropName !== node2PropName) {
            return false;
          }
        }
        if (node1Obj.object && node2Obj.object) {
          let node1ObjName = node1Obj.object.name;
          let node2ObjName = node2Obj.object.name;
          if (node1ObjName !== node2ObjName) {
            return false;
          }
          return isNodeSame(node1Obj.object, node2Obj.object);
        }
        return true;
      }
      return false;
    }
    function canChangeDeclartion(node1, node2) {
      let typeExludedArray = ['ThisExpression'];
      let node1Name = node1.init.name;
      let node2Name = node2.init.name;
      let node1Type = node1.init.type;
      let node2Type = node2.init.type;
      if (node1Type !== node2Type) {
        return false;
      } else if (typeExludedArray.includes(node1Type)) {
        return true;
      } else if (node1Type === 'Identifier') {
        return node1Name === node2Name;
      }
      return isNodeSame(node1, node2);
    }
  }

  return root.toSource();
};
