<script>
  import { copyright } from '$lib/site.json';
  import ArchivalNotice from '$lib/components/ArchivalNotice.svelte';
</script>

<footer>
  <p>© {copyright}</p>
  <ArchivalNotice />
</footer>

<style>
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: .25rem 1rem;
  }
</style>
