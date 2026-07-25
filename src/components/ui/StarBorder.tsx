import React from "react";
import "./StarBorder.css";

export interface StarBorderProps<T extends React.ElementType = "button"> {
  as?: T;
  color?: string;
  speed?: string;
  thickness?: number;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: any;
}

export function StarBorder<T extends React.ElementType = "button">({
  as,
  color = "#F4B400",
  speed = "4s",
  thickness = 2,
  className = "",
  children,
  style,
  ...props
}: StarBorderProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button";

  const customStyle: React.CSSProperties & Record<string, any> = {
    "--star-color": color,
    "--star-speed": speed,
    "--star-thickness": `${thickness}px`,
    ...style,
  };

  return (
    <Component
      className={`crackspark-star-border-container ${className}`}
      style={customStyle}
      {...props}
    >
      <div className="star-border-glow" />
      <div className="star-border-star" />
      <div className="star-border-content">{children}</div>
    </Component>
  );
}

export default StarBorder;
