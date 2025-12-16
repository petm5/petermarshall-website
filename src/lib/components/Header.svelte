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
  header {
    width: 100%;
    height: 3.5rem;
    display: flex;
    position: sticky;
    top: 0;
    z-index: 2;
    color: #dee;
    box-shadow: 0 0 4px #0006, 0 0 30px 0 #0002, 0 0 1px 1px #fff6;
    background: #20263440;
  }
  header::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    height: 250%;
    mask-image: linear-gradient(to bottom, black 0% 40%, transparent 40% 100%);
    backdrop-filter: contrast(0.9) brightness(0.8) saturate(1.5) blur(40px);
    filter: url('$lib/assets/glass-shader.svg#glass');
  }
  header::after {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset 2px 2px 30px -7px rgba(255, 255, 255, 0.1);
  }
  :global(body:has(.hero)) header {
    position: fixed;
  } 
  .content {
    max-width: 80rem;
    width: 100%;
    margin: 0 auto;
    padding: 0 calc(1.5rem + 10px);
    display: flex;
    align-items: center;
    box-sizing: border-box;
    z-index: 1;
    text-shadow: 0 0 3px #0008;
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
    font-weight: 400;
    margin-left: 1.25rem;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
</style>
