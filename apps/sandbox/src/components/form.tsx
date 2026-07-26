import { createStrictComponent } from "@/lib/create-component";

export const Form = createStrictComponent()({
  element: "form",
  Render: (Component, props) => <Component {...props} />,
});

Form.displayName = "Form";
