import React from "react";

import Styles from "./ResponsiveImage.module.css";
import { fullscreenToggle } from "@/utils/fullscreen";
import { useTranslation } from "./translation";

export interface ResponsiveImageCoreProps {
  className?: string;
  color?: string;
  type?: "background" | "vignette" | "normal";
  size?: [width: number, height: number];
}

export interface ResponsiveImageProps extends ResponsiveImageCoreProps {
  png: string;
  avif: string;
  pngMedium: string;
  avifMedium: string;
  pngSmall: string;
  avifSmall: string;
}

export default function ResponsiceImage(props: ResponsiveImageProps) {
  const [bestResolution, setBestResolution] = React.useState(false);
  const tr = useTranslation();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const typeClassName = Styles[props.type ?? "normal"];
  const handleDoubleClick = () => {
    fullscreenToggle(ref.current);
    setBestResolution(true);
  };
  const type = props.type ?? "normal";
  console.log("🚀 [ResponsiveImage] type = ", type); // @FIXME: Remove this line written on 2024-10-24 at 14:23
  return (
    <div
      ref={ref}
      className={join(props.className, Styles.responsiveimage, typeClassName)}
      style={{
        background: props.color ?? "transparent",
        aspectRatio: props.size ? `${props.size[0]} / ${props.size[1]}` : "1",
      }}
      onDoubleClick={handleDoubleClick}
      title={tr.tooltip}
    >
      <picture>
        {(bestResolution || type === "background") && (
          <>
            <source srcSet={props.avif} />
            <source srcSet={props.png} />
          </>
        )}
        {type === "vignette" && (
          <>
            <source srcSet={props.avifSmall} />
            <source srcSet={props.pngSmall} />
          </>
        )}
        {type === "normal" && (
          <>
            <source srcSet={props.avifMedium} />
            <source srcSet={props.pngMedium} />
          </>
        )}
        <img src={props.pngSmall} />
      </picture>
    </div>
  );
}

function join(...classes: unknown[]): string {
  return classes.filter((cls) => typeof cls === "string").join(" ");
}
