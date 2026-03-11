# 实战开发：CRUD 页面实战下

原文链接: https://juejin.cn/post/7303738150307250210

---

# 前言

前面已经简单的实现了CRUD中查询和新增功能，这一篇我们来实现一下编辑和删除功能，不过我在做demo的时候，发现了一些问题，框架做了一些改造，所以这一期拖的时间有点长。

# 体外话

有些倔友对低代码存在的意思表示好奇，这里结合公司里的低代码平台说明一下。

![image.png](./images/article-7/image-1.awebp)

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
> 
> [使用低代码实战开发页面（上）——低代码知识点详解（六）](https://juejin.cn/post/7294907512443994175 "https://juejin.cn/post/7294907512443994175")

# 页面持久化

前面有人和我说，希望刷新后配置还在，这就需要把数据存到localstorage中。因为我们是使用zustand库做状态存储的，而zustand库实现数据持久化是非常简单的，只需要使用一个中间件就行了，看下面变量持久化例子。

```ts
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
export interface Variable {
  /**
   * 变量名
   */
  name: string;
  /**
   * 默认值
   */
  defaultValue: string;
  /**
   * 备注
   */
  remark: string;
}

interface State {
  variables: Variable[];
}

interface Action {
  /**
   * 添加组件
   * @param component 组件属性
   * @param parentId 上级组件id
   * @returns
   */
  setVariables: (variables: Variable[]) => void;
}

export const useVariablesStore = create(
  persist<State & Action>(
    (set) => ({
      variables: [],
      setVariables: (variables) => set({variables}),
    }),
    {
      name: 'variables',
      storage: createJSONStorage(() => localStorage),
    }
  )
);


```

components持久化和这个一样，代码就不展示了。

# 实现删除组件功能

如果一不小心拖错了组件，希望可以给删除掉，下面来实现删除组件功能。删除按钮加在选中组件遮罩的左上角。

## 动态算出删除按钮的问题

![image.png](./images/article-7/image-2.awebp)

## 渲染删除按钮

通过绝对定位把按钮设置到左上角

![image.png](./images/article-7/image-3.awebp)

## 实现删除组件方法

递归查找出当前组件的父组件，然后从父组件children中移除当前要删除的组件。

![image.png](./images/article-7/image-4.awebp)

## 效果展示

![image.png](./images/article-7/image-5.awebp)

![image.png](./images/article-7/image-6.awebp)

# 通过当前组件选择父组件

当组件嵌套比较多的时候，因为容器组件可能被遮挡，就无法选中了。现在我们来实现一下，选中一个组件后，可以切换到它的上级组件。

![image.png](./images/article-7/image-7.awebp)

获取当前组件所有上级，然后使用antd中Dropdown组件渲染。

![image.png](./images/article-7/image-8.awebp)

# 动态隐藏组件

这个功能主要是用来实现组件联动的。有三个按钮，两个按钮来控制另外一个按钮的显示和隐藏，下面我们来实现一下这个功能。

因为这个功能所有组件都是通用的，所以给提出来，变成公共配置。如下图：

![image.png](./images/article-7/image-9.awebp)

所有组件默认是显示的，可以直接切换隐藏，也可以绑定变量来控制隐藏。

先封装一个带变量选择的Switch切换框，和前面封装input类似，代码如下：

```tsx
// src/editor/common/setting-form-item/switch.tsx
import { SettingOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { useState } from 'react';
import SelectVariableModal from '../select-variable-modal';

interface Value {
  type: 'static' | 'variable';
  value: any;
}

interface Props {
  value?: Value,
  onChange?: (value: Value) => void;
}

const SettingFormItemSwitch: React.FC<Props> = ({ value, onChange }) => {

  const [visible, setVisible] = useState(false);

  function valueChange(checked: any) {
    onChange && onChange({
      type: 'static',
      value: checked,
    });
  }

  function select(record: any) {
    onChange && onChange({
      type: 'variable',
      value: record.name,
    });

    setVisible(false);
  }

  return (
    <div className='flex gap-[8px]'>
      <Switch
        disabled={value?.type === 'variable'}
        checked={(value?.type === 'static' || !value) ? value?.value : ''}
        onChange={valueChange}
        checkedChildren="隐藏"
        unCheckedChildren="显示"
      />
      <SettingOutlined
        onClick={() => { setVisible(true) }}
        className='cursor-pointer'
        style={{ color: value?.type === 'variable' ? 'blue' : '' }}
      />
      <SelectVariableModal
        open={visible}
        onCancel={() => { setVisible(false) }}
        onSelect={select}
      />
    </div>
  )
}


export default SettingFormItemSwitch;

```

在渲染的时候，根据配置判断是否渲染组件，如果是隐藏，则返回null，不渲染组件。

![image.png](./images/article-7/image-10.awebp)

效果展示

![Kapture 2023-11-20 at 20.59.34.gif](./images/article-7/image-11.awebp)

# 表格支持添加操作列

因为编辑和删除是表格行上的操作，所以表格单元格需要支持自定义操作。

因为这个配置比较麻烦，所以组件需要自定义setter，在渲染setter的地方判断一下，如果是组件就去渲染，如果是数组使用公共属性组件去渲染。

![image.png](./images/article-7/image-12.awebp)

table-column配置代码如下：

```tsx
// src/editor/components/table-column/setter.tsx

import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Input, Space, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import { arrayMove } from "react-sortable-hoc";
import CommonSetter from '../../common/common-setter';
import SortableList from '../../common/sortable-list';
import FlowEvent from '../../layouts/flow-event';

const setter = [
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
      {
        label: '操作',
        value: 'option',
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
];

function OptionsFormItem({ value = [], onChange }: any) {

  const [open, setOpen] = useState(false);
  const [curItem, setCurItem] = useState<any>({});
  const flowEventRef = useRef<any>();

  function changeHandle(val: string, item: any) {
    item.label = val;
    onChange([...value]);
  }

  function sortEndHanlde({ oldIndex, newIndex }: { oldIndex: number; newIndex: number; }) {
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  function save() {
    const val = flowEventRef.current?.save();
    curItem.event = val;
    onChange([...value]);
    setOpen(false);
    setCurItem({});
  }

  return (
    <div>
      <div className="h-[32px] flex items-center bg-[#f7f8fa] px-[16px] rounded-2px font-semibold">操作</div>
      <div className='w-[100%] p-[20px]'>
        <SortableList
          items={value || []}
          hiddenEdit
          onDelete={(item: any) => {
            const index = value.findIndex((v: any) => v.dataIndex === item.dataIndex);
            value.splice(index, 1);
            onChange([...value]);
          }}
          itemRender={(item: any) => (
            <Space>
              <div
                className='w-[140px] text-[14px] text-[rgb(0,0,0)]'
                style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'" }}
              >
                <Input onChange={(e) => { changeHandle(e.target.value, item) }} value={item.label} />
              </div>
              <Tooltip title="设置点击事件">
                <EditOutlined
                  onClick={() => {
                    setCurItem(item);
                    setOpen(true);
                  }}
                  className="cursor-pointer"
                />
              </Tooltip>
            </Space>
          )}
          useDragHandle
          onSortEnd={sortEndHanlde}
        />
      </div>
      <div
        className='px-[20px]'
      >
        <Button
          icon={(
            <PlusOutlined />
          )}
          block
          type='dashed'
          onClick={() => {
            onChange([...value, { key: new Date().getTime(), label: '' }]);
          }}
        >
          添加
        </Button>
      </div>
      <Drawer
        title="设置事件流"
        width="100vw"
        open={open}
        zIndex={1005}
        onClose={() => { setOpen(false); }}
        extra={(
          <Button
            type='primary'
            onClick={save}
          >
            保存
          </Button>
        )}
        push={false}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        <FlowEvent flowData={curItem?.event} ref={flowEventRef} />
      </Drawer>
    </div>
  )
}


function Setter() {

  const form = Form.useFormInstance();

  const type = Form.useWatch('type', form);

  return (
    <>
      <CommonSetter setters={setter} />
      {type === 'option' && (
        <Form.Item noStyle name="options">
          <OptionsFormItem />
        </Form.Item>
      )}
    </>
  )
}

export default Setter;


```

为了支持添加的操作可以拖拽排序，使用了[`react-sortable-hoc`](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fclauderic%2Freact-sortable-hoc "https://github.com/clauderic/react-sortable-hoc")组件，原生组件用起来比较难受，我这里做了个简单的封装，方便后面其他地方使用。

```tsx
// src/editor/common/sortable-list.tsx

import { DeleteOutlined, EditOutlined, HolderOutlined } from '@ant-design/icons';
import { Space } from 'antd';

import { SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";

const DragHandle = SortableHandle(() => <HolderOutlined className='text-[14px] cursor-move' />);

const SortableItem = SortableElement<any>(({
  item,
  onDelete,
  itemRender,
  customItemRender,
  hiddenEdit,
  onEdit,
  hiddenDelete,
  hiddenDrag,
  itemIndex,
  deleteHandle,
  editHandle,
}: any) => {

  function renderDelete() {
    if (deleteHandle) {
      if (deleteHandle(item, itemIndex)) {
        return (
          <DeleteOutlined onClick={onDelete} className="hover:text-[red] cursor-pointer" />
        )
      }
    } else if (!hiddenDelete) {
      return (
        <DeleteOutlined onClick={onDelete} className="hover:text-[red] cursor-pointer" />
      )
    }
  }

  function renderEdit() {
    if (editHandle) {
      if (editHandle(item, itemIndex)) {
        return (
          <EditOutlined className="cursor-pointer" onClick={() => { onEdit(item, itemIndex) }} />
        )
      }
    } else if (!hiddenEdit) {
      return (
        <EditOutlined className="cursor-pointer" onClick={() => { onEdit(item, itemIndex) }} />
      )
    }
  }

  return (
    <div key={item.key} style={{ lineHeight: 1, fontSize: 14 }} className="py-[4px]">
      {customItemRender ? customItemRender(item, itemIndex) : (
        <Space style={{ width: '100%' }}>
          {renderEdit()}
          {itemRender && itemRender(item, itemIndex)}
          {renderDelete()}
          {!hiddenDrag && <DragHandle />}
        </Space>
      )}
    </div>
  )

});

const SortableList = SortableContainer<any>(({
  items,
  onDelete,
  itemRender,
  hiddenEdit,
  hiddenDelete,
  onEdit,
  hiddenDrag,
  customItemRender,
  deleteHandle,
  editHandle,
}: any) => {
  return (
    <div>
      {items.map((value: any, index: number) => (
        <SortableItem
          key={value.key}
          index={index}
          item={value}
          itemIndex={index}
          onDelete={() => {
            onDelete(value, index);
          }}
          itemRender={itemRender}
          hiddenEdit={hiddenEdit}
          hiddenDelete={hiddenDelete}
          onEdit={onEdit}
          hiddenDrag={hiddenDrag}
          customItemRender={customItemRender}
          deleteHandle={deleteHandle}
          editHandle={editHandle}
        />
      ))}
    </div>
  );
});

export default SortableList;

```

效果展示

![Kapture 2023-11-20 at 21.40.45.gif](./images/article-7/image-13.awebp)

改造表格渲染列的方法，增加操作类型判断。

![image.png](./images/article-7/image-14.awebp)

上面代码里\_execEventFlow方法，是封装的一个公共执行事件流的方法，需要传入事件流配置，和额外参数就行了，参数后面再说。

预览一下

![image.png](./images/article-7/image-15.awebp)

# 新增请求接口动作

实现删除功能，需要按钮点击事件绑定删除接口，所以现在我们来实现一下请求接口。

先看一下配置效果

![image.png](./images/article-7/image-16.awebp)

实现请求接口的配置代码，没啥好说的，省略了。

实现请求接口方法，这里随着动作越来越多，prod文件里的代码也越来越多了，所以我这里给单独拆出来了一个文件（`src/editor/utils/action.ts`），存放动作实现的方法。

![image.png](./images/article-7/image-17.awebp)

这里讲解一下`eventData`和`initEventData`这两个参数。

`eventData`是当前事件的参数，就是事件流中间事件产生的参数。

`initEventData`是初始事件的参数，也就是开始事件的参数。

开始事件的`eventData`和_initEventData_是同一个。

![image.png](./images/article-7/image-18.awebp)

这里`record`对应的就是`eventData`和`initEventData`

上面配置中`{initEventData.id}`是为了把当前点击行的id传给后端删除当前数据。

# 增加确认框动作

为了防止误删除，在删除数据的时候，加一个确认操作。

配置和实现比较简单，就不详细说了。

# 删除功能演示

![Kapture 2023-11-20 at 22.32.00.gif](./images/article-7/image-19.awebp)

# 表单支持设置默认值

因为要实现编辑功能，表单需要支持设置默认值。

![image.png](./images/article-7/image-20.awebp)

![image.png](./images/article-7/image-21.awebp)

![Kapture 2023-11-20 at 22.46.38.gif](./images/article-7/image-22.awebp)

## 表单校验

一般的表格都会有一些校验规则，这里先实现一个简单的必输校验。

form-item配置里添加校验属性

![image.png](./images/article-7/image-23.awebp)

![image.png](./images/article-7/image-24.awebp)

使用antd的form-item组件rules属性实现必输功能

![image.png](./images/article-7/image-25.awebp)

![image.png](./images/article-7/image-26.awebp)

## 给表单添加校验通过事件

![image.png](./images/article-7/image-27.awebp)

![image.png](./images/article-7/image-28.awebp)

这样可以在校验通过事件中拿到表单的值，调用接口去新增数据或更新数据。

# 视频演示

## 表格搜索

![](./images/article-7/image-29.awebp)

## 新建数据

![](./images/article-7/image-30.awebp)

## 删除数据

![](./images/article-7/image-31.awebp)

## 编辑数据

![](./images/article-7/image-32.awebp)

# 最后

低代码基础知识详解就到这里了，后面会在[fluxy-admin](https://juejin.cn/column/7233324859932393528 "https://juejin.cn/column/7233324859932393528")中完善前面实现的低代码功能，最终实现一个企业级低代码平台。如果文章对你有帮助，麻烦给个赞吧，谢谢了。

新增的代码放在[feature-231121](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fdbfu%2Flowcode-demo%2Ftree%2Ffeature-231121 "https://github.com/dbfu/lowcode-demo/tree/feature-231121")分支

demo体验地址：[dbfu.github.io/lowcode-dem…](https://link.juejin.cn?target=https%3A%2F%2Fdbfu.github.io%2Flowcode-demo%2F "https://dbfu.github.io/lowcode-demo/")

demo仓库地址：[github.com/dbfu/lowcod…](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fdbfu%2Flowcode-demo "https://github.com/dbfu/lowcode-demo")