/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workbook } from '../types';

/**
 * Generates an educational Minecraft-themed workbook client-side 
 * instantly to avoid infinite loading and enable 100% offline static gameplay (ideal for GitHub Pages).
 */
export function generateOfflineWorkbook(
  topic: string,
  difficulty: '쉬움' | '보통' | '어려움',
  count: number
): Workbook {
  const normTopic = topic.trim().toLowerCase();
  const numQuestions = Math.min(Math.max(count || 3, 1), 10);

  // Default structure
  const workbook: Workbook = {
    id: `local-custom-${Date.now()}`,
    title: `스티브의 ${topic} 제련소 수첩`,
    description: `오프라인 레드스톤 코어를 감지하여 조합된 '${topic}' 비상용 학습 퀘스트 수첩입니다. 영양가 높은 문제집입니다!`,
    topic: topic,
    difficulty: difficulty,
    createdAt: new Date().toISOString(),
    isCustom: true,
    category: difficulty === '쉬움' ? 'wood' : difficulty === '보통' ? 'stone' : 'gold',
    questions: []
  };

  // Prebaked High-Quality Topics Database
  if (normTopic.includes('수학') || normTopic.includes('math') || normTopic.includes('방정식') || normTopic.includes('도형')) {
    workbook.title = `📐 레드스톤 기하·대수 연산 제련 책장`;
    workbook.description = `마력 넘치는 수식 기계 장치를 가동합니다! 기초 수학 공식을 채굴하여 오버월드를 지배해보세요.`;
    workbook.category = 'gold';
    workbook.questions = [
      {
        id: 'off-math-1',
        text: '스티브가 직사각형 모양의 당근 농장을 세우려고 합니다. 가로 폭이 N블록, 세로 폭이 (N + 4)블록일 때, 이 농장의 면적을 대수식으로 명쾌하게 정의한 공식은?',
        options: [
          '넓이 = N × (N + 4) = N² + 4N 평방미터',
          '넓이 = N + (N + 4) = 2N + 4 평방미터',
          '넓이 = N × N = N² 평방미터',
          '넓이 = 4N + 2 평방미터'
        ],
        answer: 0,
        explanation: '직사각형 면적을 도출하기 위해 공용 밑변들의 길이 곱이자 가로 × 세로 계산 공식을 적용해야 합니다. 분배법칙에 곱하면 N² + 4N이 스폰됩니다!'
      },
      {
        id: 'off-math-2',
        text: '마하의 속도로 날아가는 화살이나 두 조약돌 지점 사이의 최단 직선거리(빛의 직진 루트)를 제련하기 위해 활성화하는 전설적인 수학 기하 피타고라스 식은?',
        options: [
          '빗변의 길이 C = √(밑변A² + 높이B²)',
          '삼각형 공식 넓이 = 밑변 × 높이 ÷ 2',
          '구의 부피 공식 = 4/3 × 원주율(π) × 반지름(r³)',
          '원주율 구하기 공식 = 둘레/지름비'
        ],
        answer: 0,
        explanation: '위대한 피타고라스 학자에 따르면, 직각삼각형에서 빗변의 길이는 나머지 두 변의 제곱의 성분 합을 취한 제곱근(Root)과 정확히 성립합니다!'
      },
      {
        id: 'off-math-3',
        text: '지름이 D인 커다란 원기둥 물통 구조의 둘레(외경)를 정밀 조립할 때 지름(D)에 곱해주는 공학 비유동 상수인 원주율(π)의 가장 타당한 근사값은?',
        options: [
          '2.14159...',
          '3.14159...',
          '4.14159...',
          '1.41421...'
        ],
        answer: 1,
        explanation: '지름에 대비한 원주의 성분 비율은 대략 3.14159...에 달하며 소수점으로 끝없이 계속 대입되는 비순환 무한소수(무리수)입니다.'
      },
      {
        id: 'off-math-4',
        text: '어떤 정수 X에 5를 더한 값에 2를 곱했더니 정확히 24가 제련되었습니다. 이때 미지수 X의 신비한 좌표 값은?',
        options: [
          'X = 5',
          'X = 7',
          'X = 9',
          'X = 12'
        ],
        answer: 1,
        explanation: '방정식 2(X + 5) = 24를 풀기 위해 양변을 2로 나누면 X + 5 = 12 가 되고, 다시 5를 빼면 마법처럼 X = 7 이 획득됩니다!'
      },
      {
        id: 'off-math-5',
        text: '연산을 수행할 때 곱하기, 나누기, 더하기, 빼기가 섞여 있다면 가장 최우선적으로 폭발 처리하듯 먼저 연산 기계를 돌려야 하는 기호의 체계는?',
        options: [
          '좌측에 있는 덧셈 기호',
          '괄호 (Parentheses) 영역 안의 식',
          '우측에 있는 뺄셈 기호',
          '우선순위가 동일하므로 무조건 좌에서 우방향 연산'
        ],
        answer: 1,
        explanation: '혼합 연산에서는 늘 괄호로 밀봉된 결합 구역 안의 계산이 절대적인 최선두 행동 지표를 부여받습니다!'
      }
    ];

  } else if (normTopic.includes('과학') || normTopic.includes('science') || normTopic.includes('화학') || normTopic.includes('물리')) {
    workbook.title = `🧪 플라스크 액체 화학 원소 마법 대`;
    workbook.description = `광물이 금속 원소로 정련되듯 자연계 원리와 에너지를 배웁니다. 오프라인 물리/화학 퀘스트를 가동합니다.`;
    workbook.category = 'stone';
    workbook.questions = [
      {
        id: 'off-sci-1',
        text: '스티브가 네더랙 불꽃 온도로 드라이아이스 연구를 하던 중, 고체 물질이 액체가 되는 정체 구간을 거치지 않고 직접 곧바로 기체 상태로 변화하는 마스터 물리 용어는?',
        options: [
          '승화 (Sublimation)',
          '융해 (Melting)',
          '액화 (Liquefaction)',
          '기화 (Evaporation)'
        ],
        answer: 0,
        explanation: '승화는 온도가 급변할 때 고체 물질이 곧바로 활성 기체 분자로 이탈하여 공기 중으로 사라지는 대표적인 물리 현상입니다!'
      },
      {
        id: 'off-sci-2',
        text: '플레이어가 마크 산정에 서 있다가 번개를 정면으로 맞았습니다. 이처럼 자유롭게 이동이 가능한 극소 전하 소자들이 단선 도선을 타고 흐르는 전류의 실체는 무엇의 이동인가요?',
        options: [
          '무거운 양성자(Proton)',
          '가벼운 전자(Electron)들의 흐름',
          '수용액 속 중성자(Neutron)들의 결합체',
          '석탄 입자의 자기 정렬 비행'
        ],
        answer: 1,
        explanation: '도선을 전하 에너지로 자극하면 마이너스(-) 극성을 띤 미세 전하 소자들인 자유전자들이 규칙적으로 굴러 이동하면서 전기에너지를 정류시킵니다.'
      },
      {
        id: 'off-sci-3',
        text: '스티브가 용광로(Blast Furnace)에 붉은색 철광석 전구체를 넣고 구워 단단한 철 주괴(Iron Ingot)를 복사했습니다. 이 과정처럼 원래 합쳐져 있던 산소를 떼어 잃어버리고 원래의 귀금속 원자로 환원 복귀하는 화학 반응식 명칭은?',
        options: [
          '산화 반응 (Oxidation)',
          '열핵 융합 반응',
          '환원 반응 (Reduction)',
          '산-염기 중화 마법'
        ],
        answer: 2,
        explanation: '산소 기체를 방출하거나 전자를 보강받아 원래의 단질 원소 형태로 복구 수집하는 정밀 반응을 산화-환원의 보완 법칙 중 환원 반응이라 칭합니다!'
      },
      {
        id: 'off-sci-4',
        text: '물(H₂O) 분자를 아주 뜨거운 레드스톤 가스 열로 전기분해 하였습니다. 이때 플러스(+) 전극 촉매 단자가 가열된 칸에서 거품으로 채굴 배출되는 기체는 무엇일까요?',
        options: [
          '수소 기체 (H₂)',
          '산소 기체 (O₂)',
          '이산화탄소 (CO₂)',
          '헬륨 가스'
        ],
        answer: 1,
        explanation: '물을 전기로 정밀 파쇄하면 마이너스 전극에서는 연소성이 높은 수소 기체가 스폰되고, 플러스 전극에서는 호흡에 꼭 필요한 산소 기체가 모여 추출됩니다!'
      }
    ];

  } else if (normTopic.includes('역사') || normTopic.includes('한국사') || normTopic.includes('history')) {
    workbook.title = `📜 스티브의 한국사 역사 제련 인벤토리`;
    workbook.description = `백성들의 삶을 더 편하게 만들기 위해 한글을 제련하시고 영토를 활활 넓히신 역사 위인들과의 만남!`;
    workbook.category = 'wood';
    workbook.questions = [
      {
        id: 'off-hist-1',
        text: '스티브가 조선 시대로 통하는 시간차 포탈을 작동시켰습니다! 백성들이 누구나 글 문자를 쉽고 지능적이게 채광하고 인벤토리에 가치 있는 지식으로 보관할 수 있게 세종대왕이 1443년에 공식 스폰(창제)하신 고효율의 고유 한글 명칭은?',
        options: [
          '훈민정음 (한글)',
          '신지비사 에메랄드 책장',
          '이두 가죽 피스',
          '네더 석판 구결 회로'
        ],
        answer: 0,
        explanation: '세종대왕님께서는 일반 농민 유저들이 글을 몰라 크리퍼 피해를 입듯 억울하게 손해 보는 것을 지탱코자, 발음 과학을 응용하여 위대한 훈민정음(한글) 포탈을 단독 설계하여 스폰하여 주셨습니다!'
      },
      {
        id: 'off-hist-2',
        text: '임진왜란 서바이벌 당시에 이순신 대장이 "필사즉생 필생즉사" 명언으로 검을 제련하며, 단 13척의 목재 전함으로 울돌목 조류의 거친 지형 법칙을 설계 삼아 왜의 수백 함선을 대폭발 침몰시킨 해전 수호 작전명은?',
        options: [
          '한산도 광산 수비회로',
          '명량 대첩 (Battle of Myeongnyang)',
          '살수 대첩 제전',
          '노량 용암 퇴로전'
        ],
        answer: 1,
        explanation: '1597년에 벌어진 명량대첩은 영웅 이순신 장군께서 울돌목의 엄청난 유량 조류의 가속 지형 법칙을 지혜롭게 장악해 130척 이상의 적선들을 완벽 소제하셨던 전설의 승전 기록입니다.'
      },
      {
        id: 'off-hist-3',
        text: '고구려의 전성기 패키지를 획득한 정복대왕으로, 활발히 말을 타며 영토 영구 블록 장벽을 저 멀리 요동과 만주 대륙 깊숙한 전역까지 드넓게 확장하여 큰 기념비석을 세우고 고구려를 지탱했던 영웅 군주는?',
        options: [
          '백제 온조 요새 설계사',
          '고구려 광개토대왕 (Gwanggaeto the Great)',
          '신라 소수림 학술가',
          '가야 김수로 무기 대장장이'
        ],
        answer: 1,
        explanation: '광개토대왕님은 고구려 영토를 만주 지대까지 시원하게 확장하고 무시무시한 방어 영구성을 건설해 국력을 최고로 제련하신 대 정복왕이십니다.'
      }
    ];

  } else if (normTopic.includes('코딩') || normTopic.includes('코드') || normTopic.includes('프로그래밍') || normTopic.includes('javascript') || normTopic.includes('coding')) {
    workbook.title = `💻 자바스크립트 논리 레드스톤 마법서`;
    workbook.description = `조건 검색과 무한 루프, 데이터 스택 제어까지! 최고급 개발 직종으로 전직을 전개하세요.`;
    workbook.category = 'diamond';
    workbook.questions = [
      {
        id: 'off-code-1',
        text: '컴퓨터 제어문 중에서 회로에 걸려 있는 조건 감지 수식이 참(true)인 동안, 해당 프로세스 가둠 상자 코드를 쉬지 않고 연쇄 반복 가동해주는 구문 명령어는?',
        options: [
          'if (조건 분기판)',
          'while (반복 회로)',
          'return (아이템 던지기)',
          'break (레드스톤 단선)'
        ],
        answer: 1,
        explanation: 'while 루프문은 입력 감지 값이 true로 공급되는 순간까지 해당 괄호 안의 무한 연산 스폰 루프를 돌려주는 순환식 동력 파이프 구조입니다!'
      },
      {
        id: 'off-code-2',
        text: '자바스크립트(JS) 엔진에서 도중에 재설치하거나 다른 값을 변형 재할당하는 게 원천 금지되며, 한 번 지정되면 다이아몬드처럼 깨지지 않는 절대 상수를 활성화 선언하는 변수 지정자는?',
        options: [
          'var 스키마',
          'let 유동 상자',
          'const 불변 장정 (Constant)',
          'define 매크로'
        ],
        answer: 2,
        explanation: 'const 선언자는 한 번 설정되면 메모리 좌표 바인딩 정보가 고정되는 불변의 기밀 블록 변수를 활성화 정립합니다.'
      },
      {
        id: 'off-code-3',
        text: '데이터를 순차 적재할 때 후입선출(LIFO - Last In First Out) 수식을 취하여 맨 밑에 놓인 것보다 가장 최근에 제일 머리 꼭대기에 쌓은 것부터 꺼내 회수하는 특이 메모리 자료 구조는?',
        options: [
          '대기열 큐 (Queue)',
          '수직 장치 스택 (Stack)',
          '이진 트리 구조 (Tree)',
          '레드스톤 중계기 지연 버퍼'
        ],
        answer: 1,
        explanation: '정렬 스택(Stack)은 마치 플레이어가 블록 쌓기를 수직으로 빌드업한 뒤 위부터 철거하여 회수할 때 채택하는 고전적 데이터 제련 방식입니다!'
      }
    ];

  } else if (normTopic.includes('영어') || normTopic.includes('english') || normTopic.includes('영단어')) {
    workbook.title = `🇬🇧 알렉스의 오버월드 다국어 번역 수첩`;
    workbook.description = `글로벌 광부 스티브와 의사소통하기 위한 생활 영단어 제련 세션입니다.`;
    workbook.category = 'wood';
    workbook.questions = [
      {
        id: 'off-eng-1',
        text: "스폰된 주민 상인들과 에메랄드 주괴를 바쳐 도구를 교환하는 '상호 거래' 혹은 '무역'의 영문 단어와 스펠링 조합이 알맞은 것은?",
        options: [
          'TRADE (T-R-A-D-E)',
          'TREND (T-R-E-N-D)',
          'TRACK (T-R-A-C-K)',
          'TRUST (T-R-U-S-T)'
        ],
        answer: 0,
        explanation: "Trade는 서로 가치 자원을 등가 교환하는 시장 행위입니다. 주민 성직자 곡괭이 교환 시 유효한 영단어입니다!"
      },
      {
        id: 'off-eng-2',
        text: "서바이벌 생존에서 도끼, 검, 가마솥 등을 복합적으로 지칭하는 일반적인 명칭어 '유용한 도구'에 해당하는 기초 영단어는?",
        options: [
          'Toy (완구)',
          'Tool (연장 / 도구)',
          'Tall (키가 긴 형태)',
          'Tear (눈물 원석)'
        ],
        answer: 1,
        explanation: '곡괭이, 호미, 괭이 등은 전부 인생 서바이브에 도움을 보강해주는 장치형 도구(Tool) 카테고리 기적에 수렴합니다.'
      }
    ];

  } else {
    // -------------------------------------------------------------------------
    // GENERIC MULTI-TEMPLATE AI GENERATOR Fallback for ANY OTHER text!
    // -------------------------------------------------------------------------
    workbook.title = `⚙️ 스티브의 ${topic} 오프라인 제련 수첩`;
    workbook.description = `서버 통신망 단선에 따라, 동심원 레드스톤 인공 제련 코어가 즉시 '${topic}' 관련 탐사 문제를 대리 조합했습니다!`;
    workbook.category = difficulty === '어려움' ? 'gold' : difficulty === '보통' ? 'stone' : 'wood';

    const p1_options = [
      `우연성과 다상 체계로 조립된 [${topic}]의 기본 성질`,
      `[${topic}]의 핵심 원리이자 플레이어 유저가 기억해야 할 절대 지식`,
      `일정한 주기가 누락되어 마을 주민이 폐기해버린 [${topic}]의 가치`,
      `크리퍼 폭발에 의해 손상되어 파편만 남은 [${topic}]의 정보`
    ];
    const p2_options = [
      `물리적 역작용 법칙에 맞춰 지형을 파괴하는 순수 대미지`,
      `블록 제조법과 지식 제련 법칙에 완벽 부합하는 [${topic}]의 타당한 논리 체계`,
      `네더월드의 온도를 급상승시키는 자기장 필드 신호`,
      `관리자 OP 모드를 불법 스캔한 복제 오류 구조체`
    ];
    const p3_options = [
      `아무것도 채광하지 못해 낙사율이 50%나 늘어나는 생존 페널티 버프`,
      `[${topic}]에 흥미를 느끼고 깊게 소유하여 학업 및 시야 감각이 90% 증진되는 우수한 성장 버프`,
      `아이템 창의 고기 전원이 고갈되어 플레이어 이동 속도가 느려지는 기이한 마크 현상`,
      `화로 제광 속도가 전반적으로 지체되어 석탄 리소스가 낭비되는 오류 디버프`
    ];

    workbook.questions = [
      {
        id: 'off-gen-1',
        text: `풍부한 광산에서 연구 일지를 펼치던 Alex는 [${topic}]에 대칭되는 중요한 자연의 가르침을 남겨두려 합니다. 다음 논증 중 [${topic}]에 대한 올바른 설명과 기초는?`,
        options: p1_options,
        answer: 1,
        explanation: `[${topic}]의 기본은 스티브 일행이 대대손손 보관하며 활용해야 할 진리의 가르침입니다. 인벤토리에 지식으로 기억하세요!`
      },
      {
        id: 'off-gen-2',
        text: `관측기(Observer) 장전 회로 뒤편 전선에 기이한 가스 동력이 탐지되고 있습니다. 이때 회로 게이트가 원활히 작동하도록 [${topic}] 관련 지식을 투입해야 합니다. 올바른 투입 정보는?`,
        options: p2_options,
        answer: 1,
        explanation: `[${topic}]의 기둥 논리야말로 상식과 마크 공학에 부합하는 소자 조합입니다. 부단히 연구해야 마법 무기를 장전시킬 수 있습니다.`
      },
      {
        id: 'off-gen-3',
        text: `마법 부여대 주변 책장에서 흐르는 문자를 흡수하여 [${topic}]를 위한 30레벨 인챈트를 무사 성공했습니다. 다음 중 플레이어가 [${topic}]를 완벽 분석했을 때 얻게 될 혜택 효과는 무엇입니까?`,
        options: p3_options,
        answer: 1,
        explanation: `[${topic}]의 공식을 제대로 체득해둔 생존 조립사는 학업 역량이 대폭 가중되며 오버월드 지변 예측 지능이 배가되는 기분 좋은 영구 버프를 부여받습니다!`
      }
    ];
  }

  // Trim to count
  const finalQuestions = workbook.questions.slice(0, numQuestions);
  
  // If count is greater than templated, duplicate with customized labels
  const baseLen = finalQuestions.length;
  if (baseLen < numQuestions) {
    for (let i = baseLen; i < numQuestions; i++) {
      const parentQ = finalQuestions[i % baseLen];
      finalQuestions.push({
        id: `off-gen-extra-${i}`,
        text: `[외전 기밀 ${i + 1}층] 위대한 동굴 탐정 스브가 전수합니다: ${parentQ.text.substring(0, 50)}... 다음 중 [${topic}] 관련 복습형 추가 보기로 가장 상식에 부합하는 것은?`,
        options: parentQ.options,
        answer: parentQ.answer,
        explanation: `추가 복습 단계입니다! ${parentQ.explanation}`
      });
    }
  }

  workbook.questions = finalQuestions;
  return workbook;
}
