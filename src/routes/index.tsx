import { createFileRoute } from "@tanstack/react-router";
import { TerrariumApp } from "@/components/TerrariumApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terrarium — a small world to tend" },
      {
        name: "description",
        content:
          "A cozy tiny-planet god-game. Warm a small world to life, answer its prayers, and watch the myths the people write about you.",
      },
      { property: "og:title", content: "Terrarium — a small world to tend" },
      {
        property: "og:description",
        content:
          "A cozy tiny-planet god-game. Warm a small world, answer its prayers, watch the myths grow.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <TerrariumApp />;
}
