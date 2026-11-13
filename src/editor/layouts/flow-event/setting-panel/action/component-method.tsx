import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Field, useFieldValue } from "../../../../../components/form";
import { Button } from "../../../../../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { useComponentConfigStore } from "../../../../stores/component-config";
import { useComponetsStore } from "../../../../stores/components";
import { getComponentById } from "../../../../utils/utils";

interface FlatComponent {
  value: number;
  label: string;
  depth: number;
}

function flattenComponents(nodes: any[], depth = 0): FlatComponent[] {
  return nodes.flatMap((node) => [
    {
      value: node.id,
      label: node.desc || node.name || "",
      depth,
    },
    ...flattenComponents(node.children ?? [], depth + 1),
  ]);
}

function ComponentCombobox({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value: number) => void;
}) {
  const { components } = useComponetsStore();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => flattenComponents(components), [components]);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="truncate">{selected?.label ?? "请选择组件"}</span>
        <ChevronsUpDown className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索组件" />
          <CommandList>
            <CommandEmpty>未找到组件</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={{ paddingLeft: `${8 + option.depth * 16}px` }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const ComponentMethodSetting = () => {
  const { components } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  const componentId = useFieldValue("config.componentId");

  const component = useMemo(() => {
    if (!componentId) return undefined;
    return getComponentById(componentId, components);
  }, [componentId, components]);

  const methods = componentConfig[component?.name || ""]?.methods;
  const methodOptions = (methods ?? []).map((method: any) => ({
    label: method.desc,
    value: method.name,
  }));

  return (
    <>
      <Field name="config.componentId" label="组件">
        {({ value, onChange }) => <ComponentCombobox value={value} onChange={onChange} />}
      </Field>
      {methods?.length ? (
        <Field name="config.method" label="方法">
          {({ value, onChange }) => (
            <Select value={value} onValueChange={onChange} items={methodOptions}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      ) : null}
    </>
  );
};

export default ComponentMethodSetting;
