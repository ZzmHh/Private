import React from "react";
import { Img, staticFile } from "remotion";

type Props = {
  height?: number;
};

export const BrandLogo: React.FC<Props> = ({ height = 120 }) => (
  <Img
    src={staticFile("fanmeng-ai-logo.png")}
    style={{ height, width: "auto", objectFit: "contain" }}
  />
);
