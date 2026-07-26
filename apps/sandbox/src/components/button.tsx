"use client";

import { useRef } from "react";
import { createComponent } from "@/lib/create-component";

type ButtonProps = {
  variant: string;
};

export const Button = createComponent<ButtonProps>()({
  element: "button",
  Render: (Component, { variant, children, ...rest }) => {
    const renderCount = useRef(0);
    renderCount.current += 1;

    return (
      <Component data-variant={variant} {...rest}>
        {children}
        <span className="render-count" suppressHydrationWarning>
          renders: {renderCount.current}
        </span>
      </Component>
    );
  },
});

Button.displayName = "Button";

// Still memoized by default, but a single component can opt out:
export const Unmemoized = createComponent()({
  memo: false,
  Render: (Component, { children, ...rest }) => {
    const renderCount = useRef(0);
    renderCount.current += 1;

    return (
      <Component {...rest}>
        {children}
        <span className="render-count" suppressHydrationWarning>
          renders: {renderCount.current}
        </span>
      </Component>
    );
  },
});

Unmemoized.displayName = "Unmemoized";
