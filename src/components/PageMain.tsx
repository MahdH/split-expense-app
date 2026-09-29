import { ViewTransition, type ComponentProps } from "react";

const directional = { "nav-forward": "nav-forward", "nav-back": "nav-back" } as const;

// The <main> of every page. Wrapping it in a ViewTransition makes each route change
// animate: links tagged with `transitionTypes` slide forward/back, and any other
// navigation (redirects after a form, the browser back button) gets a soft fade-rise.
// The animations themselves live in globals.css (`::view-transition-*`).
export function PageMain({ children, ...props }: ComponentProps<"main">) {
  return (
    <ViewTransition
      enter={{ ...directional, default: "page-in" }}
      exit={{ ...directional, default: "page-out" }}
      default="none"
    >
      <main {...props}>{children}</main>
    </ViewTransition>
  );
}
