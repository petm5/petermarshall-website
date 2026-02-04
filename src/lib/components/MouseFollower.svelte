<script lang="ts">
  import { onMount } from "svelte";
  import { SpringSimulation } from '$lib/utils/spring-physics';
  import { afterNavigate } from '$app/navigation';

  let loaded = false;

  let hidden = true;

  let mainFollower: HTMLDivElement;
  let largeFollower: HTMLDivElement;

  let physicsRunning = false;
  let physicsStopTimeout: any;

  let mouseX = 0;
  let mouseY = 0;

  const mainSimulation = new SpringSimulation(0.4, 0.6, 0.4);
  const largeSimulation = new SpringSimulation(0.03, 0.1, 0.2);

  $: followers = [
    {
      follower: mainFollower,
      simulation: mainSimulation
    },
    {
      follower: largeFollower,
      simulation: largeSimulation
    }
  ];

  const fadeTime = 300;

  const checkFollowers = () => !!mainFollower && !!largeFollower;

  const physicsLoop = () => {
    if (!checkFollowers()) return;
    if (!physicsRunning) return;

    for (const { follower, simulation } of followers) {
      const { x, y } = simulation.tick(mouseX, mouseY);

      follower.animate({
        left: `${x}px`,
        top: `${y}px`
      }, {duration: 0, fill: "forwards"});
    }

    requestAnimationFrame(physicsLoop);
  }

  const hideFollowers = () => {
    if (!checkFollowers()) return;

    for (const { follower } of followers) {
      follower.animate({
        opacity: 0
      }, {duration: fadeTime, fill: "forwards"});
    }

    hidden = true;

    physicsStopTimeout = setTimeout(() => {
      physicsRunning = false;
    }, fadeTime);
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!checkFollowers()) return;

    if (!matchMedia('(pointer:fine)').matches) {
      if (!hidden) hideFollowers();
      return;
    }

    const { clientX, clientY } = e;

    if (hidden) {
      for (const { follower } of followers) {
        follower.animate({
          left: `${clientX}px`,
          top: `${clientY}px`,
          opacity: 1
        }, {duration: 0, fill: "forwards"});
        follower.hidden = false;
      }
      hidden = false;
    }

    mouseX = clientX;
    mouseY = clientY;

    if (physicsStopTimeout) {
      clearTimeout(physicsStopTimeout);
    }

    if (!physicsRunning) {
      for (const { simulation } of followers) {
        simulation.reset(mouseX, mouseY);
      }
      physicsRunning = true;
      physicsLoop();
    }
  }

  const isInteractable = (e: EventTarget) => {
    if (e instanceof Element) {
      return (e.tagName === 'BUTTON' || e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.closest('a'));
    }
  }

  const grow = () => {
    if (!checkFollowers()) return;

    mainFollower.animate({
      "--scale": '3.5'
    }, {duration: 100, fill: "forwards"})
    largeFollower.animate({
      opacity: '0'
    }, {duration: 100, fill: "forwards"})
  }

  const shrink = () => {
    if (!checkFollowers()) return;

    mainFollower.animate({
      "--scale": '1'
    }, {duration: 100, fill: "forwards"})
    largeFollower.animate({
      opacity: '1'
    }, {duration: 100, delay: 50, fill: "forwards"})
  }

  const onMouseOver = (e: MouseEvent) => {
    if (isInteractable(e.target)) grow();
  }

  const onMouseOut = (e: MouseEvent) => {
    if (isInteractable(e.target)) shrink();
  }

  afterNavigate(shrink);

  onMount(() => {
    window.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseleave', hideFollowers);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);
    loaded = true;
  });
</script>

{#if loaded}
  <div class="mouse-follower" bind:this={largeFollower} hidden></div>
  <div class="mouse-follower small" bind:this={mainFollower} hidden></div>
{/if}

<style>
  @media (pointer: fine) {
    :global(body, a, input, textarea, button) {
      cursor: none;
    }
  }

  @property --scale {
    syntax: '<number>';
    initial-value: 1;
    inherits: false;
  }

  .mouse-follower {
    position: fixed;
    width: 2.2rem;
    height: 2.2rem;
    --scale: 1;
    transform: translate(-50%, -50%) scale(var(--scale));
    z-index: 5;
    pointer-events: none;
    user-select: none;
    opacity: 0;
    border-radius: 100%;
    background: light-dark(#9992, #5556);
    &.small {
      width: 0.8rem;
      height: 0.8rem;
      backdrop-filter: contrast(1.2) brightness(1.3) saturate(0.8) invert(1);
      background: light-dark(#fff6, #eee2);
    }
  }
</style>
