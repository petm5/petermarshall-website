<script>
  import Logo from '$lib/components/Logo.svelte';
  import navItems from '$lib/navItems.json';
</script>

<header>
  <div class="content">
    <Logo />
    <div class="menu-section">
      <div class="menu" tabindex="-1">
        <div class="expand"></div>
        <div class="item-container">
          <div class="items">
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
        </div>
      </div>
      <div class="close" tabindex="-1"></div>
    </div>
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
    color: light-dark(#333, #dee);
    box-shadow: 0 0 16px #2222;
    background: light-dark(#999a, #20263440);
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      height: 250%;
      mask-image: linear-gradient(to bottom, black 0% 40%, transparent 40% 100%);
      backdrop-filter: contrast(0.6) brightness(1.5) saturate(1.5) blur(40px);
      filter: url('$lib/assets/glass-shader.svg#glass');
    }
  }
  @media (prefers-color-scheme: dark) {
    header {
      box-shadow: 0 0 4px #0006, 0 0 30px 0 #0002, 0 0 1px 1px #fff6;
      &::before {
        backdrop-filter: contrast(0.9) brightness(0.8) saturate(1.5) blur(40px);
      }
    }
  }
  header::after {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset 2px 2px 30px -7px rgba(255, 255, 255, 0.1);
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
    @media (prefers-color-scheme: dark) {
      text-shadow: 0 0 3px #0008;
    }
  }
  .menu-section {
    margin-left: auto;
  }
  nav {
    display: flex;
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
    &:hover {
      text-decoration: underline;
    }
  }
  @media (max-width: 750px) {
    .content {
      padding: 1rem;
    }
    .expand {
      display: grid;
      &::after {
        content: "≡";
        font-size: 2rem;
      }
    }
    .close {
      display: none;
      &::after {
        content: "×";
        font-size: 1.6rem;
      }
    }
    .close, .expand {
      width: 2rem;
      height: 2rem;
      place-content: center;
      cursor: pointer;
      &::after {
        text-rendering: geometricprecision;
        width: 3.5rem;
        line-height: 3.5rem;
        text-align: center;
      }
    }
    .item-container {
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      top: 3.5rem;
    }
    .menu:focus-within {
      .item-container {
        display: block;
      }
      .expand {
        display: none;
      }
      & + .close {
        display: grid;
      }
    }
    .items {
      display: flex;
      flex-direction: column;
      padding: 1.8rem 1.4rem;
      gap: 0.4rem;
      background: light-dark(#dddd, #3334);
      backdrop-filter: contrast(0.7) brightness(1.3) saturate(1.5) blur(40px);
      box-shadow: 0 1.5rem 1.5rem -0.75rem #2222;
      @media (prefers-color-scheme: dark) {
        backdrop-filter: contrast(0.9) brightness(0.7) saturate(1.5) blur(40px);
        box-shadow: 0px 0px 1.6rem #0004 inset, 0 1px 1px 0 #fff4;
      }
    }
    nav, ul {
      display: contents;
    }
    li {
      display: block;
      margin-left: 0;
      padding: 0.6rem;
      font-weight: bold;
    }
  }
</style>
