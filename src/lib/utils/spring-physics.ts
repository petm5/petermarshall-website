export class SpringSimulation {
  currentX = 0;
  currentY = 0;
  prevTargetX = 0;
  prevTargetY = 0;
  velocityX = 0;
  velocityY = 0;
  lastTime = 0;

  constructor(
    public stiffness: number,
    public derivative: number,
    public drag: number
  ) {}

  reset(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    this.prevTargetX = x;
    this.prevTargetY = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.lastTime = performance.now();
  }

  tick(targetX: number, targetY: number) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / (1000 / 60);
    this.lastTime = currentTime;

    const targetVelocityX = targetX - this.prevTargetX;
    const targetVelocityY = targetY - this.prevTargetY;

    // Store Target position for next tick
    this.prevTargetX = targetX;
    this.prevTargetY = targetY;

    const distX = this.currentX - targetX;
    const distY = this.currentY - targetY;

    // Derivative term
    const relativeVelocityX = this.velocityX - targetVelocityX;
    const relativeVelocityY = this.velocityY - targetVelocityY;

    // Hooke's Law
    const springForceX = -this.stiffness * distX;
    const springForceY = -this.stiffness * distY;

    // Air Resistance
    const dragX = this.velocityX * this.drag;
    const dragY = this.velocityY * this.drag;

    // Derivative term's damping
    const dampingX = relativeVelocityX * this.derivative;
    const dampingY = relativeVelocityY * this.derivative;

    // Acceleration
    const accelX = springForceX - dragX - dampingX;
    const accelY = springForceY - dragY - dampingY;

    // Integrate acceleration into velocity
    this.velocityX += accelX * deltaTime;
    this.velocityY += accelY * deltaTime;

    const accelerationMagnitude = Math.hypot(accelX, accelY);
    const velocityMagnitude = Math.hypot(this.velocityX, this.velocityY);
    if (velocityMagnitude + accelerationMagnitude < 0.001) {
      // Prevent micro-jitters
      this.velocityX = 0;
      this.velocityY = 0;
      this.currentX = targetX;
      this.currentY = targetY;
    } else {
      // Integrate velocity into position
      this.currentX += this.velocityX * deltaTime;
      this.currentY += this.velocityY * deltaTime;
    }

    return { x: this.currentX, y: this.currentY }
  }
}
