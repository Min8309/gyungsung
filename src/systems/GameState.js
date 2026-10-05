import { GameConfig } from '../config/GameConfig.js';

/**
 * GameState: 게임 전체의 상태(퍼즐 진행도, 인벤토리, 조사한 단서, 타이머, 힌트 단계)를 관리하는 중앙 상태 머신
 */
export class GameStateManager {
  constructor() {
    this.config = GameConfig;

    // 퍼즐 해결 여부
    this.puzzles = {
      puzzle_a: false, // 자정 2분 전 (서랍 2358)
      puzzle_b: false, // 눈동자 활자 (큐브 눈 위 장착)
      puzzle_c: false, // 철문의 열쇠 (식자공 활자 조판)
    };

    // 인벤토리 (소지 아이템 목록)
    this.inventory = [];

    // 이미 조사한 단서 ID 세트 (● -> ○ 전환용)
    this.inspectedClues = new Set();

    // 수첩에 기록된 단서 ID 세트
    this.notebookClues = new Set();

    // 자동 힌트 타이머 관리
    this.lastProgressTime = performance.now();
    this.hintStage = 0; // 0: 정상, 1: 60초(전구), 2: 90초(째깍), 3: 120초(강한 림라이트)
    this.activeHintTarget = null; // 가장 가까운 미해결 단서

    // 서랍 퍼즐 상태
    this.drawer24Opened = false;

    // 조판대 상태
    this.cubeAttached = false;
    this.cubeEyeUp = false;
    this.galleySlots = [null, null, null]; // ['식', '자', '공']

    // 철문 상태
    this.doorUnlocked = false;

    // 인쇄 준비 상태 (퍼즐 1개 이상 해결 시 true)
    this.isPrintReady = false;
    this.isPrinting = false;
    this.printedCard = null;
  }

  // 아이템 획득
  addItem(item) {
    if (!this.hasItem(item.id)) {
      this.inventory.push(item);
      this.recordProgress();
      window.dispatchEvent(new CustomEvent('inventory-changed', { detail: { item, inventory: this.inventory } }));
      return true;
    }
    return false;
  }

  // 아이템 소지 여부 확인
  hasItem(itemId) {
    return this.inventory.some(it => it.id === itemId);
  }

  // 단서 조사 기록 (● -> ○ 변경 및 수첩 기록)
  markClueInspected(clueId) {
    const isNew = !this.inspectedClues.has(clueId);
    this.inspectedClues.add(clueId);

    // 수첩 단서 매핑 확인 (id 직접 일치 또는 키 일치)
    let foundClue = this.config.notebookClues[clueId];
    if (!foundClue) {
      foundClue = Object.values(this.config.notebookClues).find(c => c.id === clueId);
    }

    if (foundClue) {
      this.notebookClues.add(foundClue.id);
      window.dispatchEvent(new CustomEvent('notebook-updated', { detail: { clueId, clue: foundClue } }));
    }

    if (isNew) {
      this.recordProgress();
    }
  }

  isClueInspected(clueId) {
    return this.inspectedClues.has(clueId);
  }

  // 퍼즐 해결 처리
  solvePuzzle(puzzleKey) {
    if (!this.puzzles[puzzleKey]) {
      this.puzzles[puzzleKey] = true;
      this.isPrintReady = true;
      this.recordProgress();
      window.dispatchEvent(new CustomEvent('puzzle-solved', { detail: { puzzleKey, puzzles: this.puzzles } }));
    }
  }

  // 플레이어 진전 기록 (타이머 리셋)
  recordProgress() {
    this.lastProgressTime = performance.now();
    this.hintStage = 0;
  }

  // 해결한 퍼즐 개수
  getSolvedCount() {
    return Object.values(this.puzzles).filter(Boolean).length;
  }

  // 푼 퍼즐에 따른 카드 타입 결정
  determineRewardCard() {
    const solved = this.puzzles;
    if (solved.puzzle_a && solved.puzzle_b && solved.puzzle_c) {
      return this.config.cardRewards.TYPE_C; // 3개 모두 해결 시 히든
    }
    if (solved.puzzle_a) {
      return this.config.cardRewards.TYPE_B;
    }
    if (solved.puzzle_b) {
      return this.config.cardRewards.TYPE_D;
    }
    if (solved.puzzle_c) {
      return this.config.cardRewards.TYPE_A;
    }
    return this.config.cardRewards.TYPE_B; // 기본값
  }

  // 타이머 업데이트 (자동 힌트 60s, 90s, 120s)
  updateTimer(now, onHintStage1, onHintStage2) {
    const elapsedSec = (now - this.lastProgressTime) / 1000;

    if (elapsedSec >= this.config.timers.idleHint3) {
      if (this.hintStage < 3) {
        this.hintStage = 3;
      }
    } else if (elapsedSec >= this.config.timers.idleHint2) {
      if (this.hintStage < 2) {
        this.hintStage = 2;
        if (onHintStage2) onHintStage2(this.activeHintTarget);
      }
    } else if (elapsedSec >= this.config.timers.idleHint1) {
      if (this.hintStage < 1) {
        this.hintStage = 1;
        if (onHintStage1) onHintStage1(this.activeHintTarget);
      }
    }
  }
}

export const gameState = new GameStateManager();
