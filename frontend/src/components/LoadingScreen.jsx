export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl mx-auto mb-4"
          style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)' }}
        >
          FB
        </div>
        <h1
          className="text-3xl font-bold animate-pulse"
          style={{ color: 'var(--text-primary)' }}
        >
          FinBud
        </h1>
      </div>
    </div>
  );
}
