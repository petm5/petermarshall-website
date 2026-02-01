<script>
  import { tagline, description } from '$lib/site.json';
  import av1WebmAnimation from '$lib/assets/cube-light.webm';
  import avcMp4Animation from '$lib/assets/cube-light.mp4';
  import staticImage from '$lib/assets/cube-static.png?format=avif';
  import Buttons from '$lib/components/Buttons.svelte';
  let items = [{
    desc: "Learn More",
    href: "#main"
  }];
</script>

<div class="hero-section">
  <div class="hero-wrapper">
    <div class="hero-card">
      <div class="wrapper">
        <div class="content">
          <h1>{tagline}</h1>
          <p>{description}</p>
          <div class="buttons">
            <Buttons {items} />
          </div>
        </div>
        <div class="anim">
          <div class="anim-wrapper">
            <video autoplay muted playsinline loop width="400" height="400" poster={staticImage} >
              <source src={av1WebmAnimation} type="video/webm; codecs=av01.0.08M.10">
              <source src={avcMp4Animation} type="video/mp4; codecs=avc1.640015">
            </video>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes zoom-in {
    0% { transform: translateY(10px); filter: opacity(0) blur(12px) }
    100% {}
  }

  @keyframes card {
    0% { filter: opacity(0.93) }
    100% {}
  }

  @keyframes fade-in {
    0% { filter: opacity(0); transform: scale(0.7) }
    100% {  }
  }

  .hero-section {
    display: flex;
    place-content: center;
    grid-column: full;
    padding: 0 var(--side-spacing);
    margin-bottom: var(--layout-spacing);
  }

  .hero-wrapper {
    max-width: 1100px;
  }

  .hero-card {
    display: grid;
    place-content: center;
    padding: calc(var(--elem-spacing) * 2);
    position: relative;
    overflow: hidden;
    background: #d9dce1;
    box-shadow: 8px 20px 60px #fff4, 2px 5px 12px #fff2, 0 0 2px 1px rgba(23, 130, 166, 0.4);
    border-radius: 3rem;
    animation: 1s ease-in backwards card;
    &::after {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      box-shadow: 0 0 130px #0d1b1e30 inset, 0 0 24px #4442 inset;
      background: #2221;
    }
    @media (prefers-color-scheme: light) {
      box-shadow: 0 0 4rem #2223, 0 0 1rem #3331, 0 0 1px 1px rgba(19, 43, 51, 0.1);
      &::after {
        box-shadow: 0 0 120px #3d606824 inset, 0 0 24px #8881 inset;
        background: transparent;
      }
    }
    .wrapper {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      max-width: 72rem;
      gap: 3rem;
      .anim {
        display: grid;
        place-items: center;
      }
      .content {
        display: flex;
        flex-direction: column;
        margin: auto;
        padding-bottom: .5rem;
        font-size: min(1.5vw, 1.125rem);
        color: #333;
        z-index: 1;
        text-wrap-style: pretty;
        animation: 1.5s ease-in-out 0.1s backwards zoom-in;
        animation-timing-function: ease;
        text-shadow: 0 0 4px #2224;
        > * + * {
          margin-top: 1rem;
        }
        h1 {
          font-size: min(6vw, 3.25rem);
          font-family: sans-serif;
          font-weight: 600;
          color: light-dark(#444, #333);
          -webkit-text-fill-color: unset;
          margin-top: 0;
          margin-bottom: .25em;
          text-shadow: 0 0 5px #2223;
        }
      }
      .anim-wrapper {
        display: flex;
        max-width: 400px;
        height: auto;
        aspect-ratio: 1;
        pointer-events: none;
        animation: 1.6s ease 0.6s backwards fade-in;
        video {
          transform: scale(140%) translateY(10px);
          width: 100%;
          height: 100%;
          mask: radial-gradient(#000 60%,#0000 70%);
        }
      }
      :global(.actions) {
        & .action {
          height: 3rem;
          transition: box-shadow 0.4s;
          box-shadow: 0 0 8px #3462;
        }
        & .action:hover {
          box-shadow: 0 0 20px #3463;
        }
      }
    }
    @media (max-width: 960px) {
      & {
        border-radius: 1.5rem;
        padding: var(--elem-spacing) 24px;
        padding-top: var(--navbar-height);
        .wrapper {
          grid-template-rows: [top-start] auto [top-end] auto;
          grid-template-columns: 100%;
          max-width: 40rem;
          .anim {
            grid-row: top;
            video {
              width: min(65vw, 280px);
            }
          }
          .content {
            text-align: center;
            font-size: clamp(.8rem, 4vw, 1rem);
            max-width: 30rem;
            & h1 {
              font-size: min(10vw, 3.125rem);
            }
          }
          :global(.actions) {
            align-items: center;
          }
        }
      }
    }
  }

  </style>
