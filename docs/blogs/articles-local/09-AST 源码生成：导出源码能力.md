# AST 源码生成：导出源码能力

原文链接: https://juejin.cn/post/7473339693947273226

---

## 前言

昨天晚上和[marsview](https://link.juejin.cn?target=https%3A%2F%2Fwww.marsview.cc%2F "https://www.marsview.cc/")低代码平台作者聊了一下低代码平台的一些问题，他的用户有个需求，低代码平台需要支持导出源码功能。

正好这一块，我做低代码的时候研究过一段时间，不过最后公司觉得低代码平台支持生成源码这个需求有点吃力不讨好，所以后面给砍掉了。这篇文章给大家分享一下我以前研究过的低代码平台导出源码方案。

## 抽象语法树（AST）

生成源码方案我这边使用的是抽象语法树，所以先带着大家了解一下抽象语法树。

### 什么是抽象语法树（AST）？

抽象语法树（Abstract Syntax Tree，简称 AST）是一种树状数据结构，用来表示源代码的语法结构。它将源代码中的每个元素映射成一个树形节点，节点之间的关系表示代码中的语法和结构。与传统的语法树不同，AST 省略了与语法相关的无关细节，比如空格和括号，而只关心代码的逻辑和语法结构。

### 作用

AST 主要用于编程语言的编译、解释和分析，尤其在 JavaScript 这样的解释型语言中非常重要。它的作用包括：

1.  **代码分析**：
    
    *   通过生成 AST，可以深入理解和分析代码。开发工具和编辑器（如 VSCode、ESLint 等）都依赖 AST 来进行语法检查、代码提示、重构等操作。
    *   工具可以扫描 AST 以识别潜在的错误或不符合规范的代码风格。
2.  **代码转换与优化**：
    
    *   AST 是许多代码转换工具（如 Babel、TypeScript）和编译器的核心。它允许你在语言层次上操作和转换代码。例如，可以将 ES6+ 代码转换为 ES5 代码，或者将 TypeScript 转换为 JavaScript。
    *   AST 也可以用于优化代码，删除冗余的代码、合并表达式等。
3.  **代码生成**：
    
    *   编译器和工具通常会将 AST 转换回可执行代码或目标代码。例如，Babel 会将修改后的 AST 重新生成 JavaScript 代码。
4.  **代码重构**：
    
    *   通过操作 AST，开发工具可以安全地进行代码重构（例如，重命名变量、函数提取等）。这种操作能够保持语法结构的正确性。
5.  **静态分析**：
    
    *   在代码检查、类型检查、错误检测等过程中，AST 使得分析工作更加高效。例如，ESLint 使用 AST 来检测代码是否符合某些风格或潜在的错误。

### 举个例子

我们可以在[AST](https://link.juejin.cn?target=https%3A%2F%2Fastexplorer.net%2F "https://astexplorer.net/")网站中输入代码，在右边可以实时看到代码对应的语法树。

![image.png](./images/article-9/image-1.awebp)

把没用的属性去除掉，留下有用的部分。

```json
{
  "type": "VariableDeclaration",
  "declarations": [
    {
      "type": "VariableDeclarator",
      "id": {
        "type": "Identifier",
        "name": "num"
      },
      "init": {
        "type": "BinaryExpression",
        "left": {
          "type": "NumericLiteral",
          "value": 1
        },
        "operator": "+",
        "right": {
          "type": "NumericLiteral",
          "value": 1
        }
      }
    }
  ],
  "kind": "const"
}

```

下面给大家演示一下在 node 项目中把代码转换为语法树，需要先安装 `@babel/parser`依赖。

```js
const ast = require('@babel/parser').parse('const num = 1 + 1');
console.log(JSON.stringify(ast, null, 2));

```

运行上面代码后输出

```json
{
  "type": "File",
  "start": 0,
  "end": 17,
  "loc": {
    "start": {
      "line": 1,
      "column": 0,
      "index": 0
    },
    "end": {
      "line": 1,
      "column": 17,
      "index": 17
    }
  },
  "errors": [],
  "program": {
    "type": "Program",
    "start": 0,
    "end": 17,
    "loc": {
      "start": {
        "line": 1,
        "column": 0,
        "index": 0
      },
      "end": {
        "line": 1,
        "column": 17,
        "index": 17
      }
    },
    "sourceType": "script",
    "interpreter": null,
    "body": [
      {
        "type": "VariableDeclaration",
        "start": 0,
        "end": 17,
        "loc": {
          "start": {
            "line": 1,
            "column": 0,
            "index": 0
          },
          "end": {
            "line": 1,
            "column": 17,
            "index": 17
          }
        },
        "declarations": [
          {
            "type": "VariableDeclarator",
            "start": 6,
            "end": 17,
            "loc": {
              "start": {
                "line": 1,
                "column": 6,
                "index": 6
              },
              "end": {
                "line": 1,
                "column": 17,
                "index": 17
              }
            },
            "id": {
              "type": "Identifier",
              "start": 6,
              "end": 9,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 6,
                  "index": 6
                },
                "end": {
                  "line": 1,
                  "column": 9,
                  "index": 9
                },
                "identifierName": "num"
              },
              "name": "num"
            },
            "init": {
              "type": "BinaryExpression",
              "start": 12,
              "end": 17,
              "loc": {
                "start": {
                  "line": 1,
                  "column": 12,
                  "index": 12
                },
                "end": {
                  "line": 1,
                  "column": 17,
                  "index": 17
                }
              },
              "left": {
                "type": "NumericLiteral",
                "start": 12,
                "end": 13,
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 12,
                    "index": 12
                  },
                  "end": {
                    "line": 1,
                    "column": 13,
                    "index": 13
                  }
                },
                "extra": {
                  "rawValue": 1,
                  "raw": "1"
                },
                "value": 1
              },
              "operator": "+",
              "right": {
                "type": "NumericLiteral",
                "start": 16,
                "end": 17,
                "loc": {
                  "start": {
                    "line": 1,
                    "column": 16,
                    "index": 16
                  },
                  "end": {
                    "line": 1,
                    "column": 17,
                    "index": 17
                  }
                },
                "extra": {
                  "rawValue": 1,
                  "raw": "1"
                },
                "value": 1
              }
            }
          }
        ],
        "kind": "const"
      }
    ],
    "directives": []
  },
  "comments": []
}

```

上面我们实现了把代码转换为抽象语法树，下面再给大家演示一下通过抽象语法树生成代码。

安装 `@babel/types` 和 `@babel/generator`依赖

*   @babel/types 可以快速创建语法树节点
    
*   @babel/generator 把语法树转换为代码
    

```js
const t = require('@babel/types');
const g = require('@babel/generator')

const ast = t.program(
  [
    t.variableDeclaration(
      'const',
      [
        t.variableDeclarator(
          t.identifier('num'),
          t.binaryExpression(
            '+',
            t.numericLiteral(1),
            t.numericLiteral(1)
          )
        )
      ]
    )
  ]
)

const code = g.default(ast).code;

console.log(code);

```

运行上面代码后输出

![image.png](./images/article-9/image-2.awebp)

## 低代码生成代码实战

### 实现思路

使用 node 起一个 express 服务，对外暴露生成代码接口，前端调用这个接口，并且把当前页面 json数据传到后端，后端解析 json 数据生成抽象语法树，然后通过抽象语法树生成代码。

前面我实现过一个低代码demo项目，就拿这个项目来说吧。建议大家可以先看一下我前面做的低代码平台。

> [低代码入门知识详解](https://juejin.cn/column/7291133929363931192 "https://juejin.cn/column/7291133929363931192")

### 实战

在前端低代码页面拖一个按钮到画布，然后点击生成代码按钮，调用生成代码接口。

页面 json 数据

```json
{
  "components": [
    {
      "id": 1,
      "name": "Page",
      "props": {},
      "desc": "页面",
      "fileName": "page",
      "children": [
        {
          "id": 1740045570763,
          "fileName": "button",
          "name": "Button",
          "props": {
            "text": {
              "type": "static",
              "value": "按钮"
            }
          },
          "desc": "按钮",
          "parentId": 1
        }
      ]
    }
  ]
}

```

把 json 数据转换为 jsx 元素

```js
const t = require('@babel/types');
const g = require('@babel/generator')
const prettier = require('prettier');

function createJsxStatement(component) {
  // 创建 jsx 元素
  return t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(component.name),
      []
    ),
    t.jsxClosingElement(
      t.jsxIdentifier(component.name),
      []
    ),
    // 递归创建子元素
    (component.children || []).map(createJsxStatement)
  );
}

function generateCode(components) {
  // 创建一个 App 方法
  const ast = t.functionDeclaration(
    t.identifier("App"),
    [],
    // 创建方法内部的语句
    t.blockStatement([
      // 创建 return 语句
      t.returnStatement(
        // 创建 <></
        t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          components.map(createJsxStatement)
        )
      )
    ])
  )

  // 格式化代码
  return prettier.format(
    g.default(ast).code,
    { parser: 'babel' }
  );
}

module.exports = {
  generateCode
}

```

生成的代码

![image.png](./images/article-9/image-3.awebp)

给组件加属性，遍历组件配置里的 props

![image.png](./images/article-9/image-4.awebp)

![image.png](./images/article-9/image-5.awebp)

上面代码并不能在项目里直接运行，因为没有导入组件，那我们再用抽象语法树动态生成导入语句。

![image.png](./images/article-9/image-6.awebp)

![image.png](./images/article-9/image-7.awebp)

![image.png](./images/article-9/image-8.awebp)

完整代码

```js
const t = require('@babel/types');
const g = require('@babel/generator')
const prettier = require('prettier');

let importStatements = new Map();

function createJsxStatement(component) {
  const attrs = [];

  Object.keys(component.props).forEach(key => {
    const propValue = component.props[key];

    if (typeof propValue === 'object') {
      console.log(propValue.value)
      attrs.push(
        t.jsxAttribute(
          t.jsxIdentifier(key),
          t.stringLiteral(propValue.value)
        )
      )
    }
  });

  // 生成导入语句，如果已经导入了则跳过
  if (!importStatements.has(component.name)) {
    importStatements.set(component.name,
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier(component.name))],
        t.stringLiteral(`@/editor/components/${component.fileName}/prod`)
      )
    )
  }

  // 创建 jsx 元素
  return t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(component.name),
      attrs
    ),
    t.jsxClosingElement(
      t.jsxIdentifier(component.name),
    ),
    // 递归创建子元素
    (component.children || []).map(createJsxStatement)
  );
}

function generateCode(components) {
  importStatements = new Map();
  // 默认导入 react和 useRef、useState
  importStatements.set("react",
    t.importDeclaration(
      [
        t.importDefaultSpecifier(t.identifier('React')),
        t.importSpecifier(
          t.identifier('useRef'),
          t.identifier('useRef')
        ),
        t.importSpecifier(
          t.identifier('useState'),
          t.identifier('useState')
        )
      ],
      t.stringLiteral('react')
    )
  );
  // 创建一个 App 方法
  const funcStatement = t.functionDeclaration(
    t.identifier("App"),
    [],
    // 创建方法内部的语句
    t.blockStatement([
      // 创建 return 语句
      t.returnStatement(
        // 创建 <></
        t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          components.map(createJsxStatement)
        )
      )
    ])
  )

  const ast = t.program(
    [
      ...importStatements.values(),
      funcStatement,
      // 生成默认导出 App 方法
      t.exportDefaultDeclaration(
        t.identifier("App")
      )
    ]
  )

  // 格式化代码
  return prettier.format(
    g.default(ast, {
      jsescOption: { minimal: true },
    }).code,
    { parser: 'babel' }
  );
}

module.exports = {
  generateCode
}

```

![image.png](./images/article-9/image-9.awebp)

接下来我们来支持动态生成事件，在低代码页面拖一个按钮和一个弹框，给按钮添加点击事件调用弹框显示方法。

![image.png](./images/article-9/image-10.awebp)

![image.png](./images/article-9/image-11.awebp)

生成代码传给后端的数据

![image.png](./images/article-9/image-12.awebp)

判断 key 是不是以 on 开头，如果是表示事件

![image.png](./images/article-9/image-13.awebp)

![image.png](./images/article-9/image-14.awebp)

![image.png](./images/article-9/image-15.awebp)

目前方法内部还没实现，接下来我们实现一下方法内部。通过配置可以知道方法内部其实就是调用 modal 组件的 open 方法，调用一个组件内部方法，需要用到 ref，所以我们需要为所有组件都创建对应的 ref。

![image.png](./images/article-9/image-16.awebp)

![image.png](./images/article-9/image-17.awebp)

![image.png](./images/article-9/image-18.awebp)

支持组件属性绑定变量。先在低代码页面上定义一个变量。

![image.png](./images/article-9/image-19.awebp)

再拖一个按钮，给当前按钮文本绑定变量

![image.png](./images/article-9/image-20.awebp)

再给按钮点击事件添加方法，改变变量的值。

![image.png](./images/article-9/image-21.awebp)

点击生成代码，把前端定义的变量传给后端

![image.png](./images/article-9/image-22.awebp)

后端根据传过来变量动态生成 useState 语句。

![image.png](./images/article-9/image-23.awebp)

在对应的实现方法中调用 set 方法设置值

![image.png](./images/article-9/image-24.awebp)

组件属性绑定变量，而不是直接写死字符串

![image.png](./images/article-9/image-25.awebp)

生成的代码

![image.png](./images/article-9/image-26.awebp)

把生成的代码复制项目里测试一下

![image.png](./images/article-9/image-27.awebp)

![image.png](./images/article-9/image-28.awebp)

![image.png](./images/article-9/image-29.awebp)

点击一下按钮

![image.png](./images/article-9/image-30.awebp)

## 完整代码

```js
const t = require('@babel/types');
const g = require('@babel/generator')
const prettier = require('prettier');

let importStatements = new Map();
let eventHandleStatements = [];
let refStatements = [];
let stateStatements = [];

// 首字母大写
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

function generateEventHandleStatement(config) {
  if (config.type === 'ComponentMethod') {
    return t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.memberExpression(
            t.identifier(`component_${config.config.componentId}_ref`),
            t.identifier("current")
          ),
          t.identifier(config.config.method)
        ),
        []
      ),
    )
  } else if (config.type === 'SetVariable') {
    return t.expressionStatement(
      t.callExpression(
        t.identifier(`set${capitalize(config.config.variable)}`),
        [t.stringLiteral(config.config.value)]
      )
    )
  } 
}

function createJsxStatement(component) {
  const attrs = [];

  Object.keys(component.props).forEach(key => {
    const propValue = component.props[key];
    // 处理事件
    if (key.startsWith('on')) {

      // 事件流里动作配置
      const config = component.props[key].children[0].config;

      // 方法名称
      const handleName = `${component.name}_${component.id}_${key}_Handle`;
      // 动态生成方法
      eventHandleStatements.push(
        t.functionDeclaration(
          t.identifier(handleName),
          [],
          // 方法内部实现
          t.blockStatement(
            [
              generateEventHandleStatement(config)
            ]
          )
        )
      );

      // 给组件添加事件
      attrs.push(
        t.jsxAttribute(
          t.jsxIdentifier(key),
          t.jsxExpressionContainer(
            t.identifier(handleName)
          )
        )
      );
    } else if (typeof propValue === 'object') {
      if (propValue.type === 'variable') {
        attrs.push(
          t.jsxAttribute(
            t.jsxIdentifier(key),
            t.jsxExpressionContainer(
              t.identifier(propValue.value)
            )
          )
        )
      } else {
        attrs.push(
          t.jsxAttribute(
            t.jsxIdentifier(key),
            t.stringLiteral(propValue.value)
          )
        )
      }
    }
  });

  // 生成导入语句，如果已经导入了则跳过
  if (!importStatements.has(component.name)) {
    importStatements.set(component.name,
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier(component.name))],
        t.stringLiteral(`@/editor/components/${component.fileName}/prod`)
      )
    )
  }

  refStatements.push(
    t.variableDeclaration(
      'const',
      [t.variableDeclarator(
        t.identifier(`component_${component.id}_ref`),
        t.callExpression(
          t.identifier("useRef"),
          []
        )
      )]
    )
  );
  attrs.push(
    t.jsxAttribute(
      t.jsxIdentifier("ref"),
      t.jsxExpressionContainer(
        t.identifier(`component_${component.id}_ref`)
      )
    )
  );

  // 创建 jsx 元素
  return t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(component.name),
      attrs
    ),
    t.jsxClosingElement(
      t.jsxIdentifier(component.name),
    ),
    // 递归创建子元素
    (component.children || []).map(createJsxStatement)
  );
}

function generateCode(components, variables) {
  importStatements = new Map();
  eventHandleStatements = [];
  refStatements = [];
  stateStatements = [];
  
  // 默认导入 react和 useRef、useState
  importStatements.set("react",
    t.importDeclaration(
      [
        t.importDefaultSpecifier(t.identifier('React')),
        t.importSpecifier(
          t.identifier('useRef'),
          t.identifier('useRef')
        ),
        t.importSpecifier(
          t.identifier('useState'),
          t.identifier('useState')
        )
      ],
      t.stringLiteral('react')
    )
  );

  variables.forEach(item => {
    const stateStatement = t.variableDeclaration("const", [
      t.variableDeclarator(
        t.arrayPattern([
          t.identifier(item.name),
          // capitalize把首字母转为大写
          t.identifier(`set${capitalize(item.name)}`)
        ]),
        t.callExpression(
          t.identifier("useState"),
          [
            t.stringLiteral(item.defaultValue)
          ]
        )
      )
    ]);
    stateStatements.push(stateStatement);
  });

  const elementStatements = components.map(createJsxStatement);

  // 创建一个 App 方法
  const funcStatement = t.functionDeclaration(
    t.identifier("App"),
    [],
    // 创建方法内部的语句
    t.blockStatement([
      ...stateStatements,
      ...refStatements,
      ...eventHandleStatements,
      // 创建 return 语句
      t.returnStatement(
        // 创建 <></
        t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          elementStatements,
        )
      )
    ])
  );


  const ast = t.program(
    [
      ...importStatements.values(),
      funcStatement,
      // 生成默认导出 App 方法
      t.exportDefaultDeclaration(
        t.identifier("App")
      )
    ]
  )

  // 格式化代码
  return prettier.format(
    g.default(ast, {
      jsescOption: { minimal: true },
    }).code,
    { parser: 'babel' }
  );
}

module.exports = {
  generateCode
}

```

## 最后

篇幅有限，很多细节我就不在这里一一写出来了，大家只要明白我的思路就行了。