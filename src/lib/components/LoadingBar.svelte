<div class="progress-bar"></div>

<style>
  .progress-bar {
    position: absolute;
    inset: 0;
    height: 2px;
    z-index: 3;
    --color-1: oklch(0.7 0.1332 50.82);
    --color-2: oklch(0.6441 0.1762 12.71);
    animation: 300ms ease fade-in forwards, 600ms cubic-bezier(.18,.19,.25,.98) 50ms slide backwards, 10s cubic-bezier(.05,.47,.41,.84) 650ms trickle, 600ms linear throb alternate infinite;
  }

  @keyframes fade-in {
    from { opacity: 0% }
    to { opacity: 100% }
  }

  @keyframes slide {
    from { width: 0px }
    to { width: 85% }
  }

  @keyframes trickle {
    from { width: 85% }
    to { width: 100% }
  }

  @keyframes throb {
    from {
      background: var(--color-1);
      box-shadow: 0 0 8px var(--color-1);
    }
    to {
      background: var(--color-2);
      box-shadow: 0 0 8px var(--color-2);
    }
  }
</style>
