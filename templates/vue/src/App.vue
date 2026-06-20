<script setup lang="ts">
const { platform, versions } = window.electronAPI
</script>

<template>
  <main class="app">
    <h1><span class="logo">⚡</span> Electron + Vue</h1>
    <p>Edit <code>src/App.vue</code> and save to reload.</p>
    <dl class="versions">
      <dt>Platform</dt>
      <dd>{{ platform }}</dd>
      <dt>Electron</dt>
      <dd>{{ versions.electron }}</dd>
      <dt>Node</dt>
      <dd>{{ versions.node }}</dd>
      <dt>Chrome</dt>
      <dd>{{ versions.chrome }}</dd>
    </dl>
  </main>
</template>
