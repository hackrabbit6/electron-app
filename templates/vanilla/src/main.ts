import './app.css'

const { platform, versions } = window.electronAPI

const app = document.getElementById('app')!

app.innerHTML = `
  <main class="app">
    <h1><span class="logo">⚡</span> Electron + Vanilla TS</h1>
    <p>Edit <code>src/main.ts</code> and save to reload.</p>
    <dl class="versions">
      <dt>Platform</dt><dd>${platform}</dd>
      <dt>Electron</dt><dd>${versions.electron}</dd>
      <dt>Node</dt><dd>${versions.node}</dd>
      <dt>Chrome</dt><dd>${versions.chrome}</dd>
    </dl>
  </main>
`
