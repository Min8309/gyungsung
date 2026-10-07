export const PLAY_DURATION_MS = 600_000;
export const FINALE_DURATION_MS = 3_000;

export class PlayTimer {
  constructor({ controls, soundManager, props, onEnd, now = () => performance.now(), closeWindow = () => window.close() }) {
    Object.assign(this, { controls, soundManager, props, onEnd, now, closeWindow });
    this.startedAt = null;
    this.ended = false;
    this.finalizing = false;
    this.display = document.createElement('div');
    this.display.id = 'play-timer';
    this.display.innerHTML = '<span>남은 시간</span><strong>10:00</strong>';
    document.body.appendChild(this.display);
    this.overlay = document.createElement('div');
    this.overlay.id = 'timeout-overlay';
    this.overlay.hidden = true;
    this.overlay.innerHTML = '<h1>인쇄소의 시간이 끝났다.</h1><p>게임이 종료되었습니다. 창이 닫히지 않으면 직접 닫아주세요.</p>';
    document.body.appendChild(this.overlay);
    controls.addEventListener('lock', () => this.start());
    // Once time expires, prevent every gameplay handler, including modal inputs.
    for (const event of ['keydown', 'keyup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchmove']) {
      window.addEventListener(event, e => {
        if (this.ended) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, { capture: true, passive: false });
    }
    this.render(PLAY_DURATION_MS);
  }

  start() {
    if (this.startedAt !== null || this.ended) return;
    this.startedAt = this.now();
    this.display.classList.add('running');
    this.interval = setInterval(() => this.update(), 100);
  }

  render(remaining) {
    const seconds = Math.ceil(remaining / 1000);
    const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    this.display.querySelector('strong').textContent = text;
    this.display.classList.toggle('urgent', remaining <= 30_000);
    this.props.setCountdown(text);
  }

  update() {
    if (this.startedAt === null || this.ended) return;
    const remaining = Math.max(0, PLAY_DURATION_MS - (this.now() - this.startedAt));
    this.render(remaining);
    if (remaining <= FINALE_DURATION_MS && !this.finalizing) {
      this.finalizing = true;
      this.overlay.hidden = false;
      this.overlay.classList.add('flashing');
      this.soundManager.playTimeoutScream(remaining / 1000);
    }
    if (remaining === 0) this.finish();
  }

  finish() {
    if (this.ended) return;
    this.ended = true;
    clearInterval(this.interval);
    this.overlay.hidden = false;
    this.overlay.classList.remove('flashing');
    this.onEnd();
    this.controls.unlock();
    this.soundManager.ctx?.suspend();
    // Browsers only allow scripts to close eligible windows. The overlay remains otherwise.
    try { this.closeWindow(); } catch { /* Keep the terminal screen visible. */ }
  }
}
