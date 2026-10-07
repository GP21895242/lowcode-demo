# Lowcode Demo

这是一个基于 React 的无代码平台演示项目，类似于 Figma 的设计和实现。

## 项目结构

```
src/
├── editor/           # 编辑器核心代码
│   ├── components/   # 组件实现
│   ├── stores/       # 状态管理
│   ├── layouts/      # 布局组件
│   ├── hooks/        # 自定义 hooks
│   ├── utils/        # 工具函数
│   ├── common/       # 公共组件
│   ├── interface.ts  # 核心接口定义
│   └── item-type.ts  # 组件类型定义
├── App.tsx           # 应用根组件
└── main.tsx          # 应用入口
```

## 数据结构设计

我们设计了一套完整的数据结构来支持无代码平台的核心功能，详细信息请参考：

[无代码平台数据结构设计方案](./docs/lowcode-data-structure-design.md)

## 开发指南

### 安装依赖

```bash
npm install
# 或者使用 yarn
yarn install
# 或者使用 pnpm
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

### 构建生产版本

```bash
npm run build
# 或者
yarn build
# 或者
pnpm build
```

## 核心特性

- [x] 组件拖拽和布局
- [x] 属性面板配置
- [x] 组件嵌套支持
- [x] 实时预览
- [ ] 事件系统
- [ ] 变量系统
- [ ] 插件系统

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

[MIT](LICENSE)
