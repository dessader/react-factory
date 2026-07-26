import { createComponent } from "@react-forge/core";

type TextProps = {
  tone: string;
};

export const Text = createComponent<TextProps>()({
  element: "p",
  Render: (Component, { tone, ...rest }) => (
    <Component data-tone={tone} {...rest} />
  ),
});

Text.displayName = "Text";
