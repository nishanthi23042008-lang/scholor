import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  ExternalLink,
  Flag,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  Play,
  Rocket,
  RotateCcw,
  Sprout,
  XCircle,
} from 'lucide-react';
import {
  EducationLevel,
  ENGINEERING_BRANCHES,
  getQuestionsForBranch,
  MockQuestion,
  NON_ENG_ROADMAPS,
  RoadmapData,
} from '../data/skillBridgeData';

type SkillBridgeTab = 'roadmap' | 'mocktest' | 'hub';

interface AttemptHistoryEntry {
  id: string;
  branchLabel: string;
  score: number;
  total: number;
  percentage: number;
  mode: 'practice' | 'timed';
  completedAt: string;
}

const STREAM_BY_LEVEL: Record<EducationLevel, string[]> = {
  '1st PUC': ['Science', 'Commerce', 'Arts'],
  '2nd PUC': ['Science', 'Commerce', 'Arts'],
  Engineering: [
    'All Engineering Streams',
    'Computing & AI',
    'Electronics & Electrical',
    'Mechanical & Mobility',
    'Infrastructure & Aerospace',
    'Chemical, Bio & Materials',
  ],
  Degree: ['Science', 'Computer Applications', 'Commerce & Management', 'Arts & Humanities'],
};

function getCombosForSelection(level: EducationLevel, stream: string): Array<{ value: string; label: string }> {
  if (level === 'Engineering') {
    const branches =
      stream === 'All Engineering Streams'
        ? ENGINEERING_BRANCHES
        : ENGINEERING_BRANCHES.filter((b) => b.category === stream);
    return branches.map((b) => ({ value: b.code, label: b.name }));
  }

  if (level === 'Degree') {
    if (stream === 'Science') return [{ value: 'B.Sc / Science', label: 'B.Sc (Physics, Chemistry, Math, Bio)' }];
    if (stream === 'Computer Applications') return [{ value: 'BCA / Computing', label: 'BCA / Computer Applications' }];
    if (stream === 'Commerce & Management') return [{ value: 'B.Com / BBA', label: 'B.Com / BBA' }];
    return [{ value: 'BA / Humanities', label: 'BA / Humanities' }];
  }

  if (stream === 'Science') {
    return [
      { value: 'PCMC', label: 'PCMC (Physics, Chemistry, Math, CS)' },
      { value: 'PCMB', label: 'PCMB (Physics, Chemistry, Math, Bio)' },
      { value: 'PCMS', label: 'PCMS (Physics, Chemistry, Math, Stats)' },
    ];
  }
  if (stream === 'Commerce') return [{ value: 'Commerce', label: 'Commerce (Accountancy, Business, Economics)' }];
  return [{ value: 'Arts', label: 'Arts (History, Political Science, Sociology)' }];
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const SkillBridgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SkillBridgeTab>('roadmap');

  // Roadmap state (Defaulting to Engineering + CSE so Engineering branches are immediately showcased)
  const [level, setLevel] = useState<EducationLevel>('Engineering');
  const [stream, setStream] = useState<string>('All Engineering Streams');
  const [combo, setCombo] = useState<string>('CSE');
  const [year, setYear] = useState<string>('Year 1');
  const [language, setLanguage] = useState<string>('English');

  const [generatedRoadmap, setGeneratedRoadmap] = useState<{
    title: string;
    intro: string;
    branchKey: string;
    data: RoadmapData;
  } | null>(null);

  // Doubt search state
  const [doubt, setDoubt] = useState('');
  const [doubtError, setDoubtError] = useState('');
  const resultRef = useRef<HTMLDivElement | null>(null);
  const doubtInputRef = useRef<HTMLInputElement | null>(null);

  // Mock test state
  const [testBranchKey, setTestBranchKey] = useState<string>('CSE');
  const [testMode, setTestMode] = useState<'practice' | 'timed'>('practice');
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [testQuestions, setTestQuestions] = useState<MockQuestion[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('skillbridge_mock_history');
      return saved ? (JSON.parse(saved) as AttemptHistoryEntry[]) : [];
    } catch {
      return [];
    }
  });

  const streamOptions = STREAM_BY_LEVEL[level];
  const comboOptions = getCombosForSelection(level, stream);
  const selectedBranchObj = ENGINEERING_BRANCHES.find((b) => b.code === combo);

  const handleLevelChange = (nextLevel: EducationLevel) => {
    setLevel(nextLevel);
    const nextStreams = STREAM_BY_LEVEL[nextLevel];
    const nextStream = nextStreams[0];
    setStream(nextStream);
    const nextCombos = getCombosForSelection(nextLevel, nextStream);
    setCombo(nextCombos[0]?.value || 'CSE');
  };

  const handleStreamChange = (nextStream: string) => {
    setStream(nextStream);
    const nextCombos = getCombosForSelection(level, nextStream);
    setCombo(nextCombos[0]?.value || '');
  };

  const handleSelectEngineeringBranch = (branchCode: string) => {
    const branch = ENGINEERING_BRANCHES.find((b) => b.code === branchCode);
    if (!branch) return;
    setLevel('Engineering');
    setStream('All Engineering Streams');
    setCombo(branch.code);
    setTestBranchKey(branch.code);
    setGeneratedRoadmap({
      title: `Engineering · ${branch.name}`,
      intro: `${year} Roadmap (${branch.category}) · Language: ${language}`,
      branchKey: branch.code,
      data: {
        subjects: branch.subjects,
        skills: branch.skills,
        activities: branch.activities,
        future: branch.future,
      },
    });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleShowRoadmap = () => {
    let data: RoadmapData;
    let displayTitle = `${level} · ${stream} · ${combo}`;

    if (level === 'Engineering') {
      const branch = ENGINEERING_BRANCHES.find((b) => b.code === combo) || ENGINEERING_BRANCHES[0];
      data = {
        subjects: branch.subjects,
        skills: branch.skills,
        activities: branch.activities,
        future: branch.future,
      };
      displayTitle = `Engineering · ${branch.name}`;
      setTestBranchKey(branch.code);
    } else {
      data = NON_ENG_ROADMAPS[combo] || NON_ENG_ROADMAPS[stream] || NON_ENG_ROADMAPS.PCMC;
      setTestBranchKey(combo);
    }

    setGeneratedRoadmap({
      title: displayTitle,
      intro: `${year} learning guide · Language: ${language}`,
      branchKey: combo,
      data,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Mock test timer effect
  useEffect(() => {
    if (!testStarted || testSubmitted) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (testMode === 'timed') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, testSubmitted, testMode]);

  const startMockTest = (branchOverride?: string) => {
    const targetBranch = branchOverride || testBranchKey;
    const qs = getQuestionsForBranch(targetBranch, questionCount);
    setTestBranchKey(targetBranch);
    setTestQuestions(qs);
    setAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    setElapsedSeconds(0);
    setSecondsLeft(questionCount === 10 ? 600 : 300);
    setTestSubmitted(false);
    setTestStarted(true);
    setActiveTab('mocktest');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finalizeMockTest = React.useCallback(() => {
    if (testSubmitted || testQuestions.length === 0) return;
    setTestSubmitted(true);
    let score = 0;
    for (const q of testQuestions) {
      if (answers[q.id] === q.correctIndex) score += 1;
    }
    const percentage = Math.round((score / testQuestions.length) * 100);
    const branchLabel =
      ENGINEERING_BRANCHES.find((b) => b.code === testBranchKey)?.name || testBranchKey;

    const entry: AttemptHistoryEntry = {
      id: `${Date.now()}`,
      branchLabel,
      score,
      total: testQuestions.length,
      percentage,
      mode: testMode,
      completedAt: new Date().toISOString(),
    };
    setAttemptHistory((prev) => {
      const next = [entry, ...prev].slice(0, 8);
      try {
        localStorage.setItem('skillbridge_mock_history', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  }, [answers, testBranchKey, testMode, testQuestions, testSubmitted]);

  useEffect(() => {
    if (testStarted && !testSubmitted && testMode === 'timed' && secondsLeft === 0) {
      finalizeMockTest();
    }
  }, [testStarted, testSubmitted, testMode, secondsLeft, finalizeMockTest]);

  const trimmedDoubt = doubt.trim();
  const branchSearchLabel = selectedBranchObj ? selectedBranchObj.name : `${level} ${combo}`;
  const encodedDoubtQuery = encodeURIComponent(`${branchSearchLabel} ${trimmedDoubt}`);
  const encodedFreeLessonsQuery = encodeURIComponent(`${branchSearchLabel} free lessons`);

  const handleMissingDoubtClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!trimmedDoubt) {
      e.preventDefault();
      setDoubtError('Please type your doubt first.');
      doubtInputRef.current?.focus();
    } else {
      setDoubtError('');
    }
  };

  const currentQuestion = testQuestions[currentIdx];
  const scoreCount = testQuestions.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );
  const scorePct = testQuestions.length > 0 ? Math.round((scoreCount / testQuestions.length) * 100) : 0;

  return (
    <div className="bg-slate-50">
      {/* Header Banner */}
      <section className="bg-[#0B162C] text-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold tracking-wider text-cyan-400">
              SKILLBRIDGE · ALL ENGINEERING BRANCHES &amp; MOCK TESTS
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Skill<span className="text-cyan-400">Bridge</span> — Roadmaps &amp; Mock Test Lab
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Explore all 18 Engineering branches, build your learning roadmap, and test core concepts with interactive mock tests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-800/80 p-1 shrink-0">
            {(
              [
                { id: 'roadmap', label: 'Roadmaps & Branches' },
                { id: 'mocktest', label: 'Mock Test Lab' },
                { id: 'hub', label: 'Ask Doubt & Free Hub' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* TAB 1: ROADMAPS & ALL ENGINEERING BRANCHES */}
        {activeTab === 'roadmap' && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    Find Your Learning Roadmap
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose your education level and branch (including all 18 Engineering specializations, PUC, and Degree tracks).
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="sb-level" className="block text-xs font-bold text-slate-800">
                    Education level
                  </label>
                  <select
                    id="sb-level"
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value as EducationLevel)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Engineering">Engineering (B.E. / B.Tech — All Branches)</option>
                    <option value="1st PUC">1st PUC</option>
                    <option value="2nd PUC">2nd PUC</option>
                    <option value="Degree">Degree (B.Sc / BCA / B.Com / BA)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sb-stream" className="block text-xs font-bold text-slate-800">
                    Course / Stream
                  </label>
                  <select
                    id="sb-stream"
                    value={stream}
                    onChange={(e) => handleStreamChange(e.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {streamOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sb-combo" className="block text-xs font-bold text-slate-800">
                    Combination / Engineering Branch
                  </label>
                  <select
                    id="sb-combo"
                    value={combo}
                    onChange={(e) => {
                      setCombo(e.target.value);
                      setTestBranchKey(e.target.value);
                    }}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {comboOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sb-year" className="block text-xs font-bold text-slate-800">
                    Academic year
                  </label>
                  <select
                    id="sb-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sb-language" className="block text-xs font-bold text-slate-800">
                    Language
                  </label>
                  <select
                    id="sb-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleShowRoadmap}
                  className="min-h-[44px] rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  Show My Roadmap →
                </button>
                <button
                  type="button"
                  onClick={() => startMockTest(combo)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <ClipboardCheck className="h-4 w-4 text-blue-700" />
                  Take {combo} Mock Test
                </button>
              </div>
            </section>

            {/* GENERATED ROADMAP RESULT */}
            {generatedRoadmap && (
              <section
                ref={resultRef}
                aria-live="polite"
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
              >
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-blue-700">YOUR ROADMAP</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{generatedRoadmap.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{generatedRoadmap.intro}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startMockTest(generatedRoadmap.branchKey)}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <ClipboardCheck className="h-4 w-4 text-cyan-400" />
                    Practice Mock Test →
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <BookOpen className="h-4 w-4 text-blue-700" />
                      Core Subjects
                    </h4>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {generatedRoadmap.data.subjects.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      Technical &amp; Soft Skills
                    </h4>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {generatedRoadmap.data.skills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Sprout className="h-4 w-4 text-emerald-700" />
                      Hands-On Activities
                    </h4>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {generatedRoadmap.data.activities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Rocket className="h-4 w-4 text-blue-700" />
                      Career &amp; Higher Study Pathways
                    </h4>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {generatedRoadmap.data.future.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>
            )}

            {/* ALL 18 ENGINEERING BRANCHES DIRECTORY */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-slate-100 p-2.5 text-slate-800">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      All Engineering Branches Directory ({ENGINEERING_BRANCHES.length} Disciplines)
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Click any branch to view its curated subjects, tools, and launch a branch-specific mock test.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ENGINEERING_BRANCHES.map((branch) => {
                  const isActive = level === 'Engineering' && combo === branch.code;
                  return (
                    <article
                      key={branch.code}
                      className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          <span className="font-mono font-bold text-blue-700">{branch.code}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>{branch.category}</span>
                        </p>
                        <h3 className="mt-1.5 text-sm font-bold text-slate-900">{branch.name}</h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {branch.subjects.slice(0, 2).join(' · ')}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleSelectEngineeringBranch(branch.code)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          View Roadmap
                        </button>
                        <button
                          type="button"
                          onClick={() => startMockTest(branch.code)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mock Test →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* TAB 2: INTERACTIVE MOCK TEST LAB */}
        {activeTab === 'mocktest' && (
          <div className="space-y-6">
            {!testStarted ? (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      Engineering &amp; Academic Mock Test Lab
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Choose any of the 18 Engineering branches, PUC, or Degree tracks to benchmark your core fundamentals.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="mt-branch" className="block text-xs font-bold text-slate-800">
                      Select Engineering Branch / Track
                    </label>
                    <select
                      id="mt-branch"
                      value={testBranchKey}
                      onChange={(e) => setTestBranchKey(e.target.value)}
                      className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <optgroup label="All 18 Engineering Branches">
                        {ENGINEERING_BRANCHES.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="PUC & Degree Tracks">
                        <option value="PCMC">PUC Science · PCMC</option>
                        <option value="PCMB">PUC Science · PCMB</option>
                        <option value="PCMS">PUC Science · PCMS</option>
                        <option value="Commerce">PUC Commerce</option>
                        <option value="Arts">PUC Arts</option>
                        <option value="B.Sc / Science">Degree · B.Sc Science</option>
                        <option value="BCA / Computing">Degree · BCA Computing</option>
                        <option value="B.Com / BBA">Degree · B.Com / BBA</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mt-mode" className="block text-xs font-bold text-slate-800">
                      Exam Mode
                    </label>
                    <select
                      id="mt-mode"
                      value={testMode}
                      onChange={(e) => setTestMode(e.target.value as 'practice' | 'timed')}
                      className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="practice">Practice Mode (No Timer, Instant Check)</option>
                      <option value="timed">Timed Exam Mode (Countdown Timer)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mt-count" className="block text-xs font-bold text-slate-800">
                      Questions Count
                    </label>
                    <select
                      id="mt-count"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value) as 5 | 10)}
                      className="mt-1.5 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value={5}>5 Questions (Quick Sprint)</option>
                      <option value={10}>10 Questions (Extended Mock)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => startMockTest(testBranchKey)}
                    className="min-h-[44px] rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                  >
                    Start Mock Test →
                  </button>
                  <span className="text-xs text-slate-500">
                    Step-by-step explanations included · Review topics with free video lessons
                  </span>
                </div>

                {attemptHistory.length > 0 && (
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-900">Recent Mock Test Attempts</h3>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-2.5 font-semibold">Branch / Track</th>
                            <th className="px-4 py-2.5 font-semibold">Mode</th>
                            <th className="px-4 py-2.5 font-semibold">Score</th>
                            <th className="px-4 py-2.5 font-semibold">Completed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attemptHistory.map((h) => (
                            <tr key={h.id}>
                              <td className="px-4 py-2.5 font-medium text-slate-900">{h.branchLabel}</td>
                              <td className="px-4 py-2.5 capitalize text-slate-600">{h.mode}</td>
                              <td className="px-4 py-2.5 font-mono font-bold text-blue-700 tabular-nums">
                                {h.score}/{h.total} ({h.percentage}%)
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-500 tabular-nums">
                                {new Date(h.completedAt).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            ) : !testSubmitted && currentQuestion ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Active Question Stage */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        {ENGINEERING_BRANCHES.find((b) => b.code === testBranchKey)?.name || testBranchKey}
                        <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
                        <span className="text-slate-600">{currentQuestion.topic}</span>
                      </p>
                      <h2 className="mt-1 font-mono text-sm font-bold text-slate-900 tabular-nums">
                        Question {currentIdx + 1} of {testQuestions.length}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs font-semibold tabular-nums">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-blue-700" />
                        {testMode === 'timed'
                          ? `Remaining: ${formatTimer(secondsLeft)}`
                          : `Elapsed: ${formatTimer(elapsedSeconds)}`}
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 text-base font-semibold leading-relaxed text-slate-900">
                    {currentQuestion.question}
                  </p>

                  <div className="mt-5 space-y-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const isChosen = answers[currentQuestion.id] === idx;
                      const showInstantFeedback =
                        testMode === 'practice' && answers[currentQuestion.id] !== undefined;
                      const isCorrectOption = idx === currentQuestion.correctIndex;

                      let borderClass = 'border-slate-200 bg-white hover:border-slate-300';
                      if (showInstantFeedback) {
                        if (isCorrectOption) {
                          borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-950';
                        } else if (isChosen) {
                          borderClass = 'border-red-400 bg-red-50 text-red-950';
                        }
                      } else if (isChosen) {
                        borderClass = 'border-blue-600 bg-blue-50/70 text-blue-950';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: idx,
                            }))
                          }
                          className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${borderClass}`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span>{opt}</span>
                          </span>
                          {showInstantFeedback && isCorrectOption && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                          )}
                          {showInstantFeedback && isChosen && !isCorrectOption && (
                            <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {testMode === 'practice' && answers[currentQuestion.id] !== undefined && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                      <strong className="text-slate-900">Concept Explanation:</strong>{' '}
                      {currentQuestion.explanation}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                        className="min-h-[40px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        ← Previous
                      </button>
                      <button
                        type="button"
                        disabled={currentIdx === testQuestions.length - 1}
                        onClick={() =>
                          setCurrentIdx((i) => Math.min(testQuestions.length - 1, i + 1))
                        }
                        className="min-h-[40px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Next Question →
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFlagged((prev) => ({
                            ...prev,
                            [currentQuestion.id]: !prev[currentQuestion.id],
                          }))
                        }
                        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                          flagged[currentQuestion.id]
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {flagged[currentQuestion.id] ? 'Flagged' : 'Flag for Review'}
                      </button>

                      <button
                        type="button"
                        onClick={finalizeMockTest}
                        className="min-h-[40px] rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                      >
                        Submit Mock Test
                      </button>
                    </div>
                  </div>
                </section>

                {/* Navigator Sidebar */}
                <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-4">
                  <h3 className="text-sm font-bold text-slate-900">Question Navigator</h3>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {Object.keys(answers).length} of {testQuestions.length} answered
                  </p>

                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {testQuestions.map((q, idx) => {
                      const isCurrent = idx === currentIdx;
                      const isAnswered = answers[q.id] !== undefined;
                      const isFlagged = flagged[q.id];
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentIdx(idx)}
                          className={`min-h-[40px] rounded-lg border font-mono text-xs font-bold tabular-nums transition-colors ${
                            isCurrent
                              ? 'border-blue-700 bg-blue-700 text-white'
                              : isFlagged
                                ? 'border-amber-400 bg-amber-50 text-amber-900'
                                : isAnswered
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <p>Current Question · Blue Fill</p>
                    <p>Answered · Green Tint</p>
                    <p>Flagged for Review · Amber Tint</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTestStarted(false);
                      setTestSubmitted(false);
                    }}
                    className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Exit &amp; Change Branch
                  </button>
                </aside>
              </div>
            ) : (
              /* SUBMITTED RESULTS BREAKDOWN */
              <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        MOCK TEST PERFORMANCE SUMMARY
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                        Score: {scoreCount} / {testQuestions.length} ({scorePct}%)
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {scorePct >= 80
                          ? 'Strong Readiness — Excellent command of core branch fundamentals.'
                          : scorePct >= 50
                            ? 'Good Foundation — Review missed explanations and practice targeted topics.'
                            : 'Needs Topic Revision — Use the free lesson links below to strengthen fundamentals.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startMockTest(testBranchKey)}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retake Test
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestStarted(false);
                        setTestSubmitted(false);
                      }}
                      className="min-h-[42px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Choose Another Branch
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Detailed Answer Review</h3>
                  {testQuestions.map((q, idx) => {
                    const userAns = answers[q.id];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <article
                        key={q.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-500">
                            Q{idx + 1} · {q.topic}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isCorrect ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                Incorrect
                              </>
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-900">{q.question}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="text-slate-700">
                            <strong>Your Answer:</strong>{' '}
                            {userAns !== undefined ? q.options[userAns] : 'Unanswered'}
                          </p>
                          <p className="font-semibold text-emerald-800">
                            <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                          </p>
                          <p className="pt-1 text-slate-600">{q.explanation}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                              `${testBranchKey} ${q.topic} lecture`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Watch Free Lesson on {q.topic}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://nptel.ac.in/courses?search=${encodeURIComponent(q.topic)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
                          >
                            NPTEL Course Search
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 3: ASK YOUR DOUBT & FREE LEARNING HUB */}
        {activeTab === 'hub' && (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cyan-50 p-2.5 text-cyan-700">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ask Your Doubt</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Ask a question tailored to your branch ({branchSearchLabel}). Find helpful video lessons and NPTEL / Khan Academy guides.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="sb-doubt" className="block text-xs font-bold text-slate-800">
                  Type your question
                </label>
                <input
                  ref={doubtInputRef}
                  id="sb-doubt"
                  type="text"
                  value={doubt}
                  onChange={(e) => {
                    setDoubt(e.target.value);
                    if (doubtError && e.target.value.trim()) setDoubtError('');
                  }}
                  placeholder="Example: What is Nyquist sampling criterion or AVL rotation?"
                  className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                {doubtError && (
                  <p className="mt-2 text-xs font-semibold text-red-700">{doubtError}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodedDoubtQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMissingDoubtClick}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  <Play className="h-3.5 w-3.5" />
                  Find YouTube Videos
                </a>

                <a
                  href={`https://www.khanacademy.org/search?page_search_query=${encodedDoubtQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMissingDoubtClick}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Explore Khan Academy
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <a
                  href={`https://nptel.ac.in/courses?search=${encodedDoubtQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMissingDoubtClick}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-600"
                >
                  Explore NPTEL
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-emerald-700">100% FREE ACCESS</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Free Learning Hub</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Curated portals for Engineering, PUC, and Degree students ({branchSearchLabel}).
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <article className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Free Video Lessons</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Find free full playlists and concept walkthroughs for {branchSearchLabel}.
                    </p>
                  </div>
                  <div className="mt-4">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodedFreeLessonsQuery}+full+course+free`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Watch Free Videos
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>

                <article className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Khan Academy Practice</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Interactive math, physics, chemistry, and computing foundations.
                    </p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://www.khanacademy.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Explore Khan Academy
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>

                <article className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">SWAYAM Govt Courses</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Ministry of Education credit-transferable university courses free to audit.
                    </p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://swayam.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Explore SWAYAM
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>

                <article className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">NPTEL IIT/IISc Lectures</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Comprehensive recorded engineering lectures across all 18 disciplines.
                    </p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://nptel.ac.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Explore NPTEL
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
