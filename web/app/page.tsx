import { HomeClient } from "@/components/HomeClient";

const PLATFORMS = ["Namma Yatri (ONDC)", "Uber", "Ola", "Rapido"];

export default function Home() {
  return (
    <main>
      {/* ---- Hero + search ---- */}
      <section className="mx-auto w-full max-w-3xl px-5 pt-16 pb-8 text-center sm:pt-24">
        <span className="chip inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Compare every ride platform in one place
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          The <span className="gradient-text">cheapest ride</span>,
          <br className="hidden sm:block" /> without the app-hopping.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Compare live cab, auto and bike fares across Uber, Ola, Rapido and
          Namma Yatri — then book the best one in a tap.
        </p>
      </section>

      <div id="compare" className="scroll-mt-20">
        <HomeClient />
      </div>

      {/* ---- Supported platforms ---- */}
      <section className="mx-auto mt-16 w-full max-w-3xl px-5">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-faint">
          Comparing fares across
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted">
          {PLATFORMS.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section
        id="how-it-works"
        className="mx-auto mt-20 w-full max-w-3xl scroll-mt-20 px-5"
      >
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How booking works
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted">
          We&apos;re transparent about what each platform allows.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Book here
            </span>
            <h3 className="mt-4 text-lg font-semibold">Namma Yatri · ONDC</h3>
            <p className="mt-1.5 text-sm text-muted">
              Open networks let us book end-to-end inside RideCompare — no
              app-switching, and typically the cheapest with no surge.
            </p>
          </div>
          <div className="card p-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-faint" /> Open in app
            </span>
            <h3 className="mt-4 text-lg font-semibold">Uber · Ola · Rapido</h3>
            <p className="mt-1.5 text-sm text-muted">
              We show the live estimate, then hand you to their app with pickup
              and drop pre-filled. Fully sanctioned, no credential sharing.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-faint">
          Fares are computed from published tariff cards over the real route
          distance and time; live surge is excluded, so the final price may
          differ.
        </p>
      </section>

      <div className="h-20" />
    </main>
  );
}
