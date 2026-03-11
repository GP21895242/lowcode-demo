# 实战开发：CRUD 页面实战上

原文链接: https://juejin.cn/post/7294907512443994175

---

# 前言

前面低代码核心功能实现的差不多了，这篇我们开发一个经典的CRUD页面来实战一下。不过在做页面之前需要先封装一些组件，有了组件，开发页面就像拼积木一样把组件拼起来。

CRUD页面包括搜索区、表格、新建按钮、新建表单、弹框，所以这一篇我们需要先实现这些组件。

# 往期回顾

> [《保姆级》低代码知识点详解（一）](https://juejin.cn/post/7291133485834272827 "https://juejin.cn/post/7291133485834272827")
> 
> [低代码事件绑定和组件联动——低代码知识点详解（二）](https://juejin.cn/post/7292354382909374476 "https://juejin.cn/post/7292354382909374476")
> 
> [低代码动态属性和在线执行脚本——低代码知识点详解（三）](https://juejin.cn/post/7293114988780191785 "https://juejin.cn/post/7293114988780191785")
> 
> [低代码在线加载远程组件——低代码知识点详解（四）](https://juejin.cn/post/7293738741398323234 "https://juejin.cn/post/7293738741398323234")
> 
> [低代码可视化逻辑编排——低代码知识点详解（五）](https://juejin.cn/post/7294619778978037801 "https://juejin.cn/post/7294619778978037801")

# 代码优化

## 背景

为了让封装组件变简单点，很多功能直接可以使用配置的方式去配置，以组件为单位，把所有东西都在当前组件中搞定，不用去管框架代码。

## 实现

### 数据结构

从前面实现的功能来看，物料组件的数据结构可以设计成下面这样。

```ts
// src/editor/interface.ts

export interface ComponentSetter {
  name: string;
  label: string;
  type: string;
  [key: string]: any;
}

export interface ComponentEvent {
  name: string;
  desc: string;
}

export interface ComponentMethod {
  name: string;
  desc: string;
}

export interface ComponentConfig {
  /**
   * 组件名称
   */
  name: string;
  /**
   * 组件描述
   */
  desc: string;
  /**
   * 组件默认属性
   */
  defaultProps:
    | {
        [key: string]: {
          type: 'variable' | 'static';
          value: any;
        };
      }
    | (() => {
        [key: string]: {
          type: 'variable' | 'static';
          value: any;
        };
      });
  /**
   * 编辑模式下加载的组件
   */
  dev: any;
  /**
   * 正式模式下加载的组件
   */
  prod: any;
  /**
   * 组件属性配置
   */
  setter: ComponentSetter[];
  /**
   * 组件方法
   */
  methods: ComponentMethod[];
  /**
   * 组件事件
   */
  events: ComponentEvent[];
  /**
   * 组件排序
   */
  order: number;
}


```

### 以按钮组件为例

目录结构是这样的

![image.png](./images/article-6/image-1.awebp)

dev：编辑模式下渲染的组件

prod：预览模型或正式模式下渲染的组件

index：配置文件

配置文件内容

```ts

// src/editor/components/button/index.ts

import {ComponentConfig} from '../../interface';
import Dev from './dev';
import Prod from './prod';

export default {
  name: 'Button',
  desc: '按钮',
  defaultProps: {
    text: {type: 'static', value: '按钮'},
  },
  dev: Dev,
  prod: Prod,
  setter: [
    {
      name: 'type',
      label: '按钮类型',
      type: 'select',
      options: [
        {label: '主按钮', value: 'primary'},
        {label: '次按钮', value: 'default'},
      ],
    },
    {
      name: 'text',
      label: '文本',
      type: 'input',
    },
  ],
  methods: [
    {
      name: 'startLoading',
      desc: '开始loading',
    },
    {
      name: 'endLoading',
      desc: '结束loading',
    },
  ],
  events: [
    {
      name: 'onClick',
      desc: '点击事件',
    },
  ],
  order: 2,
} as ComponentConfig;

```

这样我们新增组件的时候，只要按这个格式配置就行了。

### 优化

上面直接导出配置文件，虽然可以实现需求，但是扩展性会降低，比如异步添加组件就不行了。

所以好的方式是对外暴露一个注册组件的方法，在任何地方和任何时间都可以调用这个方法，注册组件。

改造一下按钮组件配置文件

```ts
import {Context} from '../../interface';
import ButtonDev from './dev';
import ButtonProd from './prod';

export default (ctx: Context) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      ctx.registerComponent('Button', {
        name: 'Button',
        desc: '按钮',
        defaultProps: {
          text: {type: 'static', value: '按钮'},
        },
        dev: ButtonDev,
        prod: ButtonProd,
        setter: [
          {
            name: 'type',
            label: '按钮类型',
            type: 'select',
            options: [
              {label: '主按钮', value: 'primary'},
              {label: '次按钮', value: 'default'},
            ],
          },
          {
            name: 'text',
            label: '文本',
            type: 'input',
          },
        ],
        methods: [
          {
            name: 'startLoading',
            desc: '开始loading',
          },
          {
            name: 'endLoading',
            desc: '结束loading',
          },
        ],
        events: [
          {
            name: 'onClick',
            desc: '点击事件',
          },
        ],
        order: 2,
      });
      resolve({});
    }, 1000);
  });
};

```

这种方式可以支持异步添加组件

### 实现注册组件方法

先创建一个store，存放注册的组件配置

```ts
// src/editor/stores/component-config.ts

import {create} from 'zustand';
import {ComponentConfig} from '../interface';

interface State {
  componentConfig: {[key: string]: ComponentConfig};
}

interface Action {
  setComponentConfig: (componentConfig: State['componentConfig']) => void;
}

export const useComponentConfigStore = create<State & Action>((set) => ({
  componentConfig: {},
  setComponentConfig: (componentConfig) => set({componentConfig}),
}));


```

实现注册组件方法，这里用一个黑科技，正常我们每添加一个组件，都需要把组件配置引入进来，然后执行里面的方法，这样比较麻烦。

在vite项目里可以使用[import.meta.glob](https://link.juejin.cn?target=https%3A%2F%2Fcn.vitejs.dev%2Fguide%2Ffeatures.html%23glob-import "https://cn.vitejs.dev/guide/features.html#glob-import")方法动态加载模块，非常好用。这样以后我们新加组件，只需要关注当前组件就行了，其他都不用管，会自动加载。

```tsx
// src/editor/layouts/index.tsx

import { Allotment } from "allotment";
import "allotment/dist/style.css";
import React, { useEffect, useState } from 'react';

import { Spin } from 'antd';
import { ComponentConfig } from '../interface';
import { useComponentConfigStore } from '../stores/component-config';
import { useComponetsStore } from '../stores/components';
import Header from './header';
import Material from './material';
import Setting from './setting';
import EditStage from './stage/edit';
import ProdStage from './stage/prod';

const Layout: React.FC = () => {

  const { mode } = useComponetsStore();
  const { setComponentConfig } = useComponentConfigStore();
  const [loading, setLoading] = useState(true);

  const componentConfigRef = React.useRef<any>({});

  // 注册组件
  function registerComponent(name: string, componentConfig: ComponentConfig) {
    componentConfigRef.current[name] = componentConfig;
  }

  // 加载组件配置
  async function loadComponentConfig() {
    // 匹配components文件夹下的index.ts文件，加载组件配置模块代码
    const modules = import.meta.glob('../components/*/index.ts', { eager: true });

    const tasks = Object.values(modules).map((module: any) => {
      if (module?.default) {
        // 执行组件配置里的方法，把注册组件方法传进去
        return module.default({ registerComponent });
      }
    });

    // 等待所有组件配置加载完成
    await Promise.all(tasks);
    // 注册组件到全局
    setComponentConfig(componentConfigRef.current);
    setLoading(false);
  }


  useEffect(() => {
    loadComponentConfig();
  }, []);


  if (loading) {
    return (
      <div className='text-center mt-[100px]'>
        <Spin />
      </div>
    )
  }

  return (
    <div className='h-[100vh] flex flex-col'>
      <div className='h-[50px] flex items-centen border-solid border-[1px] border-[#ccc]'>
        <Header />
      </div>
      {mode === 'edit' ? (
        <Allotment>
          <Allotment.Pane preferredSize={240} maxSize={400} minSize={200}>
            <Material />
          </Allotment.Pane>
          <Allotment.Pane>
            <EditStage />
          </Allotment.Pane>
          <Allotment.Pane preferredSize={300} maxSize={500} minSize={300}>
            <Setting />
          </Allotment.Pane>
        </Allotment>
      ) : (
        <ProdStage />
      )}
    </div>
  )
}

export default Layout;

```

因为把组件配置存到了全局，所以后面关于组件的一些配置信息，直接从全局里取就好了。这里举个例子，渲染组件列表。

```tsx
// src/editor/layouts/material/index.tsx

import { useMemo } from 'react';
import ComponentItem from '../../common/component-item';
import { useComponentConfigStore } from '../../stores/component-config';
import { useComponetsStore } from '../../stores/components';
import { ComponentConfig } from '../../interface';

const Material: React.FC = () => {

  const { addComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  /**
   * 拖拽结束，添加组件到画布
   * @param dropResult 
   */
  const onDragEnd = (dropResult: { name: string, id?: number, props: any }) => {
    addComponent({
      id: new Date().getTime(),
      name: dropResult.name,
      props: dropResult.props,
    }, dropResult.id);
  }

  const components = useMemo(() => {
    // 加载所有组件
    const coms = Object.values(componentConfig).map((config: ComponentConfig) => {
      return {
        name: config.name,
        description: config.desc,
        order: config.order,
      }
    })

    // 排序
    coms.sort((x, y) => x.order - y.order);
    return coms;
  }, [componentConfig]);

  return (
    <div className='flex p-[10px] gap-4 flex-wrap'>
      {components.map(item => <ComponentItem key={item.name} onDragEnd={onDragEnd} {...item} />)}
    </div>
  )
}

export default Material;

```

其它比如组件事件和组件方法都可以从这里取，就不一一展示了。

# 封装组件

增删改查页面肯定少不了表格，先封装一个表格组件，表格可以绑定一个请求接口url，支持动态列，对外暴露搜索和刷新方法。

按照上面数据结构，先创建index.ts，内容如下：

```ts

// src/editor/components/table/index.ts

import {Context} from '../../interface';
import TableDev from './dev';
import TableProd from './prod';

export default (ctx: Context) => {
  ctx.registerComponent('Table', {
    name: 'Table',
    desc: '表格',
    defaultProps: {},
    dev: TableDev,
    prod: TableProd,
    setter: [
      {
        name: 'url',
        label: 'url',
        type: 'input',
      },
    ],
    methods: [
      {
        name: 'search',
        desc: '搜索',
      },
      {
        name: 'reload',
        desc: '刷新',
      },
    ],
    order: 4,
  });
};

```

dev.tsx

```tsx
// src/editor/components/table/dev.tsx

import { Table as AntdTable } from 'antd';
import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { ItemType } from '../../item-type';

interface Props {
  id: number;
  children?: any[];
}

const Table: React.FC<Props> = ({ id, children }) => {

  const [{ canDrop }, drop] = useDrop(() => ({
    accept: [ItemType.TableColumn],
    drop: (_, monitor) => {
      const didDrop = monitor.didDrop()
      if (didDrop) {
        return;
      }

      return {
        id,
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));


  const columns: any = useMemo(() => {
    return React.Children.map(children, (item: any) => {
      return {
        title: (
          <div className='m-[-16px] p-[16px]' data-component-id={item.props?.id}>{item.props?.title}</div>
        ),
        dataIndex: item.props?.dataIndex,
      }
    })
  }, [children]);

  return (
    <div
      className='w-[100%]'
      ref={drop}
      data-component-id={id}
      style={{ border: canDrop ? '1px solid #ccc' : 'none' }}
    >
      <AntdTable
        columns={columns}
        dataSource={[]}
        pagination={false}
      />
    </div>
  );
}

export default Table;

```

prod.tsx

```tsx
import { Table as AntdTable } from 'antd';
import dayjs from 'dayjs';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import axios from 'axios';

interface Props {
  url: string;
  children: any;
}

const Table = ({ url , children }: Props, ref: any) => {

  const [data, setData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState({});

  const [loading, setLoading] = useState(false);

  const getData = async (params?: any) => {
    if (url) {
      setLoading(true);
      const { data } = await axios.get(url, { params });
      setData(data);
      setLoading(false);
    }
  }

  useEffect(() => {
    getData(searchParams);
  }, [searchParams]);

  useImperativeHandle(ref, () => {
    return {
      search: setSearchParams,
      reload: () => {
        getData(searchParams)
      },
    }
  }, [searchParams])

  const columns: any = useMemo(() => {
    return React.Children.map(children, (item: any) => {

      if (item?.props?.type === 'date') {
        return {
          title: item.props?.title,
          dataIndex: item.props?.dataIndex,
          render: (value: any) => dayjs(value).format('YYYY-MM-DD')
        }
      }

      return {
        title: item.props?.title,
        dataIndex: item.props?.dataIndex,
      }
    })
  }, [children]);


  return (
    <AntdTable
      columns={columns}
      dataSource={data}
      pagination={false}
      rowKey="id"
      loading={loading}
    />
  );
}

export default forwardRef(Table);

```

# 表格列组件

可以拖放到表格组件中，

index.ts

```tsx
import {Context} from '../../interface';
import Dev from './dev';
import Prod from './prod';

export default (ctx: Context) => {
  ctx.registerComponent('TableColumn', {
    name: 'TableColumn',
    desc: '表格列',
    defaultProps: () => {
      return {
        dataIndex: {type: 'static', value: `col_${new Date().getTime()}`},
        title: {type: 'static', value: '标题'},
        type: 'text',
      };
    },
    dev: Dev,
    prod: Prod,
    setter: [
      {
        name: 'type',
        label: '类型',
        type: 'select',
        options: [
          {
            label: '文本',
            value: 'text',
          },
          {
            label: '日期',
            value: 'date',
          },
        ],
      },
      {
        name: 'title',
        label: '标题',
        type: 'input',
      },
      {
        name: 'dataIndex',
        label: '字段',
        type: 'input',
      },
    ],
    order: 5,
  });
};

```

因为这个组件不用真正的渲染，dev和prod返回空就行了。

dev.tsx和prod.tsx

```tsx
const TableColumn = () => {
  return <></>
}

export default TableColumn;

```

搜索区组件、弹框组件、表单组件都按照这个流程实现就行了。

# 开发页面

## 整体布局

先把组件整体布局拖好，然后再一个一个组件设置。拖一个间距组件，设置为垂直布局，然后拖一个搜索区、一个按钮、一个表格、一个弹框、再把表单拖到弹框中。

![Kapture 2023-10-29 at 20.54.48.gif](./images/article-6/image-2.awebp)

## 配置搜索区

拖一个搜索项放进去，把搜索项标题改为姓名，字段改为fullName，并且把搜索事件绑定表格组件搜索方法。

![Kapture 2023-10-29 at 21.12.16.gif](./images/article-6/image-3.awebp)

## 配置表格

拖两个表格列放到表格组件中，一个展示姓名、一个展示添加日期，然后再设置请求url。

![Kapture 2023-10-29 at 21.17.10.gif](./images/article-6/image-4.awebp)

## 搜索效果展示

![Kapture 2023-10-29 at 21.21.48.gif](./images/article-6/image-5.awebp)

## 配置表单

拖一个表单项进去，标题改为姓名，字段改为fullName，设置表单请求url。

![Kapture 2023-10-29 at 21.27.41.gif](./images/article-6/image-6.awebp)

## 实现新建功能

实现新建功能，需要按照下面流程来实现。

1.  按钮点击事件绑定弹框显示方法，
2.  弹框确定按钮绑定表单提交方法，并且因为提交调接口是异步的，所以需要把弹框的确定按钮设置为loading。
3.  表单提交成功事件先绑定显示成功提示，然后调用弹框隐藏方法，继续调用弹框停止确定按钮loading方法，最后调用表格刷新方法。
4.  表单提交失败事件直接调用弹框结束loading方法。

![Kapture 2023-10-29 at 21.37.12.gif](./images/article-6/image-7.awebp)

![Kapture 2023-10-29 at 21.38.59.gif](./images/article-6/image-8.awebp)

![Kapture 2023-10-29 at 21.47.09.gif](./images/article-6/image-9.awebp)

![Kapture 2023-10-29 at 21.50.00.gif](./images/article-6/image-10.awebp)

## 整体功能演示

![Kapture 2023-10-29 at 22.03.35.gif](./images/article-6/image-11.awebp)

# 最后

这一篇我们先实现增加和搜索功能，下一篇把难度升级一下，实现编辑和删除功能，并且还会多增加几个表单类型，比如日期、下拉框等，还会用到变量脚本以及条件节点。

demo体验地址：[dbfu.github.io/lowcode-dem…](https://link.juejin.cn?target=https%3A%2F%2Fdbfu.github.io%2Flowcode-demo%2F "https://dbfu.github.io/lowcode-demo/")

demo仓库地址：[github.com/dbfu/lowcod…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fdbfu%2Flowcode-demo "https://github.com/dbfu/lowcode-demo")