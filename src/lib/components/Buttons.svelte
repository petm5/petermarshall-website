<script>
  let { items } = $props();
</script>

<p class="actions">
  {#each items as item}
    {#if item.desc}
      <a class="action" href={item.href}>{item.desc}</a>
    {/if}
  {/each}
</p>

<style>
  .actions {
    display: flex;
    flex-direction: column;
    grid-row-gap: 1em;
    margin-top: 32px !important;
  }

  .action {
    color: black;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    place-content: center;
    background: white;
    width: max-content;
    height: 2.5rem;
    padding-left: 20px;
    padding-right: 8px;
    border-radius: 100px;
    box-shadow: 0 0 4px #0001;
    font-family: sans-serif;
  }

  @media (max-width: 750px) {
    .action {
      width: 100%;
    }
  }

  .action::after {
    content: "›";
    width: 24px;
    height: 24px;
    font-size: 1.5rem;
    line-height: 20px;
    text-align: center;
    color: #777;
  }

  :global(.hero) .action {
    height: 3rem;
  }

  .actions > * + * {
    color: inherit;
    background: #20252d;
  }
</style>
