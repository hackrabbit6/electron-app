const { platform, versions } = window.electronAPI

export default function App() {
  return (
    <main className="app">
      <h1>
        <span className="logo">⚡</span> Electron + React
      </h1>
      <p>
        Edit <code>src/App.tsx</code> and save to reload.
      </p>
      <dl className="versions">
        <dt>Platform</dt>
        <dd>{platform}</dd>
        <dt>Electron</dt>
        <dd>{versions.electron}</dd>
        <dt>Node</dt>
        <dd>{versions.node}</dd>
        <dt>Chrome</dt>
        <dd>{versions.chrome}</dd>
      </dl>
    </main>
  )
}
