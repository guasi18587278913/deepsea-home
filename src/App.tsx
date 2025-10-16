import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * 深海圈官网 Demo（React 预览版）
 * 目标：兼顾「营销理解」与「功能学习入口」。
 * 约束：不展示价格；无报名表单（不出现 <input>/<select>/<textarea>/<form>）。
 * 方法：东东枪——把大变小 / 把复杂变简单 / 把抽象变具体。
 */

// ------------------------------
// 类型 & 数据
// ------------------------------

type Lesson = {
  id: string;
  title: string;
  duration: string; // 仅展示
};

type Course = {
  key: string;
  title: string;
  track: string; // ai-overseas | yt-ai | bilibili-goods
  tagline: string;
  lessons: Lesson[];
};

type UserProgress = {
  [courseKey: string]: {
    completed: string[]; // lesson ids
    last?: string; // last lesson id
  };
};

type UserState = {
  name: string;
  purchased: string[]; // course keys
  progress: UserProgress;
  loggedIn: boolean;
};

const COURSES: Course[] = [
  {
    key: "ai-overseas",
    title: "海外 AI 产品",
    track: "ai-overseas",
    tagline: "Idea → Business · 7 天打通从想法到收款",
    lessons: [
      { id: "prep-1", title: "预备：产品生意的本质", duration: "12:30" },
      { id: "base-1", title: "用 AI 编程做出第一个可用 Demo", duration: "18:10" },
      { id: "base-2", title: "接入订阅支付（Stripe/替代方案）", duration: "21:05" },
      { id: "ship-1", title: "一键部署&监控：从 0 到线上", duration: "16:44" },
      { id: "grow-1", title: "增长：7 天上线→数据驱动迭代", duration: "24:50" },
    ],
  },
  {
    key: "yt-ai",
    title: "YouTube AI 视频",
    track: "yt-ai",
    tagline: "高密度实战圈子 · 教练 1v1 + 风向标",
    lessons: [
      { id: "yt-0", title: "路径：从 0 到 YPP 的最短路径", duration: "13:40" },
      { id: "yt-1", title: "选题：爆款结构与机会识别", duration: "22:03" },
      { id: "yt-2", title: "合规：版权与申诉要点", duration: "15:28" },
      { id: "yt-3", title: "提效：工具链与工作流", duration: "17:10" },
      { id: "yt-4", title: "复盘：从失败里找到密码", duration: "19:55" },
    ],
  },
  {
    key: "bilibili-goods",
    title: "B 站好物",
    track: "bilibili-goods",
    tagline: "视频版「知乎好物」 · 30 天密集训练 + 5 个月陪伴",
    lessons: [
      { id: "b-0", title: "开场：为什么是 2025 年", duration: "09:31" },
      { id: "b-1", title: "选品：5 段式框架与工具", duration: "20:12" },
      { id: "b-2", title: "制作：不露脸也能跑通的 4 种方案", duration: "14:26" },
      { id: "b-3", title: "运营：评论区才是真战场", duration: "16:33" },
      { id: "b-4", title: "进阶：带货→商单的全链路", duration: "18:47" },
    ],
  },
];

const DEMO_PURCHASED = ["ai-overseas", "bilibili-goods"]; // 演示：已购两个方向

// ------------------------------
// 小组件
// ------------------------------

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-gray-100 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold" data-testid={`section-${id}`}>
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-label={`progress-${pct}%`}>
      <div className="h-full bg-black" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ------------------------------
// 营销：方向卡片
// ------------------------------

type Track = {
  key: string;
  title: string;
  tag: string;
  line: string;
  href: string;
  bullets: string[];
};

const TRACKS: Track[] = [
  {
    key: "ai-overseas",
    title: "海外 AI 产品",
    tag: "Idea → Business",
    line: "7 天打通从想法到收款的最短路径",
    href: "#ai-overseas",
    bullets: [
      "一年型「课程 + 圈子」：长期答疑与前沿更新",
      "不是教编程，是教用 AI 做产品生意",
      "个人开发者友好：从 MVP 到订阅支付、部署、增长",
    ],
  },
  {
    key: "yt-ai",
    title: "YouTube AI 视频",
    tag: "高密度实战圈子",
    line: "教练 1v1 + 风向标，做出能变现的长短视频",
    href: "#yt-ai",
    bullets: [
      "每月风向标：最新赛道与变现玩法",
      "教练团 1v1 深度问诊（按月）",
      "YPP 申诉与版权合规辅导",
    ],
  },
  {
    key: "bilibili-goods",
    title: "B 站好物",
    tag: "视频版「知乎好物」",
    line: "30 天密集训练 + 5 个月陪伴，跑出稳定单量",
    href: "#bilibili-goods",
    bullets: [
      "4 天直播集训 + 26 天实战",
      "不露脸也可开跑：PPT / 屏录 / 产品展示",
      "从带货到商单的全链路成长路径",
    ],
  },
];

