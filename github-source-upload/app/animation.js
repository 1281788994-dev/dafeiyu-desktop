(function (root) {
  'use strict';
  const clips = {
    idle: { row: 0, frames: [0, 1, 2, 3, 4, 5], times: [800, 240, 260, 280, 300, 900], loop: true },
    tail: { row: 3, frames: [0, 1, 2, 3, 2, 1, 0], times: [320, 260, 280, 260, 280, 260, 420], loop: false },
    celebrate: { row: 4, frames: [0, 1, 2, 3, 4], times: [650, 700, 650, 500, 900], loop: false },
    stretch: { row: 9, frames: [0,1,2,3,4,5], times: [400,550,650,800,550,450], loop: false },
    sleep: { row: 10, frames: [0,1,2,3,4,5], times: [500,650,800,1200,700,500], loop: false },
    stand: { row: 11, frames: [0,1,2,3,4], times: [500,600,800,600,800], loop: false },
    gag: { row: 12, frames: [0,1,2,3,4], times: [650,700,950,1200,900], loop: false }
  };
  function normalizeSettings(value = {}) {
    return {
      scale: [0.8, 1, 1.25, 1.5].includes(value.scale) ? value.scale : 1.25,
      speed: [0.5, 0.75, 1, 1.5].includes(value.speed) ? value.speed : 0.75,
      hover: value.hover !== false,
      reducedMotion: value.reducedMotion === true,
      alwaysOnTop: value.alwaysOnTop !== false,
      chatter: value.chatter !== false,
      position: value.position && Number.isFinite(value.position.x) && Number.isFinite(value.position.y)
        ? { x: Math.round(value.position.x), y: Math.round(value.position.y) } : null
    };
  }
  class AnimationPlayer {
    constructor() { this.state = 'idle'; this.index = 0; this.elapsed = 0; this.speed = 0.75; this.paused = false; }
    play(state) {
      if (!clips[state]) return false;
      this.state = state; this.index = 0; this.elapsed = 0; return true;
    }
    tick(delta) {
      if (this.paused || !Number.isFinite(delta) || delta <= 0) return;
      this.elapsed += Math.min(delta, 1000) * this.speed;
      let clip = clips[this.state];
      while (this.elapsed >= clip.times[this.index]) {
        this.elapsed -= clip.times[this.index]; this.index++;
        if (this.index >= clip.frames.length) {
          if (clip.loop) this.index = 0;
          else { this.state = 'idle'; this.index = 0; this.elapsed = 0; }
        }
        clip = clips[this.state];
      }
    }
    get frame() { const c = clips[this.state]; return { row: c.row, column: c.frames[this.index] }; }
  }
  const api = { clips, AnimationPlayer, normalizeSettings };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DafeiyuAnimation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
