import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="font-display text-3xl leading-none text-ink italic">B</div>
          <div className="flex flex-col leading-none">
            <span className="eyebrow !text-[9px]">SailGP</span>
            <span className="font-display text-base text-ink">Fantasy</span>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-10 text-sm">
          {[
            ["Dataset", "#race"],
            ["Playbook", "#how"],
            ["Picks", "#ai"],
            ["Live", "#live"],
          ].map(([l, h]) => (
            <a key={h} href={h} className="text-ink/70 hover:text-ink transition-colors">{l}</a>
          ))}
          <Link to="/model" className="text-ink/70 hover:text-teal transition-colors">Model Intel</Link>
        </nav>
        <Link to="/app" className="group inline-flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-ink">Build team</span>
          <span className="h-9 w-9 rounded-full border border-ink/40 grid place-items-center group-hover:bg-ink group-hover:text-cream transition-colors">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </span>
        </Link>
      </div>
    </header>
  );
}