const CASES = [
  { who: "钢铁的铁 · 58 岁零基础", what: "产品上线首日收入 $2000" },
  { who: "S.Z · AI 故事赛道", what: "90% 自动化，单月 $10,000+" },
  { who: "一君 · 海外小产品", what: "日收 $100–200，复利增长" },
];

function TrackCard({ t }: { t: Track }) {
  return (
    <a
      href={t.href}
      className="group block rounded-2xl border bg-white p-5 transition hover:shadow-md"
      data-testid={`track-card-${t.key}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>生财有术 · 深海圈</Pill>
            <Pill>{t.tag}</Pill>
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold">{t.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{t.line}</p>
        </div>
        <span className="shrink-0 rounded-full border px-3 py-1 text-xs text-gray-600 group-hover:bg-gray-50">
          了解详情 →
        </span>
      </div>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
        {t.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </a>
  );
}

function CaseCard({ who, what }: { who: string; what: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" data-testid="case-card">
      <div className="text-sm text-gray-500">{who}</div>
      <div className="mt-1 font-medium">{what}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  return (
    <details className="rounded-xl border bg-white p-4" data-testid="faq-item">
      <summary className="cursor-pointer select-none font-medium">{q}</summary>
      <div className="mt-2 text-sm leading-6 text-gray-700">{a}</div>
    </details>
  );
}

function LearningModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }
    lastFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = dialogRef.current;
    node?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      lastFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return undefined;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const goTracks = () => {
    if (typeof document !== "undefined") {
      const target = document.getElementById("tracks");
      lastFocused.current = null;
      onClose();
      if (target) {
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.location.hash = "tracks";
      }
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
          aria-label="关闭提示"
        >
          关闭
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
          学习中心
        </span>
        <h3 id="learning-modal-title" className="mt-3 text-xl font-semibold text-slate-900">
          学习中心即将上线
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          课程目录、直播回放等正在配置中。完成后我们会在生财主群第一时间同步开放通知。你可以先浏览下方方向介绍，或关注“最新进展”了解筹备情况。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goTracks}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-[#f3c5a3] via-[#f1d3bd] to-[#d7d0ff] px-5 py-2 text-sm font-medium text-slate-900 shadow-[0_16px_32px_rgba(156,120,102,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(123,101,90,0.35)]"
          >
            查看方向与准备事项
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// 功能：学习中心（无输入控件版本）
// ------------------------------

function useUser(): [UserState, (u: Partial<UserState>) => void] {
  const [state, setState] = useState<UserState>(() => {
    try {
      const raw = localStorage.getItem("dsq-user");
      if (raw) return JSON.parse(raw) as UserState;
    } catch {
      // ignore parse errors
    }
    return {
      name: "Demo 用户",
      purchased: DEMO_PURCHASED,
      progress: {},
      loggedIn: true, // 演示默认已登录
    };
  });

  const patch = (u: Partial<UserState>) => {
    setState((prev) => {
      const next = { ...prev, ...u } as UserState;
      localStorage.setItem("dsq-user", JSON.stringify(next));
      return next;
    });
  };

  return [state, patch];
}

function courseProgress(course: Course, prog: UserProgress): number {
  const info = prog[course.key];
  if (!info || !info.completed) return 0;
  const done = course.lessons.filter((l) => info.completed.includes(l.id)).length;
  return done / course.lessons.length;
}

function nextLesson(course: Course, prog: UserProgress): Lesson | undefined {
  const info = prog[course.key];
  if (!info) return course.lessons[0];
  const doneSet = new Set(info.completed || []);
  return course.lessons.find((l) => !doneSet.has(l.id)) ?? course.lessons[course.lessons.length - 1];
}

function LearningCenter({ user, onUpdate }: { user: UserState; onUpdate: (u: Partial<UserState>) => void }) {
  const purchasedCourses = useMemo(
    () => COURSES.filter((c) => user.purchased.includes(c.key)),
    [user.purchased],
  );

  const recent = useMemo(() => {
    return purchasedCourses
      .map((c) => ({ c, last: user.progress[c.key]?.last }))
      .filter((x) => Boolean(x.last));
  }, [purchasedCourses, user.progress]);

  const markComplete = (c: Course, l: Lesson) => {
    const info = user.progress[c.key] || { completed: [] };
    const completed = Array.from(new Set([...(info.completed || []), l.id]));
    onUpdate({
      progress: {
        ...user.progress,
        [c.key]: { completed, last: l.id },
      },
    });
  };

  const jumpTo = (c: Course, l: Lesson) => {
    const info = user.progress[c.key] || { completed: [] };
    onUpdate({
      progress: {
        ...user.progress,
        [c.key]: { ...info, last: l.id },
      },
    });
  };

  return (
    <div id="learn" data-testid="learning-center">
      <div className="rounded-2xl border bg-white p-5">
        {user.loggedIn ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                欢迎，{user.name}。这是你的学习中心（演示版）。
                <span className="ml-2">无价格、无表单，仅学习功能。</span>
              </div>
              <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => onUpdate({ loggedIn: false })}>
                退出
              </button>
            </div>
            {recent.length > 0 && (
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm font-medium">最近学习</div>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700">
                  {recent.map(({ c, last }) => {
                    const l = c.lessons.find((x) => x.id === last)!;
                    return (
                      <li key={c.key} className="flex items-center gap-2">
                        <span className="truncate">
                          {c.title} · {l.title}
                        </span>
                        <button
                          className="rounded border px-2 py-0.5 text-xs"
                          onClick={() => jumpTo(c, l)}
                          data-testid="resume-btn"
                        >
                          继续学习
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {purchasedCourses.map((c) => {
                const ratio = courseProgress(c, user.progress);
                const next = nextLesson(c, user.progress)!;
                return (
                  <div key={c.key} className="rounded-2xl border p-5" data-testid={`course-card-${c.key}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-500">生财有术 · 深海圈</div>
                        <h3 className="text-lg font-semibold">{c.title}</h3>
                        <p className="text-sm text-gray-600">{c.tagline}</p>
                      </div>
                      <Pill>{Math.round(ratio * 100)}%</Pill>
                    </div>
                    <div className="mt-3">
                      <ProgressBar ratio={ratio} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
                        onClick={() => jumpTo(c, next)}
                        data-testid="continue-btn"
                      >
                        继续学习：{next.title}
                      </button>
                      <a href={`#${c.key}`} className="rounded-lg border px-3 py-1.5 text-sm">
                        查看目录
                      </a>
                      <button
                        className="rounded-lg border px-3 py-1.5 text-sm"
                        onClick={() => markComplete(c, next)}
                        data-testid="complete-btn"
                      >
                        标记本课完成
                      </button>
                    </div>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {c.lessons.map((l) => {
                        const done = user.progress[c.key]?.completed?.includes(l.id);
                        return (
                          <li key={l.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {l.title} <span className="text-xs text-gray-500">· {l.duration}</span>
                            </span>
                            <span className={`text-xs ${done ? "text-green-600" : "text-gray-400"}`}>
                              {done ? "已完成" : "未完成"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">请登录后查看你的课程</div>
              <div className="text-sm text-gray-600">
                演示环境不含注册/支付；点击右侧按钮进行「一键 Demo 登录」。
              </div>
            </div>
            <button
              className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
              onClick={() => onUpdate({ loggedIn: true, purchased: DEMO_PURCHASED })}
              data-testid="demo-login"
            >
              Demo 登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------
// 页面
// ------------------------------

export default function DeepSeaHome() {
  const [now, setNow] = useState<string>(() => new Date().toLocaleString());
  const [user, updateUser] = useUser();
  const [showLearningModal, setShowLearningModal] = useState(false);

  const openLearningModal = useCallback(() => setShowLearningModal(true), []);
  const closeLearningModal = useCallback(() => setShowLearningModal(false), []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleString()), 60000);
    return () => clearInterval(id);
  }, []);

  // ------------------------------
  // Smoke Tests（控制台输出）
  // ------------------------------
  useEffect(() => {
    const tests: { name: string; run: () => boolean | string }[] = [
      { name: "hero 存在", run: () => Boolean(document.querySelector('[data-testid="hero-title"]')) },
      {
        name: "三个方向卡片存在",
        run: () => ["ai-overseas", "yt-ai", "bilibili-goods"].every((k) =>
          Boolean(document.querySelector(`[data-testid=track-card-${k}]`)),
        ),
      },
      {
        name: "页面不包含价格与表单",
        run: () => {
          const text = document.body.innerText || "";
          const hasPriceLike = /(¥|￥|价格|折扣|优惠|\$\s?\d)/.test(text);
          const hasForm = Boolean(document.querySelector("input,select,textarea,form"));
          return !(hasPriceLike || hasForm);
        },
      },
      { name: "FAQ 至少 3 条", run: () => document.querySelectorAll('[data-testid="faq-item"]').length >= 3 },
      { name: "学习中心存在", run: () => Boolean(document.querySelector('[data-testid="learning-center"]')) },
      { name: "我的课程至少 2 个", run: () => document.querySelectorAll('[data-testid^="course-card-"]').length >= 2 },
      { name: "存在继续学习按钮", run: () => Boolean(document.querySelector('[data-testid="continue-btn"]')) },
    ];
    const results = tests.map((t) => ({ name: t.name, pass: Boolean(t.run()) }));
    // eslint-disable-next-line no-console
    console.table(results);
  }, []);

  // 附加校验：根据截图要求隐藏/删除的文案与模块
  useEffect(() => {
    const body = document.body.innerText || "";
    const extra = [
      { name: "无右侧三句话模块", pass: body.indexOf("三句话说明白") === -1 },
      { name: "why 无副标题关键词", pass: body.indexOf("三个关键词") === -1 },
      {
        name: "hero 无阶段性提示",
        pass: body.indexOf("不展示价格") === -1 && body.indexOf("不收集报名表单") === -1,
      },
    ];
    console.table(extra);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <LearningModal open={showLearningModal} onClose={closeLearningModal} />
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Pill>生财有术 · 深海圈</Pill>
            <a href="#home" className="font-semibold">
              深海圈
            </a>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#why">我们怎么做</a>
            <a href="#tracks">方向</a>
            <a href="#proof">学员案例</a>
            <a href="#learn">学习中心</a>
            <a href="#faq">FAQ</a>
            <a href="#updates">最新进展</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="border-b pb-12 pt-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold leading-tight md:text-4xl" data-testid="hero-title">
                深海圈：在「航海」基础上的长周期深耕陪伴
              </h1>
              <p className="mt-3 text-gray-700">
                面向「对某领域有深耕想法、已拿过成果、愿投入时间行动」的圈友，
                通过 <b>课程 + 圈子</b> 的方式，帮助你把项目从 <b>1 做到 10</b>。
                当前阶段不展示价格、不收集报名表单；新增 <b>学习中心</b> 作为课程入口。
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Pill>长周期陪伴</Pill>
                <Pill>双向匹配</Pill>
                <Pill>重执行与心力</Pill>
                <span className="text-xs">{now} 更新</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openLearningModal}
                  className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                  进入学习中心 →
                </button>
                <a href="#tracks" className="inline-flex items-center rounded-lg border px-4 py-2 text-sm">
                  快速选择方向
                </a>
                <a href="#why" className="inline-flex items-center rounded-lg border px-4 py-2 text-sm">
                  我们怎么做？
                </a>
              </div>
            </div>
            <div className="hidden" aria-hidden="true">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm text-gray-500">三句话说明白（把大变小）：</div>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-800">
                  <li>
                    首页做两件事：<b>快速看懂</b> + <b>把用户带去学习中心</b>。
                  </li>
                  <li>
                    学习中心：显示 <b>已购课程</b>、<b>继续学习</b>、<b>目录与进度</b>。
                  </li>
                  <li>仍不展示价格/不收集表单，尊重当前阶段。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 我们怎么做 */}
      <Section id="why" title="我们怎么做" subtitle="把复杂变简单：三个关键词">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">长周期陪伴</h3>
            <p className="mt-2 text-sm text-gray-700">
              不是一锤子买卖。以年为单位的社群支持与答疑，持续更新内容，守住执行力与心力。
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">课程 + 圈子</h3>
            <p className="mt-2 text-sm text-gray-700">
              系统课程解决“怎么做”，同频圈子解决“做下去”。两条腿走路，减少信息噪音。
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">双向匹配</h3>
            <p className="mt-2 text-sm text-gray-700">
              面向已拿成果且愿投入时间的实战派，强调价值观一致与长期主义。
            </p>
          </div>
        </div>
      </Section>

      {/* 方向列表（营销） */}
      <Section id="tracks" title="选择你的深耕方向" subtitle="先选人群，再选打法：进入详情前先看 15 秒概览">
        <div className="grid gap-4 md:grid-cols-3">
          {TRACKS.map((t) => (
            <TrackCard key={t.key} t={t} />
          ))}
        </div>
      </Section>

      {/* 简要案例（营销） */}
      <Section id="proof" title="学员代表案例" subtitle="真实与可复制，胜过夸张的形容词">
        <div className="grid gap-4 md:grid-cols-3">
          {CASES.map((c, i) => (
            <CaseCard key={i} who={c.who} what={c.what} />
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          提示：案例只做“看法与方向”的参考，不构成收益承诺。结果与时间投入、执行强度、能力基础密切相关。
        </p>
      </Section>

      {/* 学习中心（功能） */}
      <Section id="learn-section" title="学习中心" subtitle="进入你已购买的课程，继续学习并查看进度">
        <LearningCenter user={user} onUpdate={updateUser} />
      </Section>

      {/* 三个方向的极简详情锚点（不放价格不收表单） */}
      <Section id="ai-overseas" title="海外 AI 产品：Idea → Business" subtitle="7 天打通从想法到收款的最短路径">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">你将掌握</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>MVP → 订阅支付 → 部署 → 增长的闭环</li>
              <li>用 AI 编程工具（Cursor / Claude Code / 等）高效协作</li>
              <li>数据驱动迭代与出海增长路径</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">适合人群</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>有创意、想用 AI 把想法做成生意的人</li>
              <li>产品 / 运营寻求技术与商业一体化能力</li>
              <li>愿投入时间的实战派（前 2 个月建议 ≥ 每日 2 小时）</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="yt-ai" title="YouTube AI 视频：高密度实战圈子" subtitle="教练 1v1 + 风向标 + 合规辅导">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">你将获得</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>每月两次直播同步与案例复盘</li>
              <li>YPP / 版权 / 频道移除申诉辅导</li>
              <li>专属风向标与提效工具库</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">适合人群</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>已入门但增长遇到瓶颈的创作者</li>
              <li>希望用 YouTube 作为出海渠道的项目方</li>
              <li>AI 长短视频赛道的实战派</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="bilibili-goods" title="B 站好物：视频版「知乎好物」" subtitle="30 天密集训练 + 5 个月陪伴">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">你将会做</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>7 天发出第一条带货视频，跑通闭环</li>
              <li>用评论区与数据做优化，稳定单量</li>
              <li>从带货过渡到商单，建立长期项目</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold">不适合</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>只想听课不执行 / 期望一夜暴富</li>
              <li>可支配时间少于每日 2 小时</li>
              <li>抗拒出镜且不愿学习替代方案</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* FAQ（把远变近：明确当前阶段） */}
      <Section id="faq" title="常见问题（当前阶段）" subtitle="当前仅供了解：不展示价格，不收集表单">
        <div className="grid gap-4 md:grid-cols-2">
          <FAQItem
            q="我适合加入深海圈吗？"
            a={
              <>
                更匹配的伙伴通常具备三点：<b>对某领域有深耕意愿</b>、<b>已拿过阶段成果</b>、<b>愿长期投入时间</b>。我们坚持双向匹配与价值观一致。
              </>
            }
          />
          <FAQItem
            q="现在如何进一步了解？"
            a={
              <>
                先在本页选择方向，进入对应锚点阅读「方法论 / 案例 / 常见问题」。报名与价格以生财有术官方同步为准。
              </>
            }
          />
          <FAQItem
            q="是否有客服或咨询？"
            a={
              <>
                可在生财有术主群 <code>@航海团队</code>，或关注下方「最新进展」链接。我们优先投入交付打磨，减少无效沟通成本。
              </>
            }
          />
          <FAQItem
            q="为什么首页不放更多细节？"
            a={
              <>
                首页只做「拉力与分流」：先帮你 1 分钟看懂，再进方向页深读；这能降低信息负担，也符合“先改变看法，再改变行为”的路径。
              </>
            }
          />
        </div>
      </Section>

      {/* 最新进展 */}
      <Section id="updates" title="最新进展" subtitle="与生财有术官方同步">
        <div className="rounded-2xl border bg-white p-5 text-sm text-gray-700">
          <p>发售节奏、直播与材料更新将优先在生财有术全员群同步。本页会定期补充摘要与锚点。</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>✅ 官网 Demo：新增「学习中心」（无表单，无价格）。</li>
            <li>✅ Smoke Tests：保留原用例并新增 3 条与学习中心相关的用例。</li>
            <li>🟡 下一步：接入真实用户体系与进度 API（见下方问题）。</li>
          </ul>
        </div>
      </Section>

      {/* 页脚 */}
      <footer className="py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div>品牌绑定：生财有术 · 深海圈</div>
            <div>价值观与公约：沿用生财有术社群规范</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLearningModal}
              className="rounded-lg border px-3 py-1.5"
            >
              进入学习中心
            </button>
            <a href="#tracks" className="rounded-lg border px-3 py-1.5">
              回到方向选择
            </a>
            <a href="#home" className="rounded-lg border px-3 py-1.5">
              返回顶部
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
