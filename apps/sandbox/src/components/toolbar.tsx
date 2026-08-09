import { createToolbarComponent } from "@/lib/create-component";

// Inherits the local factory's default element ("button"), without
// specifying `element` itself.
export const ToolbarButton = createToolbarComponent()({
  Render: (Component, props) => <Component {...props} />,
});

ToolbarButton.displayName = "ToolbarButton";

// Overrides the local factory's default element for this component only.
export const ToolbarLink = createToolbarComponent()({
  element: "a",
  Render: (Component, props) => <Component {...props} />,
});

ToolbarLink.displayName = "ToolbarLink";
