export function MaintenanceNotice() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-white mb-3">Hold Tight</h1>
        <p className="text-zinc-400 font-mono text-sm leading-relaxed">
          WPulls is currently undergoing maintenance.
          <br />
          We'll be back soon.
        </p>
      </div>
    </div>
  );
}
