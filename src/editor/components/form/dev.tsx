import { Form as AntdForm, Input } from "antd";
import React, { useMemo } from "react";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function Form({ _id, _name, children, onSearch }: CommonComponentProps) {
  const [form] = AntdForm.useForm();

  const { canDrop, drop } = useDrop(_id, _name);

  const searchItems = useMemo(() => {
    return React.Children.map(children, (item: any) => {
      return {
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        id: item.props?._id,
      };
    });
  }, [children]);

  const search = (values: any) => {
    onSearch?.(values);
  };

  if (!children?.length) {
    return (
      <div
        data-component-id={_id}
        // @ts-expect-error ConnectDropTarget type mismatch
        ref={drop}
        className="p-[16px] flex justify-center"
        style={{ border: canDrop ? "1px solid #ccc" : "none" }}
      >
        暂无内容
      </div>
    );
  }

  return (
    <div
      className="w-[100%] py-[20px]"
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      data-component-id={_id}
      style={{ border: canDrop ? "1px solid #ccc" : "none" }}
    >
      <AntdForm labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} form={form} onFinish={search}>
        {searchItems.map((item: any) => {
          return (
            <AntdForm.Item
              key={item.name}
              data-component-id={item.id}
              name={item.name}
              label={item.label}
            >
              <Input />
            </AntdForm.Item>
          );
        })}
      </AntdForm>
    </div>
  );
}

export default Form;
