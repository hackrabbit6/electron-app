<script lang="ts">
  const { platform, versions } = window.electronAPI
</script>

<main class="app">
  <h1><span class="logo">⚡</span> Electron + Svelte</h1>
  <p>Edit <code>src/App.svelte</code> and save to reload.</p>
  <dl class="versions">
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
