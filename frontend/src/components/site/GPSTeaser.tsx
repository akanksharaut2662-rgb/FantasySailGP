import { useEffect, useState } from "react";
import { fetchRaces } from "@/lib/api";
import RaceMap from "@/components/app/RaceMap";

export function GPSTeaser() {
  const [windDeg, setWindDeg] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchRaces()
      .then((data: any[]) => {
        const r = data.find((r: any) => r.event === "Halifax" && r.race_label === "Race_1");
        if (r) setWindDeg(r.avg_twd_deg);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="race" className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
      {/* Editorial header */}
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end mb-12">
        <div>
          <p className="eyebrow">Real GPS telemetry · Halifax 2024</p>
          <h2 className="mt-4 font-display text-5xl md:text-6xl text-ink leading-[0.92]">
            This is what<br />
            <span className="italic text-teal">real data</span> looks like.
          </h2>
          <p className="mt-5 text-sm text-ink/65 max-w-md leading-relaxed">
            951 GPS fixes per boat. Ten F50 catamarans. Wind speed and direction
            measured continuously. Every fantasy pick is computed from this — not guesswork.
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex md:flex-col gap-4 md:gap-3 flex-wrap">
          {[
            { n: "951",  label: "GPS fixes / boat" },
            { n: "10",   label: "teams tracked"    },
            { n: "5",    label: "scoring categories"},
            { n: "29.2", label: "RMSE (pts)"        },
          ].map(s => (
            <div key={s.label} className="text-right">
              <div className="font-display text-3xl text-ink tabular leading-none">{s.n}</div>
              <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hairline mb-8" />

      {/* The map — loops continuously for the demo */}
      <RaceMap
        event="Halifax"
        raceLabel="Race_1"
        windDeg={windDeg}
        loop
      />

      <p className="mt-4 text-center eyebrow !text-[8px] text-muted-foreground">
        Halifax 2024 · Race 1 · Looping replay · click the bar to scrub
      </p>
    </section>
  );
}
