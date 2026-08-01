import { createComponent } from "@react-factory/create-component";

type TextProps = {
  tone: string;
};

export const Text = createComponent<TextProps>()({
  element: "p",
  Render: (Component, { tone, ...props }) => (
    <Component data-tone={tone} {...props} />
  ),
});

Text.displayName = "Text";
