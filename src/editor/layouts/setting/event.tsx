import { useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCardTemplate } from "../../card-template/store";
import { ItemType } from "../../item-type";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";
import FlowEvent from "../flow-event";

const ComponentEvent = () => {
  const { curComponent, curComponentId, updateComponentProps } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();
  const isCardInstance = curComponent?.name === ItemType.CardInstance;
  const template = useCardTemplate(isCardInstance ? curComponent?.props?.templateId : undefined);

  const [open, setOpen] = useState(false);
  const [eventName, setEventName] = useState("");

  const flowEventRef = useRef<any>(null);

  function save() {
    if (!curComponentId) return;

    const value = flowEventRef.current?.save();

    updateComponentProps(curComponentId, {
      [eventName]: value,
    });

    setOpen(false);
  }

  if (!curComponent) return null;

  const events = isCardInstance
    ? (template?.contract.events ?? []).map((event) => ({
        name: event.name,
        desc: event.label || event.name,
      }))
    : componentConfig[curComponent.name]?.events || [];

  return (
    <div className="pt-2">
      <Accordion multiple defaultValue={events.map((event: any) => event.name)}>
        {events.map((event: any) => (
          <AccordionItem key={event.name} value={event.name}>
            <AccordionTrigger>{event.desc}</AccordionTrigger>
            <AccordionContent>
              <div className="text-center">
                <Button
                  onClick={() => {
                    setEventName(event.name);
                    setOpen(true);
                  }}
                >
                  设置事件流
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="gap-0 p-0"
          style={{ width: "100vw", maxWidth: "100vw" }}
        >
          <SheetHeader>
            <SheetTitle>设置事件流</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            <FlowEvent flowData={curComponent?.props?.[eventName]} ref={flowEventRef} />
          </div>
          <SheetFooter>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
              >
                取消
              </Button>
              <Button onClick={save}>保存</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ComponentEvent;
