export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">CloseChat</h1>
        <p className="text-slate-300 mb-4">
          Electron + React + TailwindCSS est prêt.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition"
          onClick={() => window.alert('UI OK')}
        >
          Tester
        </button>
      </div>
    </div>
  )
}

