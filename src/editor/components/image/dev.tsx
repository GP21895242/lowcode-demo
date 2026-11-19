import React from "react";

import type { CommonComponentProps } from "../../interface";
import { toNumber } from "../_shared/control";

const DEFAULT_SRC =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20abstract%20gradient%20banner%20background%2C%20soft%20light%2C%20modern%20clean&image_size=landscape_4_3";

function ImageDev({ _id, src, alt, height, fit, radius }: CommonComponentProps) {
  const imageSrc = src || DEFAULT_SRC;

  return (
    <div data-component-id={_id}>
      <img
        src={imageSrc}
        alt={alt ?? ""}
        className="pointer-events-none w-full"
        style={{
          height: toNumber(height, 240),
          objectFit: (fit || "cover") as React.CSSProperties["objectFit"],
          borderRadius: toNumber(radius, 8),
        }}
      />
    </div>
  );
}

export default ImageDev;
