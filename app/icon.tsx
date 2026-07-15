import { ImageResponse } from "next/og";
import { BrandBrainSvg, BRAND_ICON_BLUE } from "@/lib/constants/brand-icon-svg";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_ICON_BLUE,
          borderRadius: 10,
        }}
      >
        <BrandBrainSvg size={18} color="#ffffff" />
      </div>
    ),
    { ...size }
  );
}
