/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Flame, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  Heart, 
  Check, 
  X, 
  HelpCircle, 
  Trophy, 
  ChevronLeft, 
  Hammer,
  Backpack,
  LogOut,
  Swords,
  Timer
} from 'lucide-react';
import { STATIC_WORKBOOKS } from './data';
import { Workbook, Question, GameProgress } from './types';
import { playClick, playXp, playDamage, playLevelUp, playExplode } from './utils/audio';
import { generateOfflineWorkbook } from './utils/localGenerator';

const SPLASH_TEXTS = [
  "AI로 제련된 고품격 퀴즈!",
  "레드스톤 공학 100% 충전완료!",
  "크리퍼 대폭발 경보!",
  "용암에 아이템이 타지 않게 조심하세요!",
  "쉬움, 보통, 어려움 크래프팅 완료!",
  "엔더맨과 눈을 마주치지 마세요!",
  "다이아몬드 난이도에 도전해보세요!",
  "DungGeunMo 픽셀 폰트 완벽 장착!",
  "Steve와 Alex의 비밀 공부 수첩!",
  "공부도 서바이벌입니다!"
];

export default function App() {
  // Sound states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Workbooks list with custom preservation in localStorage
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  
  // Active states
  const [screen, setScreen] = useState<'menu' | 'craft' | 'select_world' | 'play' | 'gameover' | 'victory'>('menu');
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(null);
  const [selectedListWorkbook, setSelectedListWorkbook] = useState<Workbook | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  
  // Quiz active feedback
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isHintUsed, setIsHintUsed] = useState<boolean>(false);
  const [hintsRemaining, setHintsRemaining] = useState<number>(2); // Diamond hints
  const [timeRemaining, setTimeRemaining] = useState<number>(30); // Seconds per question
  const [activeTimer, setActiveTimer] = useState<boolean>(false);
  
  // Crafting / AI formulation states
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customDifficulty, setCustomDifficulty] = useState<'쉬움' | '보통' | '어려움'>('보통');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isCrafting, setIsCrafting] = useState<boolean>(false);
  const [craftingError, setCraftingError] = useState<string | null>(null);
  const [craftingTip, setCraftingTip] = useState<string>('');
  const [splash, setSplash] = useState<string>('');

  // User Stats (accumulated across sessions)
  const [userXp, setUserXp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [totalCleared, setTotalCleared] = useState<number>(0);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound triggering helpers
  const triggerClick = () => { if (soundEnabled) playClick(); };
  const triggerXp = () => { if (soundEnabled) playXp(); };
  const triggerDamage = () => { if (soundEnabled) playDamage(); };
  const triggerLevelUp = () => { if (soundEnabled) playLevelUp(); };
  const triggerExplode = () => { if (soundEnabled) playExplode(); };

  // Load initial data
  useEffect(() => {
    // Splash setup
    setSplash(SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)]);

    // Load custom workbooks from localStorage
    const saved = localStorage.getItem('mc_custom_workbooks_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Workbook[];
        setWorkbooks([...STATIC_WORKBOOKS, ...parsed]);
      } catch (e) {
        setWorkbooks(STATIC_WORKBOOKS);
      }
    } else {
      setWorkbooks(STATIC_WORKBOOKS);
    }

    // Load basic User accomplishments
    const savedXp = localStorage.getItem('mc_user_xp');
    const savedLevel = localStorage.getItem('mc_user_level');
    const savedCleared = localStorage.getItem('mc_user_cleared');
    if (savedXp) setUserXp(parseInt(savedXp));
    if (savedLevel) setUserLevel(parseInt(savedLevel));
    if (savedCleared) setTotalCleared(parseInt(savedCleared));
  }, []);

  // Sync state helpers
  const saveCustomWorkbooks = (updatedCustoms: Workbook[]) => {
    localStorage.setItem('mc_custom_workbooks_v1', JSON.stringify(updatedCustoms));
  };

  const addXpAndProgress = (points: number) => {
    const newXp = userXp + points;
    setUserXp(newXp);
    localStorage.setItem('mc_user_xp', newXp.toString());

    // Simple level up calculation (every 500 XP = 1 Level)
    const newLevel = Math.floor(newXp / 500) + 1;
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      localStorage.setItem('mc_user_level', newLevel.toString());
      setTimeout(() => {
        triggerLevelUp();
      }, 100);
    }
  };

  // Timer Ticking logic for Play Mode
  useEffect(() => {
    if (activeTimer && screen === 'play' && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            // Timeout! Automatically counts as wrong answer
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer, screen, timeRemaining]);

  const handleTimeout = () => {
    triggerDamage();
    setSelectedOption(-1); // special mark for timeout
    setIsAnswerRevealed(true);
    setActiveTimer(false);

    // deduct health
    if (gameProgress) {
      const nextHealth = gameProgress.health - 1;
      const isGameOver = nextHealth <= 0;
      setGameProgress({
        ...gameProgress,
        health: nextHealth,
        isGameOver
      });

      if (isGameOver) {
        setTimeout(() => {
          triggerExplode();
          setScreen('gameover');
        }, 1000);
      }
    }
  };

  // Rotation of loading tips
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCrafting) {
      const tips = [
        "화로 안의 석탄이 에너지를 주입하는 중입니다...",
        "마을 주민 과학자가 똑똑한 단어들을 제련하고 있어요.",
        "NVIDIA 광산 깊은 곳에서 문제집 블록을 캐내고 있습니다...",
        "레드스톤 중계기를 연결하여 기계를 구동하고 있습니다.",
        "마인크래프트 스타일의 문제집을 스폰시키는 중...",
        "용암 지대를 안전하게 통과해 AI 코어에 접속했습니다.",
        "인벤토리 공간을 비우고 새로운 퀴즈를 맞이할 준비를 하세요!"
      ];
      setCraftingTip(tips[0]);
      let index = 1;
      interval = setInterval(() => {
        setCraftingTip(tips[index % tips.length]);
        index++;
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isCrafting]);

  // Crafting new test via API
  const handleCraftWorkbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) {
      setCraftingError("크래프팅 조리법에 주제를 입력해 주세요!");
      return;
    }

    triggerClick();
    setIsCrafting(true);
    setCraftingError(null);

    // Set a generous 45-second timeout controller to prevent infinite loading while giving Gemini plenty of time!
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopic,
          difficulty: customDifficulty,
          count: questionCount
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("마인크래프트 레드스톤 가루가 부족합니다. 서버 응답 에러!");
      }

      const newWorkbook: Workbook = await response.json();
      
      // Save to states & localstorage
      const saved = localStorage.getItem('mc_custom_workbooks_v1');
      let customsList: Workbook[] = [];
      if (saved) {
        customsList = JSON.parse(saved);
      }
      customsList.splice(0, 0, newWorkbook); // Front prepend
      saveCustomWorkbooks(customsList);

      setWorkbooks([...STATIC_WORKBOOKS, ...customsList]);
      
      // Trigger success and immediately launch play
      triggerLevelUp();
      setSelectedWorkbook(newWorkbook);
      startWorkbookSession(newWorkbook, false);
      
      // reset forms
      setIsCrafting(false);
      setCustomTopic('');
    } catch (err: any) {
      console.warn("AI Server is offline or timed out. Handing over to local Redstone generator...", err);
      clearTimeout(timeoutId);

      try {
        // Dynamic offline local builder!
        const offlineWorkbook = generateOfflineWorkbook(customTopic, customDifficulty, questionCount);

        // Save to states & localstorage
        const saved = localStorage.getItem('mc_custom_workbooks_v1');
        let customsList: Workbook[] = [];
        if (saved) {
          customsList = JSON.parse(saved);
        }
        customsList.splice(0, 0, offlineWorkbook); // Front prepend
        saveCustomWorkbooks(customsList);

        setWorkbooks([...STATIC_WORKBOOKS, ...customsList]);

        // Launch session in offline fallback mode
        triggerLevelUp();
        setSelectedWorkbook(offlineWorkbook);
        startWorkbookSession(offlineWorkbook, true);

        // reset forms
        setIsCrafting(false);
        setCustomTopic('');
      } catch (fallbackErr: any) {
        console.error("Local generator failed too:", fallbackErr);
        triggerExplode();
        setCraftingError('조합 기계를 가동하는 로컬 메모리가 임계점을 초과했습니다.');
        setIsCrafting(false);
      }
    }
  };

  // Delete custom workbook
  const handleDeleteWorkbook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerExplode();

    const saved = localStorage.getItem('mc_custom_workbooks_v1');
    if (saved) {
      const parsed: Workbook[] = JSON.parse(saved);
      const filtered = parsed.filter(w => w.id !== id);
      saveCustomWorkbooks(filtered);
      setWorkbooks([...STATIC_WORKBOOKS, ...filtered]);
    }
  };

  // Rotate crafting properties on button click
  const cycleDifficulty = () => {
    triggerClick();
    if (customDifficulty === '쉬움') setCustomDifficulty('보통');
    else if (customDifficulty === '보통') setCustomDifficulty('어려움');
    else setCustomDifficulty('쉬움');
  };

  const cycleQuestionCount = () => {
    triggerClick();
    if (questionCount === 3) setQuestionCount(5);
    else if (questionCount === 5) setQuestionCount(8);
    else if (questionCount === 8) setQuestionCount(10);
    else setCustomTopic(''); // subtle joke: clear seed if customized
    setQuestionCount(prev => {
      if (prev === 3) return 5;
      if (prev === 5) return 8;
      if (prev === 8) return 10;
      return 3;
    });
  };

  // Initialize Game Session
  const startWorkbookSession = (workbook: Workbook, isOfflineFallback = false) => {
    triggerClick();
    setSelectedWorkbook(workbook);
    setGameProgress({
      workbookId: workbook.id,
      currentQuestionIndex: 0,
      answers: {},
      health: 3, // 3 hearts
      score: 0,
      isCompleted: false,
      isGameOver: false,
      isOfflineFallback
    });
    setHintsRemaining(2);
    setIsHintUsed(false);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setTimeRemaining(35); // 35 seconds per question
    setActiveTimer(true);
    setScreen('play');
  };

  // Submitting core option choice
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerRevealed || !gameProgress || !selectedWorkbook) return;
    
    setActiveTimer(false); // Stop the clock
    setSelectedOption(optionIndex);
    setIsAnswerRevealed(true);

    const activeQuestion = selectedWorkbook.questions[gameProgress.currentQuestionIndex];
    const isCorrect = optionIndex === activeQuestion.answer;

    let updatedHealth = gameProgress.health;
    let earnedXp = 0;

    if (isCorrect) {
      triggerXp();
      earnedXp = workbookDifficultyToXp(selectedWorkbook.difficulty);
      addXpAndProgress(earnedXp);
    } else {
      triggerDamage();
      updatedHealth -= 1;
    }

    const isGameOver = updatedHealth <= 0;

    const nextProgress = {
      ...gameProgress,
      health: updatedHealth,
      score: gameProgress.score + earnedXp,
      isGameOver,
      answers: {
        ...gameProgress.answers,
        [gameProgress.currentQuestionIndex]: optionIndex
      }
    };

    setGameProgress(nextProgress);

    if (isGameOver) {
      setTimeout(() => {
        triggerExplode();
        setScreen('gameover');
      }, 1200);
    }
  };

  const workbookDifficultyToXp = (diff: string) => {
    if (diff === '어려움') return 150;
    if (diff === '보통') return 100;
    return 60;
  };

  // Move to next question or complete game
  const handleNextQuestion = () => {
    if (!gameProgress || !selectedWorkbook) return;
    triggerClick();

    const nextIndex = gameProgress.currentQuestionIndex + 1;
    
    if (nextIndex >= selectedWorkbook.questions.length) {
      // Completed successfully!
      const clearedCount = totalCleared + 1;
      setTotalCleared(clearedCount);
      localStorage.setItem('mc_user_cleared', clearedCount.toString());

      // Clearance bonus XP!
      const clearBonus = selectedWorkbook.questions.length * 50;
      addXpAndProgress(clearBonus);
      
      setGameProgress({
        ...gameProgress,
        isCompleted: true,
        score: gameProgress.score + clearBonus
      });

      triggerLevelUp();
      setScreen('victory');
    } else {
      // Next question
      setGameProgress({
        ...gameProgress,
        currentQuestionIndex: nextIndex
      });
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setIsHintUsed(false);
      setTimeRemaining(35);
      setActiveTimer(true);
    }
  };

  // Give a Diamond Hint!
  const handleUseHint = () => {
    if (isHintUsed || hintsRemaining <= 0 || isAnswerRevealed || !selectedWorkbook || !gameProgress) return;
    triggerClick();
    triggerXp();
    setIsHintUsed(true);
    setHintsRemaining(prev => prev - 1);
  };

  return (
    <div className="min-h-screen text-white bg-[#141414] relative overflow-x-hidden select-none pb-12">
      {/* Absolute Header with Status Info */}
      {(screen === 'play' || screen === 'gameover' || screen === 'victory') && (
        <header className="border-b-4 border-black bg-[#252525] p-3 shadow-lg flex flex-wrap items-center justify-between gap-4 z-40 sticky top-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { triggerClick(); setScreen('menu'); }}>
            <div className="w-10 h-10 bg-emerald-600 border-2 border-white flex items-center justify-center font-bold text-xl text-yellow-300 shadow-md transform hover:rotate-6 transition-transform">
              ⚒️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-yellow-300" style={{ textShadow: '2px 2px 0px #000' }}>
                MINECRAFT WORKBOOK
              </h1>
              <p className="text-xs text-gray-400">Survival Study Lab v2.5</p>
            </div>
          </div>

          {/* User XP Gauge */}
          <div className="flex items-center gap-4 bg-[#1e1e1e] border-2 border-gray-600 px-4 py-2 rounded-none">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">LEVEL</span>
              <span className="text-lg font-bold text-green-400" style={{ textShadow: '1px 1px 0px #000' }}>
                {userLevel}
              </span>
            </div>
            <div className="hidden sm:flex flex-col w-32">
              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>XP Progressive</span>
                <span>{(userXp % 500)} / 500</span>
              </div>
              <div className="w-full bg-gray-800 h-3 border border-black p-0.5 relative">
                <div 
                  className="bg-green-500 h-full transition-all duration-300 shadow-inner"
                  style={{ width: `${Math.min(100, ((userXp % 500) / 500) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-xs bg-yellow-600/30 text-yellow-300 px-2.5 py-1 border border-yellow-500">
              총 {userXp} XP 획득
            </div>
          </div>

          {/* System Settings (Sound, Clearer info) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSoundEnabled(!soundEnabled); triggerXp(); }}
              className={`mc-btn ${soundEnabled ? 'mc-btn-green' : 'bg-gray-600'} !p-2 flex items-center justify-center`}
              title={soundEnabled ? "소리 켜짐" : "소리 꺼짐"}
              id="btn-sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-300 bg-black/40 px-3 py-2 border border-stone-800">
              <Trophy size={14} className="text-yellow-400" />
              완료한 맵: <b className="text-yellow-300">{totalCleared}개</b>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className={(screen === 'menu' || screen === 'craft' || screen === 'select_world') ? "" : "max-w-5xl mx-auto px-4 mt-8"}>
        
        {/* SCREEN 1: MENU SCREEN (Matching Image 1 Blurred Panorama) */}
        {screen === 'menu' && (
          <div className="absolute inset-0 min-h-screen flex flex-col justify-between mc-panorama-bg z-10 p-6 animate-fade-in text-white select-none">
            {/* Top Spacer / Title Zone (Styled like Image 1) */}
            <div className="flex flex-col items-center justify-center mt-12 sm:mt-20 relative">
              <div className="relative text-center scale-90 sm:scale-100">
                {/* 3D Drop shadowed title effect matching block theme */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-wider uppercase relative font-sans text-stone-300" style={{ textShadow: '4px 4px 0px #1a1a1a, 8px 8px 0px #000, 10px 10px 12px rgba(0,0,0,0.5)' }}>
                  <span className="text-[#4e8d2e]">MINE</span>CRAFT
                </h1>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-widest uppercase mt-[-10px] text-yellow-400 font-sans" style={{ textShadow: '3px 3px 0px #b78700, 6px 6px 0px #000' }}>
                  STUDY LAB
                </h2>
                
                {/* Yellow Bouncing Splash Text */}
                <div className="absolute -bottom-4 right-[-30px] sm:right-[-60px] transform rotate-[-12deg] bg-amber-400 text-black px-3.5 py-1.5 font-bold text-xs sm:text-sm border-2 border-black uppercase animate-bounce shadow-md select-none font-mono">
                  {splash || "AI로 제련된 퀴즈!"}
                </div>
              </div>
            </div>

            {/* Center Interactive Buttons Stack (Centered like Image 1) */}
            <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col gap-4 my-auto px-4">
              <button 
                onClick={() => { triggerClick(); setScreen('craft'); }}
                className="w-full mc-btn text-base sm:text-lg py-3.5 shadow-md flex items-center justify-center gap-3 active:scale-95"
                id="menu-btn-create-workbook"
              >
                <Plus size={20} className="text-yellow-400 shrink-0" />
                <span className="font-bold">문제집 만들기 (Create Workbook)</span>
              </button>

              <button 
                onClick={() => { triggerClick(); setScreen('select_world'); }}
                className="w-full mc-btn text-base sm:text-lg py-3.5 shadow-md flex items-center justify-center gap-3 active:scale-95"
                id="menu-btn-play-existing"
              >
                <BookOpen size={20} className="text-cyan-400 shrink-0" />
                <span className="font-bold">기존 문제 풀기 (Select Workbook)</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setSoundEnabled(!soundEnabled); triggerClick(); }}
                  className="mc-btn py-2 text-xs flex items-center justify-center gap-2"
                  id="menu-btn-options"
                >
                  {soundEnabled ? <Volume2 size={16} className="text-green-400" /> : <VolumeX size={16} className="text-red-400" />}
                  <span>소리: {soundEnabled ? "켬" : "끔"}</span>
                </button>

                <button 
                  onClick={() => {
                    triggerExplode();
                    if (confirm("통계 경험치와 저장한 모든 수첩을 초기화하시겠습니까? (서바이벌 리셋)")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="mc-btn py-2 text-xs flex items-center justify-center gap-2"
                  id="menu-btn-reset"
                >
                  <RotateCcw size={16} />
                  <span>진척 리셋</span>
                </button>
              </div>
            </div>

            {/* Footer License and Level Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-300 font-sans select-none gap-2 mt-auto border-t border-white/10 pt-4 bg-black/25 p-3">
              <div className="flex items-center gap-3.5">
                <span className="text-green-400 font-bold bg-black/40 px-2 py-0.5 border border-green-500/30">
                  STUDENT LEVEL {userLevel}
                </span>
                <span className="text-yellow-300 font-bold bg-black/40 px-2 py-0.5 border border-yellow-500/30">
                  총 {userXp} XP 획득함
                </span>
              </div>
              <div>
                Copyright Mojang Studios, AI Studio. Do not study alone!
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: CRAFT SCREEN (Create New World style matching Image 2) */}
        {screen === 'craft' && (
          <div className="absolute inset-0 min-h-screen mc-dirt-bg z-10 flex flex-col justify-between py-6 px-4 text-white animate-fade-in select-none overflow-y-auto w-full">
            
            {/* Screen Title */}
            <div className="text-center mt-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wider mb-1" style={{ textShadow: '2px 2px 0px #000' }}>
                새로운 세계(문제집) 만들기
              </h2>
              <p className="text-xs text-gray-400">Survival Study Generator</p>
            </div>

            {/* Center Controls Box */}
            <div className="max-w-xl w-full mx-auto my-auto space-y-5">
              
              {/* 1. SEED / TOPIC input (matching Image 2 text box) */}
              <div className="space-y-2 text-center sm:text-left">
                <label className="block text-sm font-semibold text-stone-300 text-left">
                  세계 생성기 시드 (주제 및 학습 영역)
                </label>
                
                <input 
                  type="text"
                  className="w-full mc-input text-left text-base"
                  placeholder="예) 마크 레드스톤, 고등 화학, 한국사 기초"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  maxLength={60}
                  required
                />
                
                <p className="text-[11px] text-stone-400 font-sans text-left">
                  임의의 시드를 가동하려면 원하는 공부 분야를 자유롭게 기입하십시오.
                </p>
              </div>

              {/* 2. Interactive Column Option Buttons (matching Image 2 layouts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                {/* Difficulty Select Toggle Button */}
                <div className="flex flex-col gap-1">
                  <button 
                    type="button"
                    onClick={cycleDifficulty}
                    className="w-full mc-btn py-3 text-xs sm:text-sm font-bold active:scale-95"
                  >
                    난이도 설정: <span className="text-yellow-300 font-black">[{customDifficulty}]</span>
                  </button>
                  <span className="text-[10px] text-stone-400 text-center font-sans mt-0.5">
                    난이도가 높을수록 성공 경험치(XP) 보너스가 커집니다.
                  </span>
                </div>

                {/* Question Count Select Toggle Button */}
                <div className="flex flex-col gap-1">
                  <button 
                    type="button"
                    onClick={cycleQuestionCount}
                    className="w-full mc-btn py-3 text-xs sm:text-sm font-bold active:scale-95"
                  >
                    문제 수량 설정: <span className="text-cyan-300 font-black">[{questionCount}개]</span>
                  </button>
                  <span className="text-[10px] text-stone-400 text-center font-sans mt-0.5">
                    수량이 많을수록 서바이벌 서사가 치열해집니다.
                  </span>
                </div>

                {/* Left Secondary (Static aesthetic info to match image 2) */}
                <div className="flex flex-col">
                  <button 
                    type="button"
                    disabled
                    className="w-full mc-btn mc-btn-disabled py-3 text-xs sm:text-sm font-bold opacity-80"
                  >
                    학습 게임 모드: [서바이벌 전용]
                  </button>
                  <span className="text-[10px] text-stone-500 text-center font-sans mt-0.5">
                    틀릴 때마다 크리퍼가 다가와 하트가 감소합니다.
                  </span>
                </div>

                {/* Right Secondary (Static aesthetic info to match image 2) */}
                <div className="flex flex-col">
                  <button 
                    type="button"
                    disabled
                    className="w-full mc-btn mc-btn-disabled py-3 text-xs sm:text-sm font-bold opacity-80"
                  >
                    보너스 힌트 상자: [켬 (다이아몬드)]
                  </button>
                  <span className="text-[10px] text-stone-500 text-center font-sans mt-0.5">
                    우측 도구 창에서 엔더 조언자의 비밀 힌트 편지를 줍니다.
                  </span>
                </div>

              </div>

              {/* Error report */}
              {craftingError && (
                <div className="bg-red-950/80 border-2 border-red-500 text-red-100 text-xs p-3.5 flex gap-2">
                  <X size={16} className="shrink-0 text-red-400 mt-0.5" />
                  <div>{craftingError}</div>
                </div>
              )}

              {/* Crafting commands notification text in the screenshot */}
              <div className="text-center text-xs text-stone-500 font-sans pt-1">
                /gamemode study_survival, /xp add {userLevel * 10}와 같은 학습용 제련 명령어가 적용됩니다.
              </div>

            </div>

            {/* Bottom Control Actions row (matching Image 2 bottom rows) */}
            <div className="max-w-xl w-full mx-auto grid grid-cols-2 gap-4 mt-2">
              <button 
                type="button"
                onClick={handleCraftWorkbook}
                disabled={isCrafting}
                className="mc-btn mc-btn-green py-3.5 text-xs sm:text-sm font-bold"
                id="btn-craft-world"
              >
                {isCrafting ? "제련중..." : "새로운 문제집 만들기"}
              </button>

              <button 
                type="button"
                onClick={() => { triggerClick(); setScreen('menu'); setCraftingError(null); }}
                className="mc-btn py-3.5 text-xs sm:text-sm font-bold"
                id="btn-cancel-world"
              >
                취소
              </button>
            </div>

            {/* Crafting Loading Indicator Overlay */}
            {isCrafting && (
              <div className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in animate-duration-150">
                <div className="w-20 h-20 bg-stone-700 border-4 border-dashed border-yellow-400 rounded-none flex items-center justify-center text-4xl animate-spin mb-6">
                  ⚒️
                </div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-2">AI 마법 부여대 작동 중...</h3>
                <div className="max-w-sm w-full bg-stone-900 border-2 border-stone-600 p-1 mb-4">
                  <div className="h-4 bg-green-500 animate-pulse width-progress" style={{ animationDuration: '1.5s' }} />
                </div>
                <div className="px-4 py-2 bg-stone-800 border border-stone-600 max-w-sm rounded-none">
                  <p className="text-xs text-yellow-100 italic">" {craftingTip} "</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SCREEN 3: SELECT WORKBOOK SCREEN (Mulitplayer server selection style) */}
        {screen === 'select_world' && (
          <div className="absolute inset-0 min-h-screen mc-dirt-bg z-10 flex flex-col justify-between py-6 px-4 text-white animate-fade-in select-none overflow-y-auto">
            
            {/* Screen Title */}
            <div className="text-center mt-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wider mb-1" style={{ textShadow: '2px 2px 0px #000' }}>
                세계 선택 (수첩 목록)
              </h2>
              <p className="text-xs text-gray-400">플레이할 수중 세계 또는 조합 수첩을 선택하십시오.</p>
            </div>

            {/* Center World Save Cards Box */}
            <div className="max-w-xl w-full mx-auto my-auto space-y-4">
              
              {/* Scrollable container mimicking Minecraft multiplayer/world saves scroll */}
              <div className="w-full bg-[#111111]/95 border-4 border-stone-700 p-2.5 h-[340px] overflow-y-auto space-y-2">
                {workbooks.map((workbook) => {
                  const isSelected = selectedListWorkbook?.id === workbook.id;
                  const isCustom = workbook.isCustom;
                  
                  const iconBlock = 
                    workbook.category === 'dirt' ? '🟫' :
                    workbook.category === 'stone' ? '⚙️' :
                    workbook.category === 'wood' ? '🪵' :
                    workbook.category === 'gold' ? '🔸' :
                    '💎';

                  return (
                    <div 
                      key={workbook.id}
                      onClick={() => { triggerClick(); setSelectedListWorkbook(workbook); }}
                      className={`p-3 text-left transition-all cursor-pointer flex justify-between items-center gap-2 relative ${
                        isSelected 
                          ? 'bg-stone-800 border-4 border-white' 
                          : 'bg-stone-900/60 border-2 border-stone-800 hover:bg-stone-800/80 hover:border-stone-500'
                      }`}
                      style={{ outline: isSelected ? '4px solid #000000' : 'none', outlineOffset: '-4px' }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-yellow-100 flex-wrap">
                          <span className="text-sm">{iconBlock}</span>
                          <span className="text-sm text-yellow-250">{workbook.title}</span>
                          {isCustom && (
                            <span className="bg-purple-900/80 text-[9px] text-purple-300 font-bold px-1 py-0.25 border border-purple-500 uppercase">
                              제련됨
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400">({workbook.difficulty})</span>
                        </div>
                        
                        <p className="text-xs text-gray-400 line-clamp-2 max-w-sm sm:max-w-md">
                          {workbook.description}
                        </p>

                        <div className="flex gap-3 text-[10px] text-gray-400 pt-1">
                          <span>과목: <b className="text-[#dbdbdb] font-normal">{workbook.topic}</b></span>
                          <span>분량: <b className="text-cyan-300 font-normal">{workbook.questions.length}개 층</b></span>
                        </div>
                      </div>

                      {/* Ping bar or difficulty highlight */}
                      <div className="shrink-0 text-right space-y-1">
                        <div className="text-[9px] text-[#4ea819] font-bold tracking-tight">
                          📶 STUDY 100%
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {workbook.questions.length * 50} XP
                        </div>
                      </div>
                    </div>
                  );
                })}

                {workbooks.length === 0 && (
                  <div className="text-center py-16 text-stone-500 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">🪵</span>
                    <p className="font-bold">저장된 로컬 수첩이 없습니다.</p>
                    <p className="text-xs mt-1">이전으로 돌아가 새로운 수첩을 조합해 주세요!</p>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Actions Row (Multiplayer layout) */}
            <div className="max-w-xl w-full mx-auto space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Play Button */}
                <button 
                  type="button"
                  onClick={() => {
                    if (selectedListWorkbook) {
                      startWorkbookSession(selectedListWorkbook);
                    }
                  }}
                  disabled={!selectedListWorkbook}
                  className={`py-3.5 text-xs sm:text-sm font-bold mc-btn mc-btn-green ${!selectedListWorkbook ? 'mc-btn-disabled opacity-60' : ''}`}
                  id="btn-play-selected"
                >
                  선택한 세계로 입장
                </button>

                {/* Delete Button */}
                <button 
                  type="button"
                  onClick={(e: any) => {
                    if (selectedListWorkbook && selectedListWorkbook.isCustom) {
                      handleDeleteWorkbook(selectedListWorkbook.id, e);
                      setSelectedListWorkbook(null);
                    } else if (selectedListWorkbook && !selectedListWorkbook.isCustom) {
                      triggerExplode();
                      alert("기본으로 내장된 정식 세계(수첩)는 제거할 수 없습니다!");
                    }
                  }}
                  disabled={!selectedListWorkbook}
                  className={`py-3.5 text-xs sm:text-sm font-bold mc-btn ${(!selectedListWorkbook || !selectedListWorkbook.isCustom) ? 'mc-btn-disabled opacity-60' : 'mc-btn-red'}`}
                  id="btn-delete-selected"
                >
                  세계 파괴(삭제)
                </button>
              </div>

              {/* Cancel button */}
              <button 
                type="button"
                onClick={() => { triggerClick(); setScreen('menu'); setSelectedListWorkbook(null); }}
                className="w-full mc-btn py-3 text-xs sm:text-sm font-bold"
                id="btn-cancel-selection"
              >
                이전으로 (메뉴)
              </button>
            </div>

          </div>
        )}

        



        {/* SCREEN 2: GAMEPLAY SEANCE PLAY SCREEN */}
        {screen === 'play' && selectedWorkbook && gameProgress && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            
            {/* Top Toolbar Navigation */}
            <div className="flex items-center justify-between bg-stone-900/60 p-2.5 border-2 border-stone-800">
              <button 
                onClick={() => { triggerClick(); setScreen('menu'); }}
                className="mc-btn !p-1.5 px-3 uppercase text-xs flex items-center gap-1"
                id="btn-back-menu"
              >
                <LogOut size={12} /> 달아나기 (메뉴)
              </button>
              
              <div className="text-center">
                <span className="text-xs text-stone-400 bg-stone-950 px-2 py-1 text-center border border-stone-800">
                  {selectedWorkbook.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-stone-300 flex items-center gap-1 bg-stone-950 px-2.5 py-1">
                  <Swords size={12} className="text-stone-400" />
                  난이도: {selectedWorkbook.difficulty}
                </div>
              </div>
            </div>

            {/* Offline Fallback Warning Banner */}
            {gameProgress.isOfflineFallback && (
              <div className="bg-amber-950/80 border-2 border-amber-600 text-amber-300 text-[11px] sm:text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2 font-sans animate-pulse">
                <span>📡</span>
                <span><b>로컬 회로 가동:</b> AI 서버가 부재중(또는 정적 호스팅)이어도 안심하세요! 마크 레드스톤 비상 장치가 한 치 오차 없이 오프라인 문제집을 완벽 합성하였습니다!</span>
              </div>
            )}

            {/* Sub HUD Display Panel (Hearts / Countdown Timer / Progress) */}
            <div className="bg-[#3c3c3c] border-4 border-black p-4 flex flex-wrap items-center justify-between gap-4 mc-inner-container">
              
              {/* Hearts Health Indicator */}
              <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 border border-stone-700">
                <span className="text-xs text-gray-400 uppercase mr-1">체력:</span>
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, idx) => {
                    const isFallen = idx >= gameProgress.health;
                    return (
                      <Heart 
                        key={idx} 
                        size={21} 
                        className={`transition-transform duration-300 ${isFallen ? 'text-stone-700 fill-stone-800 scale-90' : 'text-red-500 fill-red-500 scale-100 animate-pulse'}`}
                        style={{ filter: isFallen ? 'grayscale(1)' : 'none' }}
                      />
                    );
                  })}
                </div>
                {gameProgress.health === 1 && (
                  <span className="text-xs text-red-400 animate-ping font-bold ml-1">!!!</span>
                )}
              </div>

              {/* Ticking Countdown Clock */}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-stone-700">
                <Timer size={15} className={timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'} />
                <span className="text-xs text-gray-400">제한시간:</span>
                <span className={`font-mono text-sm font-bold ${timeRemaining < 10 ? 'text-red-400' : 'text-yellow-300'}`}>
                  {timeRemaining}초
                </span>
                {timeRemaining <= 10 && <span className="text-[10px] text-red-500 font-bold shrink-0">초조함!</span>}
              </div>

              {/* Active Sequence Question Progress */}
              <div className="text-xs font-bold text-yellow-300 bg-black/50 px-3 py-1.5 border border-stone-700">
                문제의 깊이: <span className="text-green-400">{gameProgress.currentQuestionIndex + 1}</span> / {selectedWorkbook.questions.length} 층
              </div>

            </div>

            {/* Main Center Active Question Block */}
            {(() => {
              const question: Question = selectedWorkbook.questions[gameProgress.currentQuestionIndex];
              const isCorrectFlag = selectedOption === question.answer;

              return (
                <div className="space-y-6">
                  {/* The Quest Sign Scroll */}
                  <div className="bg-[#e4d5be] border-4 border-[#8c7454] p-6 text-black relative shadow-lg min-h-[160px] flex flex-col justify-between">
                    {/* Retro wooden support pegs */}
                    <div className="absolute -top-3 left-6 w-3 h-6 bg-amber-900 border-2 border-black" />
                    <div className="absolute -top-3 right-6 w-3 h-6 bg-amber-900 border-2 border-black" />

                    <div>
                      <div className="text-[11px] text-emerald-800 font-bold mb-2 tracking-wide uppercase">
                        ⚔️ 퀘스트 임무 {gameProgress.currentQuestionIndex + 1}
                      </div>
                      <p className="text-sm sm:text-base md:text-lg font-bold leading-relaxed whitespace-pre-wrap font-sans text-stone-900">
                        {question.text}
                      </p>
                    </div>

                    <div className="border-t border-[#c5ae8c] pt-3 mt-4 flex items-center justify-between text-xs text-stone-600">
                      <span>조약돌 감지판 가만히 활성화됨</span>
                      {isHintUsed ? (
                        <span className="text-green-700 bg-green-200/50 px-2 py-0.5 font-bold border border-green-600/30">
                          💎 광산 돋보기(Hint) 활성화됨
                        </span>
                      ) : (
                        <span>주제: {selectedWorkbook.topic}</span>
                      )}
                    </div>
                  </div>

                  {/* Resource Inventory: Diamond Hint and items */}
                  <div className="flex items-center justify-between bg-stone-950 p-2 border-2 border-stone-800 text-xs">
                    <span className="text-stone-400">인벤토리 도구상자:</span>
                    <button 
                      onClick={handleUseHint}
                      disabled={isHintUsed || hintsRemaining <= 0 || isAnswerRevealed}
                      className={`text-[11px] px-3 py-1 bg-stone-900 border border-stone-600 font-bold flex items-center gap-1.5 ${
                        (isHintUsed || hintsRemaining <= 0 || isAnswerRevealed) 
                          ? 'opacity-40 cursor-not-allowed text-stone-500' 
                          : 'text-cyan-300 hover:border-cyan-300'
                      }`}
                      id="btn-use-hint"
                    >
                      <span>💎 [다이아몬드 힌트용 광석]</span>
                      <span className="text-white">사용 가능: {hintsRemaining}개</span>
                    </button>
                  </div>

                  {/* Dynamic Help Hint Text Box */}
                  {isHintUsed && !isAnswerRevealed && (
                    <div className="bg-cyan-950/40 border-2 border-cyan-500/60 p-3 text-xs text-cyan-200 flex gap-2">
                      <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <b>[엔더 조언자 비밀 편지]</b> 정답 번호는 홀수인지 짝수인지 감지기에 탐지되었습니다!<br/>
                        <span className="text-yellow-300">"정답 답안 번호(0부터 시작)는 {question.answer % 2 === 0 ? '짝수 번호(0번째 혹은 2번째)' : '홀수 번호(1번째 혹은 3번째)'} 칸에 제련되어 있습니다!"</span>
                      </div>
                    </div>
                  )}

                  {/* 4 Choices Formatted Output Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, idx) => {
                      const wasSelected = selectedOption === idx;
                      const isCorrectAnswer = idx === question.answer;

                      // Styles for states
                      let btnStyle = "mc-btn w-full !text-left flex items-start gap-3 min-h-[58px] p-4";
                      if (isAnswerRevealed) {
                        if (isCorrectAnswer) {
                          btnStyle += " mc-btn-green !text-white"; // correctly highlighted green in the end
                        } else if (wasSelected) {
                          btnStyle += " mc-btn-red !text-white"; // wrong selection highlighted red
                        } else {
                          btnStyle += " opacity-50 mc-btn-disabled";
                        }
                      }

                      return (
                        <button 
                          key={idx}
                          disabled={isAnswerRevealed}
                          onClick={() => handleSelectOption(idx)}
                          className={btnStyle}
                          id={`option-btn-${idx}`}
                        >
                          {/* Option Number Block */}
                          <span className={`w-6 h-6 shrink-0 flex items-center justify-center font-bold text-xs bg-black/40 text-yellow-300 border border-stone-600`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-sans whitespace-normal leading-relaxed">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback explanation details overlay */}
                  {isAnswerRevealed && (
                    <div className="bg-[#2c2c2c] border-4 border-black p-5 relative mc-inner-container">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 border-2 ${isCorrectFlag ? 'bg-green-900 border-green-500' : 'bg-red-950 border-red-500'} text-2xl shrink-0`}>
                          {isCorrectFlag ? '✅' : '❌'}
                        </div>
                        
                        <div className="space-y-1 w-full">
                          <h4 className={`text-lg font-bold ${isCorrectFlag ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedOption === -1 ? '용량 초과 시간 초과!' : isCorrectFlag ? '정밀한 타격! 정답입니다.' : '망치질 빗나감! 오답입니다.'}
                          </h4>
                          
                          <div className="text-xs text-gray-300 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                            <span className="text-yellow-400 font-bold block mb-1">🛠️ 마인크래프트 개발 수첩 주석</span>
                            {question.explanation}
                          </div>
                        </div>
                      </div>

                      {/* Next controls */}
                      <div className="mt-5 border-t border-stone-700 pt-4 flex gap-2 justify-end">
                        <button 
                          onClick={handleNextQuestion}
                          className="mc-btn mc-btn-green text-xs font-bold py-2 px-6 flex items-center gap-1.5"
                          id="btn-next-question"
                        >
                          <span>다음 단계로 채굴하기</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

        {/* SCREEN 3: GAME OVER (YOU DIED) */}
        {screen === 'gameover' && selectedWorkbook && (
          <div className="max-w-md mx-auto text-center space-y-8 py-10 animate-fade-in">
            {/* The Classic Dark Red Minecraft Death Screen Panel */}
            <div className="bg-red-950/90 border-4 border-red-600 p-8 shadow-2xl space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-red-500 uppercase tracking-widest animate-bounce" style={{ textShadow: '3px 3px 0px #000' }}>
                YOU DIED!
              </h1>
              <p className="text-sm text-red-200">
                체력이 0에 이르러 유저가 사망했습니다.
              </p>
              
              <div className="bg-black/80 p-3 border border-stone-850 text-left space-y-2 text-xs">
                <div>
                  <span className="text-stone-400">포기한 수첩:</span>{' '}
                  <span className="text-white font-bold">{selectedWorkbook.title}</span>
                </div>
                <div>
                  <span className="text-stone-400">도전 성공 문제수:</span>{' '}
                  <span className="text-yellow-400 font-bold">
                    {gameProgress ? Object.keys(gameProgress.answers).length - 1 : 0}개
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">난이도 페널티:</span>{' '}
                  <span className="text-stone-500 font-bold">없음 (낙사 방지 적용)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => { triggerClick(); if (selectedWorkbook) startWorkbookSession(selectedWorkbook); }}
                className="mc-btn mc-btn-green flex-1 text-sm gap-1.5"
                id="btn-respawn"
              >
                <RotateCcw size={16} /> 리스폰 (처음부터)
              </button>
              <button 
                onClick={() => { triggerClick(); setScreen('menu'); }}
                className="mc-btn flex-1 text-sm"
                id="btn-quit"
              >
                메인 타이틀로 탈출
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: VICTORY SCREEN (CLEARED / ESCAPED) */}
        {screen === 'victory' && selectedWorkbook && gameProgress && (
          <div className="max-w-xl mx-auto space-y-6 py-6 animate-fade-in">
            
            {/* Immersive Victory Box */}
            <div className="bg-[#1b3409] border-4 border-green-500 p-6 shadow-2xl relative text-center space-y-4">
              <div className="absolute -top-4 right-6 bg-yellow-400 text-black font-bold text-xs px-2.5 py-0.5 border-2 border-black transform rotate-6">
                LEVEL UP!
              </div>

              <span className="text-4xl">👑</span>
              
              <h1 className="text-2xl sm:text-3xl font-black text-green-300 uppercase tracking-widest" style={{ textShadow: '2px 2px 0px #000' }}>
                세계 공략 대성공!
              </h1>
              <p className="text-xs text-green-100 max-w-sm mx-auto">
                가뿐하게 사냥하고 몬스터를 물리치듯 정합한 학습 논리를 정복하고 무사 탈출하셨습니다!
              </p>

              {/* Accomplished Data */}
              <div className="bg-black/60 border border-stone-800 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-stone-850 pb-1.5">
                  <span className="text-stone-400">제련되었던 수첩:</span>
                  <span className="text-yellow-300 font-bold">{selectedWorkbook.title}</span>
                </div>
                <div className="flex justify-between border-b border-stone-850 pb-1.5">
                  <span className="text-stone-400">학습 영역:</span>
                  <span className="text-white">{selectedWorkbook.topic}</span>
                </div>
                <div className="flex justify-between border-b border-stone-850 pb-1.5">
                  <span className="text-stone-400">남아있던 하트 개수:</span>
                  <span className="text-red-400 font-bold">
                    {'❤️'.repeat(Math.max(1, gameProgress.health))}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-300 font-bold">
                  <span>지구 정복 경험치(XP) 보너스:</span>
                  <span>+{selectedWorkbook.questions.length * 50} XP</span>
                </div>
              </div>
            </div>

            {/* Answer Logs Section so user can view exactly what they got */}
            <div className="bg-stone-900 border-2 border-stone-700 p-4 space-y-4">
              <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                📖 플레이어 채점표 수기 (Review List)
              </h3>

              <div className="space-y-3">
                {selectedWorkbook.questions.map((question, idx) => {
                  const playerChoice = gameProgress.answers[idx];
                  const isCorrect = playerChoice === question.answer;

                  return (
                    <div key={idx} className="bg-black/40 p-3 border border-stone-800 text-xs flex gap-2.5 items-start">
                      <span className={`w-5 h-5 shrink-0 rounded-none flex items-center justify-center font-bold text-[10px] ${isCorrect ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                        {idx + 1}
                      </span>
                      
                      <div className="space-y-1">
                        <p className="text-white font-semibold font-sans leading-relaxed">{question.text}</p>
                        <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-3">
                          <span>선택 정답안: <b className={isCorrect ? 'text-green-400' : 'text-red-400'}>{question.options[playerChoice] || '시간 초과'}</b></span>
                          {!isCorrect && <span>올바른 정답: <b className="text-green-400">{question.options[question.answer]}</b></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => { triggerClick(); setScreen('menu'); }}
                className="mc-btn w-full text-sm"
                id="btn-finish-go-home"
              >
                메인 크래프팅 연구소로 돌아가기
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
