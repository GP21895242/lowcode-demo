import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { openCardTemplateDesign } from "../../card-template/navigation";
import {
  createBlankCardTemplate,
  createCardInstanceProps,
  useCardTemplatesStore,
} from "../../card-template/store";
import ComponentItem from "../../common/component-item";
import type { ComponentConfig } from "../../interface";
import { ItemType } from "../../item-type";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";

interface MaterialProps {
  onDragging?: () => void;
  /** card 模式下只提供基础组件，避免在卡片模板内嵌套卡片实例 */
  mode?: "page" | "card";
}

const Material = ({ onDragging, mode = "page" }: MaterialProps) => {
  const { addComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();
  const templates = useCardTemplatesStore((state) => state.templates);
  const [activeTab, setActiveTab] = useState("base");
  const [createOpen, setCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  /**
   * 拖拽结束，添加组件到画布
   * @param dropResult
   */
  const onDragEnd = (dropResult: { name: string; id?: number; desc: string; props: any }) => {
    addComponent(
      {
        id: new Date().getTime(),
        name: dropResult.name,
        props: dropResult.props,
        desc: dropResult.desc,
      },
      dropResult.id,
    );
  };

  const components = useMemo(() => {
    // 加载所有组件
    const coms = Object.values(componentConfig)
      .filter((o) => !o.hiddenInMaterial)
      .map((config: ComponentConfig) => {
        return {
          name: config.name,
          description: config.desc,
          order: config.order,
        };
      });

    // 排序
    coms.sort((x, y) => x.order - y.order);
    return coms;
  }, [componentConfig]);

  function createTemplate() {
    const name = templateName.trim();
    if (!name) return;

    const template = createBlankCardTemplate(name);
    setTemplateName("");
    setCreateOpen(false);
    openCardTemplateDesign(template.id);
  }

  const baseComponents = (
    <div className="grid grid-cols-2 gap-1">
      {components.map((item) => (
        <ComponentItem onDragging={onDragging} key={item.name} onDragEnd={onDragEnd} {...item} />
      ))}
    </div>
  );

  if (mode === "card") {
    return (
      <div className="p-2">
        <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">基础组件</div>
        {baseComponents}
      </div>
    );
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(String(value))}
        className="h-full gap-0"
      >
        <TabsList
          variant="line"
          className="w-full shrink-0 justify-start rounded-none border-b border-border px-2"
        >
          <TabsTrigger value="base">基础组件</TabsTrigger>
          <TabsTrigger value="card">卡片模板</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="min-h-0 flex-1 overflow-auto p-2">
          {baseComponents}
        </TabsContent>

        <TabsContent value="card" className="min-h-0 flex-1 overflow-auto p-2">
          <Button
            variant="outline"
            className="mb-2 w-full border-dashed"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            新建卡片模板
          </Button>

          {templates.length ? (
            <div className="grid grid-cols-2 gap-1">
              {templates.map((template) => (
                <div key={template.id} className="relative">
                  <ComponentItem
                    name={ItemType.CardInstance}
                    description={template.name}
                    buildProps={() => createCardInstanceProps(template)}
                    onDragging={onDragging}
                    onDragEnd={onDragEnd}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                    title="设计卡片模板"
                    aria-label={`设计卡片模板：${template.name}`}
                    onClick={() => openCardTemplateDesign(template.id)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-1 pb-2 text-[11px] text-muted-foreground">
              暂无卡片模板，点击上方按钮开始设计
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>新建卡片模板</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="请输入模板名称"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") createTemplate();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button disabled={!templateName.trim()} onClick={createTemplate}>
              开始设计
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Material;
