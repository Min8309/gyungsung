/**
 * 1934 경성 활판 인쇄소 - 중앙 집중식 게임 설정 (GameConfig / GAME_CONFIG)
 * 모든 퍼즐 정답, 타이머 수치, 단서 문구, 림라이트 파라미터 등을 한곳에서 관리합니다.
 */
export const GameConfig = {
  // 기본 설정
  timeString: '23:58',
  locationTitle: '京城日報 活版植字室',
  dateString: '1934년 10월 24일 · 23:58',

  // 힌트 4겹 & 자동 힌트 타이머 (초 단위)
  timers: {
    idleHint1: 60, // 60초: 검열관의 붉은 먹줄 번짐 & 가장 가까운 미해결 단서 방향 전구 깜빡임
    idleHint2: 90, // 90초: 진공관 라디오 모스 부호 공간 패닝 & 시계 째깍 소리 재생
    idleHint3: 120, // 120초: 해당 단서 림라이트 강화
    hintStage1: 60,
    hintStage2: 90,
    hintStage3: 120,
  },

  // 공간 신호 (림라이트 / Emissive 펄스)
  rimLight: {
    period: 1.8, // 맥동 주기 (초)
    normalIntensity: 0.7,
    strongIntensity: 1.8, // 120초 경과 시 강한 림라이트
    detectDistance: 3.5, // 감지 유효 반경 (m)
    color: '#9e1a1a', // 붉은 잉크빛 (#9e1a1a / 0x9e1a1a)
    hexColor: 0x9e1a1a,
  },

  // 퍼즐 A: 자정 2분 전 (→ Type B)
  puzzleA: {
    id: 'puzzle_a',
    title: '자정 2분 전',
    rewardCard: 'TYPE_B',
    targetDrawerIndex: 24, // 24번 서랍
    correctCode: '2358', // 멈춘 시각 23:58
    itemsRewarded: [
      { id: 'power_fuse', name: '전원 퓨즈', desc: '인쇄기 동력 배전반에 꽂을 수 있는 황동 퓨즈다.' },
      { id: 'suicide_note_piece', name: '식자공의 유서 조각', desc: '피 묻은 종이 조각. "인쇄기가 멈추지 않는다... 살려줘..."' }
    ]
  },

  // 퍼즐 B: 눈동자 활자 (→ Type D)
  puzzleB: {
    id: 'puzzle_b',
    title: '눈동자 활자',
    rewardCard: 'TYPE_D',
    glassesItemId: 'round_glasses',
    correctFace: 'TOP', // 눈 면이 위(+Y)를 향함
    rewardAction: 'ink_roller_active',
  },

  // 퍼즐 C: 철문의 열쇠 (→ Type A)
  puzzleC: {
    id: 'puzzle_c',
    title: '철문의 열쇠',
    rewardCard: 'TYPE_A',
    targetWord: ['식', '자', '공'],
    rewardItemId: 'rusty_key',
  },

  // 퍼즐 D: 활판 세척액과 피 묻은 앞치마 (아이템 조합 및 유기적 해금)
  puzzleD: {
    id: 'puzzle_d',
    title: '활판 세척액과 피 묻은 앞치마',
    benzeneItemId: 'benzene_bottle',
    benzeneItemName: '세척용 벤젠 유리병',
    benzeneDesc: '휘발성 기름 냄새가 진동하는 활판 잉크 세척액이다. 굳은 피와 먹물을 녹여낼 수 있다.',
    scrubDistanceThreshold: 1100, // 누적 스크러빙 거리 (픽셀)
    revealedSecretText: '그는 기계 안에 있다',
    sludgeClearedNotice: '굳은 잉크 슬러지와 핏덩이가 말끔히 씻겨 나가 자물쇠 구멍이 열렸습니다!',
  },

  // 퍼즐 E: 2분의 유예와 공명 추 (물리 진자 스윙 & 자정 타종)
  puzzleE: {
    id: 'puzzle_e',
    title: '2분의 유예와 공명 추',
    naturalPeriod: 1.0, // 고유 주기 1.0초
    timingTolerance: 0.22, // 공차 ±0.22초
    maxGongs: 12, // 12회 자정 타종
    gongInterval: 1.15, // 타종 간격 (초)
    gongBaseFreq: 95, // 95Hz 초저음 종소리
    bellResonanceQ: 14,
    powerForcedNotice: '12번째 자정 타종과 함께 지하 윤전기에 강제 전원이 인가되었습니다!',
  },

  // 심화 퍼즐: 네거티브 활자 반전 (식자공 거울상 해독)
  negativeMirror: {
    invertedLabelText: '８５３２ 號碼', // 거울상 반전된 2358
    revealedLabelText: '暗號 : ２３５８ (정방향 반사 확인)',
    mirrorCopperPos: { x: 0.85, y: 0.98, z: 1.1 },
    mirrorNoticeWithGlasses: '황동 반사판에 비친 거울상으로 정방향 암호 [2358]이 또렷하게 드러납니다!',
    mirrorNoticeWithoutGlasses: '표면이 흐릿하여 반사된 문자를 읽기 어렵습니다. 둥근 안경이 필요합니다.',
  },

  // 확장 힌트 시스템: "검열관의 붉은 먹줄" & 라디오 패닝 앰비언스
  extendedHints: {
    censorPosterTriggerTime: 60, // 60초 정체 시 붉은 먹줄 번짐
    radioAmbienceTriggerTime: 90, // 90초 정체 시 진공관 라디오 모스 부호 활성화
    radioMorseFreq: 680, // Hz
    radioWorldPos: { x: -1.72, y: 1.5, z: -6.0 }, // 복도 모퉁이 위치
    censorKeyword: '식자공 실종 사건 23:58',
  },

  // 수첩(Notebook) 기록 문구
  notebookClues: {
    worklog: { id: 'clue_worklog', text: '작업일지: 안경은 오른쪽 벽 앞치마에 있다. 책상 뒤로 돌아가 획득하고 교정지를 다시 읽는다. 실종자들은 윤전기실로 불려갔다.' },
    procedure: { id: 'clue_procedure', text: '작업 수칙: 눈동자 큐브는 눈을 위로. 제목의 식·자·공은 노란 표찰 활자장에서 찾아 조판. 날짜는 서랍 번호, 멈춘 시각은 암호.' },
    maintenance: { id: 'clue_maintenance', text: '정비 기록: 세척액으로 철문 자물쇠를 닦고 조판으로 얻은 열쇠를 사용. 남은 시간 숫자는 암호가 아니다. 시계추 공명은 전원만 켠다.' },
    calendar: { id: 'clue_calendar', puzzle: 'A', text: "24일. 붉은 동그라미. '멈춘 시각에 열어라'라고 적혀 있다." },
    clock: { id: 'clue_clock', puzzle: 'A', text: "시계가 23시 58분에 멈춰 있다. 바늘 끝에 붉은 점." },
    drawer: { id: 'clue_drawer', puzzle: 'A', text: "24번 서랍에만 자물쇠가 있다. 숫자 네 자리." },
    glasses: { id: 'clue_glasses', puzzle: 'B', text: "벗어 둔 안경. 이걸 쓰면 보인다." },
    proof_glasses: { id: 'clue_proof_glasses', puzzle: 'B', text: "붉은 글씨. '눈이 위를 보게 하라'." },
    cube: { id: 'clue_cube', puzzle: 'B', text: "눈이 그려진 활자 큐브. 한 면에만 눈이 있다." },
    slot: { id: 'clue_slot', puzzle: 'B', text: "큐브가 들어갈 빈 홈이 붉게 번쩍인다." },
    proof_unreadable: { id: 'clue_proof_unreadable', puzzle: 'C', text: '책상 위 교정지를 발견했다. 작고 흐릿한 교정 표시를 읽기 어렵다. 교정용 안경을 찾아보자.' },
    proof_title: { id: 'clue_proof_title', puzzle: 'C', text: "『활판실 식자공 의문의 실종 사건』. '식자공' 세 글자에 붉은 줄." },
    galley_slot: { id: 'clue_galley_slot', puzzle: 'C', text: "한 줄에 빈칸이 세 개. 노란 라벨이 붙어 있다." },
    rack_types: { id: 'clue_rack_types', puzzle: 'C', text: "노란 라벨이 붙은 칸에 활자 세 개: 식, 자, 공." },
    benzene: { id: 'clue_benzene', puzzle: 'D', text: "앞치마 주머니의 세척용 벤젠. 굳은 피와 잉크를 지울 수 있다." },
    apron_text: { id: 'clue_apron_text', puzzle: 'D', text: "철문의 굳은 잉크를 닦아 열쇠 구멍이 드러났다." },
    clock_gong: { id: 'clue_clock_gong', puzzle: 'E', text: "시계추를 강하게 흔들자 자정의 종이 울리며 전원이 인가되었다." },
    mirror_type: { id: 'clue_mirror_type', puzzle: 'A', text: "황동판에 비친 거울상 활자에서 '2358'을 읽어냈다." },
    censor: { id: 'clue_censor', puzzle: 'A', text: "총독부 검열 통보서. 붉은 먹줄 사이로 '23:58에 24번 서랍을 열어라'라는 문구가 드러났다." },
    radio: { id: 'clue_radio', puzzle: 'A', text: "진공관 라디오의 치직거리는 모스 부호가 단서의 위치를 가리키고 있다." }
  },

  // 보상 카드 메타데이터 (9:16 / 1080x1920)
  cardRewards: {
    TYPE_B: {
      type: 'TYPE_B',
      cardId: 'type_b',
      title: '식자공의 피 묻은 유서 호외',
      headline: '『활판실 식자공 의문의 실종 사건』',
      subhead: '1934년 10월 24일 밤 11시 58분, 지하 윤전기실에서 울려 퍼진 비명',
      description: '인쇄기 롤러 사이에 끼어 있던 찢어진 삼베 앞치마와 피 묻은 활자들. 식자공은 무엇을 조판하다가 사라진 것인가.',
      notice: '※ 본 호외는 경성야록 웹 아카이브 창작물입니다.',
      stamp: '호외 (號外)'
    },
    TYPE_D: {
      type: 'TYPE_D',
      cardId: 'type_d',
      title: '저주받은 심령사진',
      headline: '『흑백 감광판에 맺힌 활판실의 망령』',
      subhead: '밤 열두 시, 활자가 스스로 움직이는 밤에 촬영된 현상 불능의 형체',
      description: '거대한 활자장 그림자 속에서 카메라 렌즈를 응시하는 기괴한 눈동자. 현상액 속에서 붉은 피가 배어 나왔다.',
      notice: '※ 본 호외는 경성야록 웹 아카이브 창작물입니다.',
      stamp: '기밀 (機密)'
    },
    TYPE_A: {
      type: 'TYPE_A',
      cardId: 'type_a',
      title: '영구결번 지면',
      headline: '『인쇄 금지 처분된 10월 25일자 1면』',
      subhead: '조선총독부 검열관에 의해 먹칠된 채 지하실에 봉인된 미발행 지면',
      description: '어두운 복도 끝 철문 너머, 지하 윤전기가 쉬지 않고 토해내던 진실의 기록. 세상에 단 한 번도 배포되지 못했다.',
      notice: '※ 본 호외는 경성야록 웹 아카이브 창작물입니다.',
      stamp: '압수 (押收)'
    },
    TYPE_C: {
      type: 'TYPE_C',
      cardId: 'type_c',
      title: '해부실 감식표 (히든 보상)',
      headline: '『경성제국대학 의학부 검시 보고서』',
      subhead: '비밀 인쇄소 변사체 3인의 해부 소견 및 납 활자 체내 각인 흔적',
      description: '모든 비밀의 퍼즐을 풀어낸 자에게만 드러난 1934년 경성 지하의 참상. 식자공들의 손가락 끝은 납으로 굳어 있었다.',
      notice: '※ 본 호외는 경성야록 웹 아카이브 창작물입니다.',
      stamp: '비전 (秘展)'
    }
  }
};

export const GAME_CONFIG = GameConfig;
