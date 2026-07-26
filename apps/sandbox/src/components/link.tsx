import { createPolymorphicComponent } from "@/lib/create-component";

export const Link = createPolymorphicComponent()({
  element: "a",
  Render: (Component, props) => <Component {...props} />,
});

Link.displayName = "Link";
