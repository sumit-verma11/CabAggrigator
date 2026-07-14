export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b divider bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal to-violet text-primary-fg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14M5 11v5m14-5v5M7 16h10M7 16v1.5M17 16v1.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            RideCompare
          </span>
        </a>

        <nav className="flex items-center gap-1.5">
          <a
            href="#how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text sm:block"
          >
            How it works
          </a>
          <a
            href="#compare"
            className="btn btn-primary px-4 py-2 text-sm"
          >
            Compare fares
          </a>
        </nav>
      </div>
    </header>
  );
}
