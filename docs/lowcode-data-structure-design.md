# 无代码平台数据结构设计方案

## 概述

本文档旨在设计一个类似 Figma 的基于 React 的无代码平台的数据结构。该设计将支持组件的拖拽、布局、属性设置、事件绑定等功能，同时保证数据的可持久化和可扩展性。

## 核心数据结构

### 1. 组件定义 (ComponentDefinition)

```typescript
interface ComponentDefinition {
  // 组件唯一标识
  id: string;
  
  // 组件类型 (如 'Button', 'Container', 'Text' 等)
  type: string;
  
  // 组件名称 (用户可见的名称)
  name: string;
  
  // 组件属性
  props: Record<string, any>;
  
  // 组件样式
  styles: Record<string, any>;
  
  // 子组件列表
  children: ComponentDefinition[];
  
  // 父组件ID
  parentId?: string;
  
  // 组件在父容器中的位置索引
  index: number;
  
  // 组件是否隐藏
  hidden: boolean;
  
  // 组件锁定状态
  locked: boolean;
}
```

### 2. 页面结构 (Page)

```typescript
interface Page {
  // 页面唯一标识
  id: string;
  
  // 页面名称
  name: string;
  
  // 页面描述
  description?: string;
  
  // 页面根组件
  rootComponent: ComponentDefinition;
  
  // 页面变量
  variables: Variable[];
  
  // 页面全局样式
  globalStyles?: Record<string, any>;
  
  // 页面设置
  settings: {
    // 页面标题
    title: string;
    
    // 页面描述
    description: string;
    
    // 页面关键字
    keywords: string[];
    
    // 其他页面级设置
    [key: string]: any;
  };
}
```

### 3. 变量系统 (Variable)

```typescript
interface Variable {
  // 变量唯一标识
  id: string;
  
  // 变量名称
  name: string;
  
  // 变量类型
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function' | 'expression';
  
  // 变量值
  value: any;
  
  // 变量默认值
  defaultValue: any;
  
  // 变量描述
  description?: string;
  
  // 变量是否公开 (可用于组件间传递)
  isPublic: boolean;
}
```

### 4. 事件系统 (Event)

```typescript
interface ComponentEvent {
  // 事件唯一标识
  id: string;
  
  // 事件名称 (如 'onClick', 'onHover' 等)
  name: string;
  
  // 事件处理器
  handlers: EventHandler[];
}

interface EventHandler {
  // 处理器唯一标识
  id: string;
  
  // 处理器类型
  type: 'navigation' | 'state' | 'api' | 'custom';
  
  // 处理器配置
  config: Record<string, any>;
  
  // 处理器启用状态
  enabled: boolean;
}
```

### 5. 组件库定义 (ComponentLibrary)

```typescript
interface ComponentLibrary {
  // 组件库唯一标识
  id: string;
  
  // 组件库名称
  name: string;
  
  // 组件列表
  components: ComponentTemplate[];
}

interface ComponentTemplate {
  // 模板唯一标识
  id: string;
  
  // 组件类型
  type: string;
  
  // 模板名称
  name: string;
  
  // 模板缩略图
  thumbnail?: string;
  
  // 默认属性
  defaultProps: Record<string, any>;
  
  // 默认样式
  defaultStyles: Record<string, any>;
  
  // 可配置的属性
  propsSchema: PropSchema[];
  
  // 可绑定的事件
  events: string[];
  
  // 组件分类
  category: string;
}

interface PropSchema {
  // 属性名称
  name: string;
  
  // 属性类型
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array' | 'function' | 'expression';
  
  // 属性标签
  label: string;
  
  // 属性描述
  description?: string;
  
  // 默认值
  defaultValue: any;
  
  // 枚举值 (当type为enum时)
  enumValues?: any[];
  
  // 其他配置项
  [key: string]: any;
}
```

## 状态管理

### 1. 编辑器状态

```typescript
interface EditorState {
  // 当前打开的页面
  currentPageId: string;
  
  // 所有页面
  pages: Page[];
  
  // 当前选中的组件
  selectedComponentId: string;
  
  // 当前悬停的组件
  hoveredComponentId: string;
  
  // 编辑器模式
  mode: 'design' | 'preview' | 'code';
  
  // 编辑器缩放比例
  zoom: number;
  
  // 编辑器画布尺寸
  canvasSize: { width: number; height: number };
  
  // 组件库
  componentLibraries: ComponentLibrary[];
  
  // 历史记录 (用于撤销/重做)
  history: HistoryEntry[];
  
  // 历史记录指针
  historyIndex: number;
}

interface HistoryEntry {
  // 操作类型
  type: 'add' | 'delete' | 'update' | 'move' | 'reorder';
  
  // 操作时间戳
  timestamp: number;
  
  // 操作前状态
  before: any;
  
  // 操作后状态
  after: any;
}
```

## 数据持久化

### 1. 存储结构

```typescript
interface Project {
  // 项目唯一标识
  id: string;
  
  // 项目名称
  name: string;
  
  // 项目描述
  description?: string;
  
  // 项目版本
  version: string;
  
  // 创建时间
  createdAt: number;
  
  // 更新时间
  updatedAt: number;
  
  // 项目设置
  settings: {
    // 项目主题
    theme: 'light' | 'dark';
    
    // 默认画布尺寸
    defaultCanvasSize: { width: number; height: number };
    
    // 其他项目级设置
    [key: string]: any;
  };
  
  // 页面列表
  pages: Page[];
  
  // 组件库
  componentLibraries: ComponentLibrary[];
  
  // 项目变量
  variables: Variable[];
}
```

## 扩展性设计

### 1. 插件系统

```typescript
interface Plugin {
  // 插件唯一标识
  id: string;
  
  // 插件名称
  name: string;
  
  // 插件版本
  version: string;
  
  // 插件描述
  description?: string;
  
  // 插件提供的组件
  components?: ComponentTemplate[];
  
  // 插件提供的功能
  features?: Feature[];
}

interface Feature {
  // 功能唯一标识
  id: string;
  
  // 功能名称
  name: string;
  
  // 功能实现
  implementation: Function;
}
```

## 总结

该数据结构设计充分考虑了无代码平台的核心需求，包括：

1. **灵活性**：通过组件树结构支持复杂的嵌套布局
2. **可扩展性**：通过组件库和插件系统支持功能扩展
3. **易用性**：清晰的数据结构便于理解和使用
4. **可持久化**：完整的项目结构支持数据存储和恢复
5. **协作性**：历史记录和状态管理支持撤销/重做功能

该设计可以作为构建类似 Figma 的无代码平台的数据基础，开发者可以根据具体需求进行调整和扩展。