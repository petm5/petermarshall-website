<script module>
  declare const BUILD_DATE: string;
</script>

<script lang="ts">
  import { page } from '$app/state';
  import { dev } from '$app/environment';
	import { baseUrl } from '$lib/site.json';
	const ipnsDomain = baseUrl.replaceAll('.', '-');

  let loaded = $state(false);
  let archived = $state(false);
  let latestLink: string = $state('');

  const date = new Date(BUILD_DATE).toLocaleDateString();

  const findGateway = () => {
    if (window.location.host.includes('.ipfs.')) {
      return window.location.host.split('.ipfs.')[1]
    }

    if (window.location.host.includes('.ipns.')) {
      return window.location.host.split('.ipns.')[1]
    }

    return null
  }

  const updateMessage = () => {
    if (window.location.origin !== baseUrl
    && !window.location.host.includes(`.ipns.`)) {
      archived = true;
      const ipfsGateway = findGateway();
      if (ipfsGateway) {
        latestLink = `${window.location.protocol}//${ipnsDomain}.ipns.${ipfsGateway}${page.url.pathname}`
      } else {
        latestLink = `${baseUrl}${page.url.pathname}`
      }
    }
  }

  $effect(() => {
    if (dev) return;

    updateMessage();

    loaded = true;
  });
</script>

<div class="archival-notice">
  {#if loaded}
    {#if archived}
      <div class="message">
        <div class="indicator warning"></div>
        <span>Archived Copy - {date} -</span>
        <a href={latestLink}>View Latest</a>
      </div>
    {:else}
      <div class="message">
        <div class="indicator ok"></div>
        <span>Viewing Latest Version</span>
      </div>
    {/if}
  {:else}
    {#if dev}
      <div class="message">
        <div class="indicator warning"></div>
        <span>Local Development</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .archival-notice {
    display: flex;
    place-items: center;
  }
  .indicator {
    width: 1rem;
    height: 1rem;
    display: inline-flex;
    place-items: center;
    place-content: center;
    margin-right: .2rem;
    --color: gray;
    &::after {
      content: '';
      display: block;
      width: .5rem;
      height: .5rem;
      border-radius: 100%;
      background: var(--color);
      box-shadow: 0 0 0 .2rem hsl(from var(--color) h s calc(l + 10) / 0.25);
      grid-area: 1 / 1;
    }
    &.ok {
      --color: limegreen;
    }
    &.warning {
      --color: darkorange;
    }
  }
</style>
