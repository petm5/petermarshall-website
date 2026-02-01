<script>
  import logo from '$lib/assets/logo-glow.png?format=avif&w=256';
  import { title } from '$lib/site.json';
</script>

<div class="logo">
  <a href="/">
    <div class="image">
      <img alt src={logo} />
    </div>
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
    width: 36px;
    height: 36px;
    transform: scale(260%);
    font-size: 0;
  }
  .image {
    transition: transform .2s ease-out;
  }
  .logo:hover .image {
    transform: rotate(30deg);
  }
</style>
