<script>
  import Logo from '$lib/components/Logo.svelte';
  import navItems from '$lib/navItems.json';
</script>

<header>
  <div class="content">
    <Logo />
    <nav>
      <ul>
        {#each navItems as item}
          <li>
            <a href={item.href}>{item.name}</a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>

<style>
  @keyframes slide-down {
    0% { transform: translateY(-6px); filter: opacity(0) }
    100% {}
  }
  header {
    width: 100%;
    height: 3.5rem;
    display: flex;
    background: #1118;
    border-bottom: 1px solid #eee2;
    backdrop-filter: blur(30px);
    position: sticky;
    top: 0;
    z-index: 2;
    color: #dee;
  }
  :global(body:has(.hero)) header {
    position: fixed;
    animation: .8s ease backwards slide-down;
  } 
  .content {
    max-width: 80rem;
    width: 100%;
    margin: 0 auto;
    padding: 0 calc(1.5rem + 10px);
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }
  nav {
    display: flex;
    margin-left: auto;
    line-height: 1;
    
  }
  ul {
    display: inline-block;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: inline-block;
    font-size: .95rem;
    font-weight: 300;
    margin-left: 1.25rem;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
</style>
