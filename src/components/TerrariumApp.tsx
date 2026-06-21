import { useEffect, useState } from "react";
import { TerrariumScene } from "@/components/scene/TerrariumScene";
import { IntroOverlay } from "@/components/ui-overlay/IntroOverlay";
import { EraRibbon, LivingPulse, MenuCorner } from "@/components/ui-overlay/HUD";
import { ChoiceCard } from "@/components/ui-overlay/ChoiceCard";
import { MythFeed } from "@/components/ui-overlay/MythFeed";
import { ToolDock } from "@/components/ui-overlay/ToolDock";
import { Narrator } from "@/components/ui-overlay/Narrator";
import { BackgroundDoodles } from "@/components/ui-overlay/BackgroundDoodles";
import { useWorld } from "@/game/store";

export function TerrariumApp() {
  const intro = useWorld((s) => s.intro);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <BackgroundDoodles />
      {mounted && (
        <div className="absolute inset-0 z-10">
          <TerrariumScene />
        </div>
      )}

      {intro === "done" && (
        <>
          <EraRibbon />
          <LivingPulse />
          <MenuCorner />
          <MythFeed />
          <ChoiceCard />
          <ToolDock />
          <Narrator />
        </>
      )}

      <IntroOverlay />
    </div>
  );
}
