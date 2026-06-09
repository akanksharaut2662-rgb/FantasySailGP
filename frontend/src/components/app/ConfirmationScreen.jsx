const FLAG = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const FULL_NAME = {
  AUS: "Australia", BRA: "Brazil", CAN: "Canada", DEN: "Denmark",
  ESP: "Spain", FRA: "France", GBR: "Great Britain", GER: "Germany",
  ITA: "Italy", NZL: "New Zealand", SUI: "Switzerland", SWE: "Sweden", USA: "United States",
};

function formatCredits(n) { return n.toLocaleString(); }
function formatCost(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

export default function ConfirmationScreen({ race, teams, teamValues, totalCost, creditsBefore, onConfirm, onBack }) {
  const creditsAfter = creditsBefore - totalCost;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-16 space-y-10">
      {/* Header */}
      <div>
        <p className="eyebrow">{race?.event} · {race?.race_label?.replace("_", " ")}</p>
        <h2 className="mt-4 font-display text-5xl md:text-6xl text-ink leading-[0.92]">
          Confirm your<br />
          <span className="italic text-teal">fleet.</span>
        </h2>
      </div>

      <div className="hairline" />

      {/* Selected Teams */}
      <div className="space-y-3">
        <p className="eyebrow mb-4">Selected Teams</p>
        {teams.map((team, i) => {
          const tv = teamValues[team];
          return (
            <div
              key={team}
              className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">{FLAG[team] ?? "🏴"}</span>
                <div className="min-w-0">
                  <div className="font-display text-xl text-ink">{FULL_NAME[team] ?? team}</div>
                  <div className="eyebrow !text-[8px] text-muted-foreground">{team}</div>
                </div>
              </div>
              {tv && (
                <div className="text-right shrink-0">
                  <div className="font-display text-xl text-ink tabular">{formatCost(tv.cost)}</div>
                  <div className="eyebrow !text-[7px] text-muted-foreground">credits</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Credits summary */}
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="eyebrow">Credits Summary</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Credits available</span>
            <span className="font-display text-xl text-ink tabular">{formatCredits(creditsBefore)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fleet cost</span>
            <span className="font-display text-xl text-destructive tabular">−{formatCredits(totalCost)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Remaining after purchase</span>
            <span className={`font-display text-2xl tabular ${creditsAfter >= 0 ? "text-teal" : "text-destructive"}`}>
              {formatCredits(Math.max(0, creditsAfter))}
            </span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-4 justify-center">
        <button
          onClick={onBack}
          className="eyebrow !text-[9px] border border-border text-muted-foreground rounded-full px-6 py-2.5 hover:border-ink/40 transition-colors"
        >
          ← Change lineup
        </button>
        <button
          onClick={onConfirm}
          className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
        >
          Confirm Fleet
          <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      {/* Fine print */}
      <p className="text-center text-xs text-muted-foreground">
        Credits will be deducted when you confirm. Race simulation uses historical Bermuda test data.
      </p>
    </div>
  );
}
