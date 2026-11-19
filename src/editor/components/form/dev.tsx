import { CalendarIcon } from "lucide-react";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";

function EmptyOptions() {
  return <span className="text-sm text-muted-foreground">请先在属性面板配置选项</span>;
}

function renderControl(item: any) {
  const options = normalizeOptions(item.options);

  switch (item.type) {
    case "textarea":
      return <Textarea className="pointer-events-none" disabled />;
    case "select":
      return options.length ? (
        <Select disabled items={options}>
          <SelectTrigger className="pointer-events-none w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <EmptyOptions />
      );
    case "radio-group":
      return options.length ? (
        <RadioGroup disabled className="flex flex-wrap gap-4">
          {options.map((option) => (
            <Label key={option.value} className="font-normal">
              <RadioGroupItem value={option.value} disabled />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <EmptyOptions />
      );
    case "checkbox-group":
      return options.length ? (
        <div className="flex flex-wrap gap-4">
          {options.map((option) => (
            <Label key={option.value} className="font-normal">
              <Checkbox disabled />
              {option.label}
            </Label>
          ))}
        </div>
      ) : (
        <EmptyOptions />
      );
    case "date":
      return (
        <Button
          variant="outline"
          className="pointer-events-none w-full justify-start font-normal text-muted-foreground"
          disabled
        >
          <CalendarIcon />
          请选择日期
        </Button>
      );
    default:
      return <Input className="pointer-events-none flex-1" disabled />;
  }
}

function FormDev({ _id, _name, labelPosition, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);
  const labelOnTop = labelPosition === "top";

  const formItems = useMemo(() => {
    return (
      React.Children.map(children, (item: any) => ({
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        options: item.props?.options,
        id: item.props?._id,
      })) || []
    );
  }, [children]);

  if (!children?.length) {
    return (
      <div
        data-component-id={_id}
        // @ts-expect-error ConnectDropTarget type mismatch
        ref={drop}
        className="flex justify-center p-[16px]"
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
      <div className="flex flex-col gap-4">
        {formItems.map((item: any) => (
          <div
            key={item.id ?? item.name}
            className={labelOnTop ? "flex flex-col gap-2" : "flex items-center gap-3"}
            data-component-id={item.id}
          >
            <Label
              className={
                labelOnTop
                  ? "text-sm font-normal text-muted-foreground"
                  : "w-[92px] shrink-0 text-right text-sm font-normal text-muted-foreground"
              }
            >
              {item.label}
            </Label>
            <div className={labelOnTop ? "w-full" : "min-w-0 flex-1"}>{renderControl(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FormDev;
