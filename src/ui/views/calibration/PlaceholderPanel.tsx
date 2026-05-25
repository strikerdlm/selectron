export function PlaceholderPanel() {
  return (
    <div className="fadein space-y-6">
      <div className="panel p-12 text-center">
        <div className="display text-xl text-ink-0 tracking-tight mb-2">Validation & Sensitivity</div>
        <p className="mono text-[11px] uppercase tracking-cap text-ink-3 mb-6">coming soon</p>
        <p className="text-ink-2 text-sm max-w-md mx-auto">
          The K15 validation gate and Sobol/Morris sensitivity analysis endpoints
          are defined in the API models but not yet wired to the Python engine.
          Once the backend routes are implemented, this panel will display
          per-metric pass/fail tables and tornado charts.
        </p>
      </div>
    </div>
  );
}
