<script>
  import logo from '$lib/assets/logo-glow.png?format=avif&w=512';
  import { title } from '$lib/site.json';
</script>

<div class="logo">
  <a href="/">
    <img alt="Logo" src={logo} />
    <p>{title}</p>
  </a>
</div>

<style>
  a {
    text-decoration: none;
    color: inherit;
    display: contents;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.1rem;
    font-weight: bold;
  }
  img {
    display: block;
    margin: 0;
    height: 36px;
    transform: scale(260%);
  }
</style>
