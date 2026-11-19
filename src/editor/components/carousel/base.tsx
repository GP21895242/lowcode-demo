import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../../../components/ui/carousel";
import { cn } from "../../../lib/utils";
import type { CommonComponentProps } from "../../interface";

interface CarouselBaseProps extends CommonComponentProps {
  /** 编辑态：新增内容时自动切换到最新一屏 */
  editable?: boolean;
}

const DEFAULT_HEIGHT = 240;
const DEFAULT_SPACING = 16;
const MAX_SIZES = 4;

function toPositiveNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function toAlign(value: unknown): "start" | "center" | "end" {
  return value === "center" || value === "end" ? value : "start";
}

function CarouselBase({
  sizes,
  spacing,
  orientation,
  align,
  loop,
  children,
  editable = false,
}: CarouselBaseProps) {
  const slides = useMemo(
    () => React.Children.toArray(children).filter((child) => React.isValidElement(child)),
    [children],
  );
  const childCount = slides.length;

  const [api, setApi] = useState<CarouselApi>();

  const orientationValue = orientation === "vertical" ? "vertical" : "horizontal";
  const isVertical = orientationValue === "vertical";
  const sizesValue = Math.min(MAX_SIZES, Math.max(1, Math.round(toPositiveNumber(sizes, 1))));
  const spacingPx = Math.max(0, Math.round(toNonNegativeNumber(spacing, DEFAULT_SPACING)));

  // 透传给 shadcn Carousel（Embla）的可配置选项
  const options = useMemo(
    () => ({
      loop: toBoolean(loop) && childCount > 1,
      align: toAlign(align),
      axis: isVertical ? ("y" as const) : ("x" as const),
    }),
    [align, childCount, isVertical, loop],
  );

  const itemStyle: React.CSSProperties = {
    flexBasis: `${100 / sizesValue}%`,
    ...(isVertical ? { paddingTop: spacingPx } : { paddingLeft: spacingPx }),
  };

  // 配置、尺寸或子项变化后重新初始化 Embla
  useEffect(() => {
    if (!api) return;

    api.reInit(options);
  }, [api, childCount, options, sizesValue, spacingPx]);

  // 编辑态拖入新子项后自动切换到最新一屏
  const prevChildCountRef = useRef(childCount);
  useEffect(() => {
    const prevCount = prevChildCountRef.current;
    prevChildCountRef.current = childCount;

    if (!api || !editable) return;
    if (childCount > prevCount && childCount > 0) {
      api.scrollTo(childCount - 1);
    }
  }, [api, childCount, editable]);

  function renderContent() {
    if (!childCount) {
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {editable ? "拖入组件作为轮播内容" : "暂无内容"}
        </div>
      );
    }

    return (
      <CarouselContent
        className={cn("h-full", isVertical ? "mt-0" : "ml-0")}
        style={isVertical ? { marginTop: -spacingPx } : { marginLeft: -spacingPx }}
      >
        {slides.map((slide, slideIndex) => (
          <CarouselItem
            key={(slide as React.ReactElement).key ?? slideIndex}
            className="overflow-auto"
            style={itemStyle}
          >
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>
    );
  }

  return (
    <Carousel
      setApi={setApi}
      orientation={orientationValue}
      opts={options}
      className={cn(
        "w-full overflow-hidden rounded-md border border-border bg-muted/20",
        "[&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full",
      )}
      style={{ height: DEFAULT_HEIGHT }}
    >
      {renderContent()}

      {childCount > 1 ? (
        <>
          <CarouselPrevious
            className={cn(
              "border-border bg-background/80 shadow-sm",
              isVertical ? "top-2" : "left-2",
            )}
          />
          <CarouselNext
            className={cn(
              "border-border bg-background/80 shadow-sm",
              isVertical ? "bottom-2" : "right-2",
            )}
          />
        </>
      ) : null}
    </Carousel>
  );
}

export default CarouselBase;
