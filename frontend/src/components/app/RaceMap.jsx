import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fetchGPS } from "../../lib/api";

const TEAM_COLORS = {
  AUS: "oklch(0.62 0.11 75)",
  NZL: "oklch(0.22 0.02 220)",
  GBR: "oklch(0.38 0.09 248)",
  FRA: "oklch(0.44 0.11 258)",
  ESP: "oklch(0.50 0.14 24)",
  USA: "oklch(0.46 0.13 20)",
  ITA: "oklch(0.44 0.11 148)",
  CAN: "oklch(0.50 0.13 22)",
  DEN: "oklch(0.44 0.10 242)",
  SUI: "oklch(0.50 0.11 26)",
  BRA: "oklch(0.58 0.12 128)",
  SWE: "oklch(0.50 0.09 258)",
  GER: "oklch(0.52 0.09 78)",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const SVG_W = 800;
const SVG_H = 480;
const TOTAL_TICKS = 420;  // longer timeline → boats move at perceptible pace
const TICK_MS = 70;       // 70ms × 420 ticks = 29.4s total replay

// F50 catamaran top-down silhouette — two hulls + crossbeams + wing sail
// All pointing north (bow at top). Rotate by heading at render time.
function CatamaranShape({ color, isLeader }) {
  const wingFill = isLeader ? "oklch(0.96 0.06 80)" : "oklch(0.94 0.01 215)";
  const wingStroke = isLeader ? "oklch(0.80 0.18 80)" : "rgba(255,255,255,0.6)";
  const wingStrokeW = isLeader ? "1.3" : "0.5";
  return (
    <>
      {/* Port hull — narrow teardrop pointing bow-up */}
      <path
        d="M -5.5,-10 C -6.5,-5 -6.5,4.5 -5.5,8.5 L -4,8.5 C -4.5,4.5 -4.5,-5 -5.5,-10 Z"
        fill={color}
        opacity="0.95"
      />
      {/* Starboard hull */}
      <path
        d="M 5.5,-10 C 6.5,-5 6.5,4.5 5.5,8.5 L 4,8.5 C 4.5,4.5 4.5,-5 5.5,-10 Z"
        fill={color}
        opacity="0.95"
      />
      {/* Forward crossbeam */}
      <rect x="-5.5" y="-5.5" width="11" height="1.6" rx="0.5" fill={color} />
      {/* Aft crossbeam */}
      <rect x="-5.5" y="3.5" width="11" height="1.6" rx="0.5" fill={color} />
      {/* Wing sail — the distinctive F50 signature element */}
      <rect
        x="-2.2" y="-8" width="4.4" height="13"
        rx="1.5"
        fill={wingFill}
        stroke={wingStroke}
        strokeWidth={wingStrokeW}
      />
    </>
  );
}

// Precomputed wave lines — zero per-render cost, slightly muted for nautical chart feel
const WATER_WAVES = Array.from({ length: 5 }, (_, i) => {
  const y = SVG_H * (0.14 + i * 0.18);
  const amp = 1.2 + i * 0.35;
  return Array.from({ length: Math.floor(SVG_W / 12) + 1 }, (__, xi) => {
    const x = xi * 12;
    const wy = y + amp * Math.sin((x / SVG_W) * Math.PI * (3.2 + i * 0.6) + i * 1.1);
    return `${x},${wy.toFixed(1)}`;
  }).join(" ");
});

function buildProjection(tracks) {
  const lats = tracks.flatMap(t => t.lat);
  const lons = tracks.flatMap(t => t.lon);
  if (!lats.length) return null;
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const padLat = (maxLat - minLat) * 0.12;
  const padLon = (maxLon - minLon) * 0.12;
  const spanLat = maxLat - minLat + 2 * padLat;
  const spanLon = maxLon - minLon + 2 * padLon;
  return {
    toX: (lon) => ((lon - minLon + padLon) / spanLon) * SVG_W,
    toY: (lat) => ((maxLat + padLat - lat) / spanLat) * SVG_H,
  };
}

function projectTrack(track, toX, toY) {
  return track.lat.map((lat, i) => [toX(track.lon[i]), toY(lat)]);
}

// Linearly interpolate between two SVG points
function lerpPt(pts, exactIdx) {
  const lo = Math.floor(exactIdx);
  const hi = Math.min(lo + 1, pts.length - 1);
  const t = exactIdx - lo;
  const [x0, y0] = pts[lo];
  const [x1, y1] = pts[hi];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
}

export default function RaceMap({ event = "Halifax", raceLabel = "Race_1", windDeg, loop = false }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const [leadFlash, setLeadFlash] = useState(null);
  const intervalRef = useRef(null);
  const autoPlayedRef = useRef(false);
  const startPlayingRef = useRef(null);
  const prevLeaderRef = useRef(null);
  const prevRankRef = useRef({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTick(0);
    setPlaying(false);
    autoPlayedRef.current = false;
    clearInterval(intervalRef.current);

    fetchGPS(event, raceLabel)
      .then(data => {
        setTracks(data.filter(t => t.lat?.length > 10));
        setLoading(false);
      })
      .catch(() => {
        setError("GPS data unavailable.");
        setLoading(false);
      });
  }, [event, raceLabel]);

  const startPlaying = useCallback(() => {
    clearInterval(intervalRef.current);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setTick(t => {
        if (t >= TOTAL_TICKS) {
          if (loop) {
            clearInterval(intervalRef.current);
            setPlaying(false);
            setTimeout(() => {
              setTick(0);
              // Directly schedule restart — don't rely on effect re-firing
              setTimeout(() => {
                autoPlayedRef.current = false;
                startPlayingRef.current();
              }, 200);
            }, 1800);
            return TOTAL_TICKS;
          }
          clearInterval(intervalRef.current);
          setPlaying(false);
          return TOTAL_TICKS;
        }
        return t + 1;
      });
    }, TICK_MS);
  }, [loop]);

  // Keep ref in sync so the loop-restart closure always calls the latest version
  startPlayingRef.current = startPlaying;

  // Auto-play once on load
  useEffect(() => {
    if (!loading && tracks.length > 0 && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      const timer = setTimeout(startPlaying, loop ? 200 : 600);
      return () => clearTimeout(timer);
    }
  }, [loading, tracks.length, startPlaying, loop]);

  const togglePlay = useCallback(() => {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      if (tick >= TOTAL_TICKS) setTick(0);
      startPlaying();
    }
  }, [playing, tick, startPlaying]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setPlaying(false);
    setTick(0);
  }, []);

  const scrub = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    clearInterval(intervalRef.current);
    setPlaying(false);
    setTick(Math.round(ratio * TOTAL_TICKS));
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // ── All derived state (must be before early returns) ──

  const proj = useMemo(() => tracks.length ? buildProjection(tracks) : null, [tracks]);

  const processed = useMemo(() => {
    if (!proj || !tracks.length) return [];
    const { toX, toY } = proj;
    return tracks.map(track => {
      const allPts = projectTrack(track, toX, toY);
      const n = allPts.length;
      const exactIdx = (tick / TOTAL_TICKS) * (n - 1);
      const [cx, cy] = lerpPt(allPts, exactIdx);
      const dotIdx = Math.floor(exactIdx);
      const prevExact = Math.max(0, ((tick - 6) / TOTAL_TICKS) * (n - 1));
      const [px, py] = lerpPt(allPts, prevExact);
      const heading = (Math.abs(px - cx) < 0.01 && Math.abs(py - cy) < 0.01)
        ? 0 : Math.atan2(cx - px, py - cy) * 180 / Math.PI;
      const tLen = track.time_s?.length ?? 0;
      const tIdx = tLen > 1 ? Math.min(Math.floor((tick / TOTAL_TICKS) * tLen), tLen - 1) : 0;
      return {
        team: track.team,
        color: TEAM_COLORS[track.team] ?? "var(--teal)",
        cx, cy, heading,
        timeS: track.time_s?.[tIdx] ?? 0,
        progress: exactIdx / Math.max(1, n - 1),
        trail:     allPts.slice(0, dotIdx + 1).filter((_, i) => i % 4 === 0),
        wakeLong:  allPts.slice(Math.max(0, dotIdx - 70), dotIdx + 1).filter((_, i) => i % 2 === 0),
        wakeShort: allPts.slice(Math.max(0, dotIdx - 18), dotIdx + 1),
      };
    });
  }, [tracks, tick, proj]);

  const ranked = useMemo(() =>
    [...processed].sort((a, b) => b.progress - a.progress),
    [processed]
  );
  const leader = ranked[0]?.team ?? null;

  // Lead-change flash — depends only on leader, NOT tick
  // (tick in deps would cancel the 2200ms timeout on every 70ms tick)
  useEffect(() => {
    if (!leader) return;
    if (prevLeaderRef.current && prevLeaderRef.current !== leader) {
      setLeadFlash(leader);
      prevLeaderRef.current = leader;
      const t = setTimeout(() => setLeadFlash(null), 2200);
      return () => clearTimeout(t);
    }
    prevLeaderRef.current = leader;
  }, [leader]);

  // Snapshot rank positions every 15 ticks (side effect must be in useEffect, not useMemo)
  useEffect(() => {
    if (tick % 15 === 0 && ranked.length > 0) {
      prevRankRef.current = Object.fromEntries(ranked.map((p, i) => [p.team, i]));
    }
  }, [tick, ranked]);

  // Position-change deltas (▲▼) — pure computation reading the ref
  const rankChanges = useMemo(() => {
    const cur = Object.fromEntries(ranked.map((p, i) => [p.team, i]));
    const prev = prevRankRef.current;
    const changes = {};
    for (const [team, rank] of Object.entries(cur)) {
      changes[team] = (prev[team] ?? rank) - rank;
    }
    return changes;
  }, [ranked]);

  // Battle detection — boats within 32px
  const battles = useMemo(() => {
    if (tick < 10) return [];
    const pairs = [];
    for (let i = 0; i < processed.length; i++) {
      for (let j = i + 1; j < processed.length; j++) {
        const a = processed[i], b = processed[j];
        const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        if (d < 32 && d > 1) pairs.push({ a, b });
      }
    }
    return pairs;
  }, [processed, tick]);

  const timeS = processed[0]?.timeS ?? 0;
  const timeLabel = `+${String(Math.floor(timeS / 60)).padStart(2, "0")}:${String(Math.floor(timeS % 60)).padStart(2, "0")}`;
  const progress = (tick / TOTAL_TICKS) * 100;

  // ── Early returns (after all hooks) ──
  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div style={{ aspectRatio: `${SVG_W}/${SVG_H}` }} className="flex items-center justify-center bg-[oklch(0.82_0.04_210)]">
          <p className="eyebrow animate-pulse">Fetching GPS tracks…</p>
        </div>
      </div>
    );
  }

  if (error || !tracks.length) {
    return (
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div style={{ aspectRatio: `${SVG_W}/${SVG_H}` }} className="flex items-center justify-center bg-[oklch(0.82_0.04_210)]">
          <p className="eyebrow text-muted-foreground">{error ?? "No GPS data for this race."}</p>
        </div>
      </div>
    );
  }

  if (!proj) return null;

  return (
    <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <p className="eyebrow !text-[9px]">{event} · {raceLabel.replace("_", " ")} · GPS Replay</p>
        <div className="flex items-center gap-5">
          {/* Team legend */}
          <div className="hidden sm:flex flex-wrap gap-3 max-w-sm">
            {processed.map(p => (
              <span key={p.team} className="flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full inline-block" style={{ background: p.color }} />
                <span className="font-mono text-[9px] text-ink/60">{p.team}</span>
              </span>
            ))}
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={reset} title="Reset"
              className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:border-teal/40 transition-colors">
              <svg className="h-3 w-3 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button onClick={togglePlay} title={playing ? "Pause" : "Play"}
              className="h-8 w-8 rounded-full border border-gold/50 bg-background flex items-center justify-center hover:border-gold hover:bg-gold/5 transition-colors">
              {playing ? (
                <svg className="h-3 w-3 text-gold" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5 text-gold ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SVG canvas — aspect-ratio wrapper prevents height changes from affecting page layout */}
      <div style={{ position: "relative", aspectRatio: `${SVG_W}/${SVG_H}`, overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", overflow: "hidden" }}
        >
          <defs>
            {/* Muted nautical-chart water — less vivid than previous, more sophisticated */}
            <linearGradient id="rm-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="oklch(0.77 0.055 210)" />
              <stop offset="60%"  stopColor="oklch(0.82 0.04 210)" />
              <stop offset="100%" stopColor="oklch(0.87 0.03 210)" />
            </linearGradient>
            {/* Leader boat glow */}
            <filter id="rm-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Soft wake glow */}
            <filter id="rm-wake" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Water */}
          <rect width={SVG_W} height={SVG_H} fill="url(#rm-water)" />

          {/* Wave texture */}
          {WATER_WAVES.map((pts, i) => (
            <polyline key={i} points={pts} fill="none"
              stroke="oklch(0.90 0.025 210)" strokeWidth="0.55"
              opacity={0.18 + i * 0.04} />
          ))}

          {/* Nautical chart grid */}
          {[1,2,3,4,5,6].map(i => (
            <line key={`hg${i}`} x1="0" y1={SVG_H * i / 7} x2={SVG_W} y2={SVG_H * i / 7}
              stroke="oklch(0.90 0.025 210)" strokeWidth="0.4" opacity="0.3" strokeDasharray="5,13" />
          ))}
          {[1,2,3,4,5,6,7,8].map(i => (
            <line key={`vg${i}`} x1={SVG_W * i / 9} y1="0" x2={SVG_W * i / 9} y2={SVG_H}
              stroke="oklch(0.90 0.025 210)" strokeWidth="0.4" opacity="0.3" strokeDasharray="5,13" />
          ))}

          {/* ── Wake layers (back to front, no full-course ghost) ── */}

          {/* Revealed trail */}
          {processed.map(p => p.trail.length > 1 && (
            <polyline key={`tr-${p.team}`}
              points={p.trail.map(pt => pt.join(",")).join(" ")}
              fill="none" stroke={p.color} strokeWidth="1.5"
              strokeOpacity="0.22" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* Long wake */}
          {processed.map(p => p.wakeLong.length > 1 && (
            <polyline key={`wl-${p.team}`}
              points={p.wakeLong.map(pt => pt.join(",")).join(" ")}
              fill="none" stroke={p.color} strokeWidth="2.5"
              strokeOpacity="0.38" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* Short wake — bright + glow */}
          {processed.map(p => p.wakeShort.length > 1 && (
            <polyline key={`ws-${p.team}`}
              points={p.wakeShort.map(pt => pt.join(",")).join(" ")}
              fill="none" stroke={p.color} strokeWidth="3.5"
              strokeOpacity="0.80" strokeLinecap="round" strokeLinejoin="round"
              filter="url(#rm-wake)" />
          ))}

          {/* ── Battle proximity lines ── */}
          {battles.map((bt, i) => (
            <line key={`bt-${i}`}
              x1={bt.a.cx} y1={bt.a.cy} x2={bt.b.cx} y2={bt.b.cy}
              stroke="var(--gold)" strokeWidth="1.2"
              strokeOpacity="0.45" strokeDasharray="3,4" />
          ))}
          {/* "BATTLE" label at midpoint of each pair */}
          {battles.slice(0, 2).map((bt, i) => {
            const mx = (bt.a.cx + bt.b.cx) / 2;
            const my = (bt.a.cy + bt.b.cy) / 2 - 8;
            return (
              <text key={`btl-${i}`} x={mx} y={my}
                textAnchor="middle" fontSize="7" fontFamily="JetBrains Mono, monospace"
                fontWeight="700" letterSpacing="0.14em"
                fill="oklch(0.68 0.18 80)" opacity="0.9">
                BATTLE
              </text>
            );
          })}

          {/* ── Boats ── */}
          {processed.map(p => {
            const isLeader = p.team === leader && tick > 5;
            return (
              <g key={`boat-${p.team}`}>
                {/* Leader pulse rings */}
                {isLeader && (
                  <>
                    <circle cx={p.cx} cy={p.cy} r="10" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity="0">
                      <animate attributeName="r" from="10" to="28" dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.65" to="0" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={p.cx} cy={p.cy} r="10" fill="none" stroke="var(--gold)" strokeWidth="0.7" opacity="0">
                      <animate attributeName="r" from="10" to="28" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Catamaran — leader is 1.4× larger */}
                <g
                  transform={`translate(${p.cx.toFixed(2)},${p.cy.toFixed(2)}) rotate(${p.heading.toFixed(1)})${isLeader ? " scale(1.4)" : ""}`}
                  filter={isLeader ? "url(#rm-glow)" : undefined}
                >
                  <CatamaranShape color={p.color} isLeader={isLeader} />
                </g>

                {/* Team label */}
                {tick > 3 && (
                  <text
                    x={p.cx + (isLeader ? 20 : 15)} y={p.cy + 4}
                    fontSize={isLeader ? "11" : "8.5"}
                    fill={isLeader ? "oklch(0.68 0.18 80)" : "oklch(0.22 0.035 215)"}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isLeader ? "700" : "400"}
                    letterSpacing="0.06em"
                    opacity={isLeader ? "1" : "0.72"}>
                    {p.team}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Live leaderboard (top-left) — colored dots + gap ── */}
          {tick > 20 && (() => {
            const rows = ranked.slice(0, 5);
            const cardH = rows.length * 22 + 22;
            const cardW = 118;
            return (
              <g transform="translate(12,12)">
                <rect x="0" y="0" width={cardW} height={cardH}
                  rx="3" fill="oklch(0.96 0.01 215)" opacity="0.93" />
                <rect x="0" y="0" width={cardW} height={cardH}
                  rx="3" fill="none" stroke="oklch(0.82 0.03 215)" strokeWidth="0.6" opacity="0.5" />
                {/* Gold header strip */}
                <rect x="0" y="0" width={cardW} height="16" rx="2"
                  fill="oklch(0.72 0.14 80)" opacity="0.18" />
                <text x={cardW / 2} y="11" textAnchor="middle"
                  fontSize="6" fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.18em" fill="oklch(0.45 0.10 80)" opacity="0.9">
                  LEADERBOARD
                </text>

                {rows.map((p, i) => {
                  const gap = ranked[0].progress - p.progress;
                  const gapStr = i === 0 ? "LEAD" : `+${(gap * 100).toFixed(1)}%`;
                  const delta = rankChanges[p.team] ?? 0;
                  const isLead = i === 0;
                  return (
                    <g key={p.team} transform={`translate(6, ${18 + i * 22})`}>
                      {/* Colored boat dot */}
                      <circle cx="5" cy="4" r="4.5" fill={p.color} opacity={isLead ? "1" : "0.75"} />
                      {/* Rank roman */}
                      <text x="15" y="8" fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill={isLead ? "oklch(0.60 0.16 80)" : "oklch(0.30 0.03 215)"}
                        fontWeight={isLead ? "700" : "500"}
                        opacity={i > 2 ? "0.55" : "1"}>
                        {ROMAN[i]}
                      </text>
                      {/* Team code */}
                      <text x="34" y="8" fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill="oklch(0.20 0.02 215)"
                        fontWeight={isLead ? "600" : "400"}
                        opacity={i > 2 ? "0.55" : "1"}>
                        {p.team}
                      </text>
                      {/* Gap to leader */}
                      <text x={cardW - 12} y="8" textAnchor="end" fontSize="7.5"
                        fontFamily="JetBrains Mono, monospace"
                        fill={isLead ? "oklch(0.60 0.16 80)" : "oklch(0.48 0.03 215)"}
                        opacity={i > 2 ? "0.45" : "0.85"}>
                        {gapStr}
                      </text>
                      {/* Position change arrow */}
                      {delta !== 0 && (
                        <text x="28" y="8" fontSize="7"
                          fill={delta > 0 ? "oklch(0.52 0.14 145)" : "oklch(0.50 0.14 25)"}
                          opacity="0.85">
                          {delta > 0 ? "▲" : "▼"}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ── Lead-change flash ── */}
          {leadFlash && (
            <g transform={`translate(${SVG_W / 2},${SVG_H / 2 - 16})`}>
              <rect x="-72" y="-18" width="144" height="34" rx="4"
                fill="oklch(0.72 0.14 80)" opacity="0.92" />
              <text x="0" y="-2" textAnchor="middle"
                fontSize="8" fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.22em" fill="oklch(0.14 0.02 215)" opacity="0.7">
                LEAD CHANGE
              </text>
              <text x="0" y="12" textAnchor="middle"
                fontSize="14" fontFamily="JetBrains Mono, monospace"
                fontWeight="700" letterSpacing="0.15em" fill="oklch(0.14 0.02 215)">
                {leadFlash} TAKES P1
              </text>
            </g>
          )}

          {/* ── Race clock (bottom-left) ── */}
          {tick > 0 && timeS > 0 && (
            <text x="14" y={SVG_H - 14}
              fontSize="11" fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.1em" fill="oklch(0.24 0.035 215)" opacity="0.45">
              {timeLabel}
            </text>
          )}

          {/* ── Wind compass (top-right) ── */}
          {windDeg !== undefined && (
            <g transform={`translate(${SVG_W - 44},44)`}>
              <circle r="28" fill="oklch(0.88 0.025 210)" opacity="0.85" />
              <circle r="28" fill="none" stroke="oklch(0.78 0.04 210)" strokeWidth="0.6" opacity="0.6" />
              <line x1="0" y1="23" x2="0" y2="-23"
                stroke="oklch(0.72 0.04 210)" strokeWidth="0.5" opacity="0.4" />
              <line x1="-23" y1="0" x2="23" y2="0"
                stroke="oklch(0.72 0.04 210)" strokeWidth="0.5" opacity="0.4" />
              <text x="0" y="-19" textAnchor="middle" fontSize="5.5"
                fill="oklch(0.30 0.035 215)" opacity="0.6"
                fontFamily="Inter, sans-serif" letterSpacing="0.18em">N</text>
              <g transform={`rotate(${windDeg})`}>
                <path d="M 0,-21 L 5,7 L 0,3 L -5,7 Z" fill="var(--teal)" opacity="0.9" />
              </g>
              <text x="0" y="37" textAnchor="middle" fontSize="6.5"
                fill="oklch(0.30 0.035 215)" opacity="0.65"
                fontFamily="JetBrains Mono, monospace">WIND</text>
            </g>
          )}
        </svg>

        {/* Clickable progress scrubber */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 bg-border/20 cursor-pointer group"
          onClick={scrub}
          title="Click to scrub"
        >
          <div
            className="h-full bg-gold/70 group-hover:bg-gold transition-colors"
            style={{ width: `${progress}%`, transition: "none" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground">
          {tracks.length} teams · real GPS telemetry · {event} · click bar to scrub
        </span>
        <span className="font-mono text-[9px] text-muted-foreground tabular">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
