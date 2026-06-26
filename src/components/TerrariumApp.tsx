import { useEffect, useState } from "react";
import { TerrariumScene } from "@/components/scene/TerrariumScene";
import { IntroOverlay } from "@/components/ui-overlay/IntroOverlay";
import { ProphecyOverlay } from "@/components/ui-overlay/ProphecyOverlay";
import { EraRibbon, LivingPulse, MenuCorner } from "@/components/ui-overlay/HUD";
import { ChoiceCard } from "@/components/ui-overlay/ChoiceCard";
import { MythFeed } from "@/components/ui-overlay/MythFeed";
import { ToolDock } from "@/components/ui-overlay/ToolDock";
import { Narrator } from "@/components/ui-overlay/Narrator";
import { BackgroundDoodles } from "@/components/ui-overlay/BackgroundDoodles";
import { SpeedDial } from "@/components/ui-overlay/SpeedDial";
import { CuriosityPanel, CuriosityToast } from "@/components/ui-overlay/CuriosityPanel";
import { GlassOverlay } from "@/components/ui-overlay/GlassOverlay";
import { OfflineCard } from "@/components/ui-overlay/OfflineCard";
import { AmbientAudio } from "@/components/ui-overlay/AmbientAudio";
import { Hints } from "@/components/ui-overlay/Hints";
import { ComboFlash } from "@/components/ui-overlay/ComboFlash";
import { GestureSounds } from "@/components/ui-overlay/GestureSounds";
import { HowToPlay, useHowToPlay } from "@/components/ui-overlay/HowToPlay";
import { FollowedCard } from "@/components/ui-overlay/FollowedCard";


import { useWorld } from "@/game/store";

export function TerrariumApp() {
  const intro = useWorld((s) => s.intro);
  const touchLastSeen = useWorld((s) => s.touchLastSeen);
  const [mounted, setMounted] = useState(false);
  const [washGone, setWashGone] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Keep the "small world is waking" wash visible until the first WebGL
    // frames have a chance to paint — otherwise on slow connections you see
    // a beat of bare teal between mount and scene-ready.
    const t = setTimeout(() => setWashGone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  const howto = useHowToPlay();

  // Persist "last seen" so we can compute the offline gap on return.
  useEffect(() => {
    touchLastSeen();
    const onHide = () => touchLastSeen();
    const interval = setInterval(touchLastSeen, 15_000);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [touchLastSeen]);

  const activeChoiceId = useWorld((s) => s.activeChoiceId);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <BackgroundDoodles />
      {/* soft loading wash — stays painted until the scene has a chance to render */}
      {!washGone && (
        <div
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background transition-opacity duration-700"
          style={{ opacity: mounted ? 0.55 : 1 }}
        >
          <p className="terrarium-fade font-serif text-sm italic text-foreground/40">
            a small world is waking…
          </p>
        </div>
      )}
      {mounted && (
        <div className="terrarium-canvas-filter terrarium-fade absolute inset-0 z-10">
          <TerrariumScene />
        </div>
      )}



      {/* ToolDock hides while a choice is open so the card never collides with it */}
      {intro !== "gift" && intro !== "name" && !activeChoiceId && <ToolDock />}

      {intro === "done" && (
        <>
          <EraRibbon />
          <LivingPulse />
          <MenuCorner onHelp={howto.openIt} />
          <SpeedDial />
          <MythFeed />
          <ChoiceCard />
          <FollowedCard />
          <CuriosityPanel />
          <CuriosityToast />
          <Narrator />
          <GlassOverlay />
          <OfflineCard />
          <AmbientAudio />
          <Hints />
          <ComboFlash />
          <GestureSounds />
          <HowToPlay open={howto.open} onClose={howto.close} />


        </>
      )}

      <ProphecyOverlay />

      <IntroOverlay />
    </div>
  );
}
