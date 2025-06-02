<script>
  import { tagline, description } from '$lib/site.json';
  import av1WebmAnimation from '$lib/assets/cube.webm';
  import avcMp4Animation from '$lib/assets/cube.mp4';
  import staticImage from '$lib/assets/cube.mp4';
  import Buttons from '$lib/components/Buttons.svelte';
  let items = [{
    desc: "Learn More",
    href: "#main"
  }];
</script>

<div class="hero">
  <div class="wrapper">
    <div class="content">
      <h1>{tagline}</h1>
      <p>{description}</p>
      <Buttons {items} />
    </div>
    <div class="anim">
      <video autoplay muted playsinline loop width="400" height="400" poster={staticImage} >
        <source src={av1WebmAnimation} type="video/webm; codecs=av01.0.08M.10">
        <source src={avcMp4Animation} type="video/mp4; codecs=avc1.640015">
      </video>
    </div>
  </div>
</div>

<style>
  @keyframes zoom-in {
    0% { transform: translateY(10px); filter: opacity(0) }
    100% {}
  }

  @keyframes fade-in {
    0% { filter: opacity(0); transform: scale(0.7) }
    100% {  }
  }

  :global(body:has(.hero) main) {
    padding-top: 0;
  }

  .hero {
    display: grid;
    place-content: center;
    flex-shrink: 0;
    flex-grow: 1;
    padding: var(--elem-spacing) 4rem;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    width: 100%;
    min-height: 100svh;
    background: #121212;
    background: radial-gradient(at left bottom, #080808 -10%, #141412);
    box-shadow: 0 0 80px #000, 0 -120px 120px -120px #74579d33 inset;
    grid-column: full;
    margin-bottom: var(--layout-spacing);
    user-select: none;
    > * {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      max-width: 72rem;
      > * {
        display: grid;
        place-content: center;
        &:not(:has(video)) {
          z-index: 1;
          animation: 1.5s ease-in-out 0.1s backwards zoom-in;
          animation-timing-function: ease;
        }
      }
      .content {
        display: grid;
        font-size: min(1.5vw, 1.125rem);
        color: #f4fbffde;
        z-index: 1;
        text-wrap-style: pretty;
        > * + * {
          margin-top: 1rem;
        }
        h1 {
          font-size: min(6vw, 4.5rem);
          font-family: sans-serif;
          font-weight: 400;
          text-shadow: -1px -1px 0 #fff3, 1px 1px 0 #0002;
          -webkit-text-stroke: .4px #fff8;
          margin-top: 0;
          margin-bottom: .25em;
        }
      }
      video {
        max-width: 100%;
        width: 550px;
        height: auto;
        aspect-ratio: 1;
        pointer-events: none;
        animation: 1.2s ease-in 0.4s backwards fade-in;
        animation-timing-function: ease;
        border-radius: 100%;
        background-color: #121212;
        mask: radial-gradient(#000 50%, #0000 70%);
      }
      .action {
        height: 3rem;
        transition: box-shadow 0.4s;
      }
      .action:hover {
        box-shadow: 0 0 16px 4px #346;
      }
    }
    @media (max-width: 960px) {
      & {
        padding: var(--elem-spacing) 24px;
        padding-top: var(--navbar-height);
        > * {
          grid-template-rows: [top-start] auto [top-end] auto;
          grid-template-columns: 100%;
          max-width: 40rem;
          video {
            width: min(65vw, 280px);
          }
          > *:has(video) {
            grid-row: top;
          }
          .content {
            text-align: center;
            font-size: clamp(.8rem, 4vw, 1rem);
            max-width: 30rem;
            & h1 {
              font-size: min(11vw, 4rem);
            }
          }
          .action {
            margin: 0 auto;
          }
        }
      }
    }
  }

  
  @supports (filter: blur()) {
    @keyframes glow-fade {
      from { opacity: 85%opacity: 85% }
      to { opacity: 100% }
    }
    .hero::after {
      content: "";
      display: block;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto;
      max-width: 800px;
      aspect-ratio: 1;
      translate: 0 15%;
      rotate: -45deg;
      background: linear-gradient(45deg, #67a8, transparent 50%);
      filter: blur(80px);
      animation: 1.6s ease-out 0s glow-fade backwards;
    }
  }
</style>
