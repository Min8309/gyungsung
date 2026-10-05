export class TitleAnimation {
  constructor(elementId, options = {}) {
    this.container = document.getElementById(elementId);
    if (!this.container) return;

    this.charPairs = options.charPairs || [
      { ko: '경', han: '京' },
      { ko: '성', han: '城' },
      { ko: '활', han: '活' },
      { ko: '판', han: '版' },
      { ko: '인', han: '印' },
      { ko: '쇄', han: '刷' },
      { ko: '소', han: '所' }
    ];

    this.glyphPool = [
      '死', '怨', '血', '呪', '鬼', '魂', '闇', '印',
      '版', '字', '刻', '夜', '墨', '骨', '鏡', '錄',
      '鉛', '壓', '紙', '漆', '冥', '滅', '影', '痕'
    ];

    this.currentMode = 'ko'; // 'ko' or 'han'
    this.isAnimating = false;
    this.charElements = [];
    this.timer = null;

    this.render();
    this.startCycle();
  }

  render() {
    this.container.innerHTML = '';
    this.charElements = [];

    this.charPairs.forEach((pair, index) => {
      const span = document.createElement('span');
      span.className = 'title-char';
      span.textContent = pair.ko; // start with Korean
      span.dataset.index = index;
      this.container.appendChild(span);
      this.charElements.push(span);

      // Add space between characters except after the last one
      if (index < this.charPairs.length - 1) {
        const space = document.createElement('span');
        space.className = 'title-char-space';
        space.textContent = ' ';
        this.container.appendChild(space);
      }
    });

    // Hover & Click triggers for instant interaction
    this.container.addEventListener('mouseenter', () => {
      if (!this.isAnimating) {
        this.toggleLanguage();
      }
    });

    this.container.addEventListener('click', (e) => {
      e.stopPropagation(); // Clicking title animates it without immediately entering game
      if (!this.isAnimating) {
        this.toggleLanguage();
      }
    });
  }

  startCycle() {
    // Initial dramatic transition to Hanja shortly after load (1.6s)
    setTimeout(() => {
      if (!this.isAnimating && this.currentMode === 'ko') {
        this.toggleLanguage();
      }
    }, 1600);

    // Schedule recurring transition between Korean and Hanja
    this.timer = setInterval(() => {
      if (!this.isAnimating) {
        this.toggleLanguage();
      }
    }, 4500); // Transitions every 4.5 seconds
  }

  stopCycle() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggleLanguage() {
    const targetMode = this.currentMode === 'ko' ? 'han' : 'ko';
    this.morphTo(targetMode);
  }

  morphTo(targetMode) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentMode = targetMode;

    const totalChars = this.charElements.length;

    this.charElements.forEach((el, index) => {
      // Stagger each character's transformation
      const delay = index * 90; // 90ms stagger per char

      setTimeout(() => {
        this.scrambleCharacter(el, index, targetMode, () => {
          if (index === totalChars - 1) {
            this.isAnimating = false;
          }
        });
      }, delay);
    });
  }

  scrambleCharacter(element, index, targetMode, onComplete) {
    const targetChar = this.charPairs[index][targetMode];
    element.classList.add('scrambling');

    let frames = 0;
    const maxFrames = 7 + Math.floor(Math.random() * 5); // 7 to 11 flicker frames

    const interval = setInterval(() => {
      frames++;
      // Pick random ominous lead-type Hanja glyph
      const randomGlyph = this.glyphPool[Math.floor(Math.random() * this.glyphPool.length)];
      element.textContent = randomGlyph;

      if (frames >= maxFrames) {
        clearInterval(interval);
        element.textContent = targetChar;
        element.classList.remove('scrambling');
        element.classList.add('stamped');

        setTimeout(() => {
          element.classList.remove('stamped');
        }, 500);

        if (onComplete) onComplete();
      }
    }, 38); // Fast 38ms frame rate for eerie analog shutter / typesetting flip
  }
}
