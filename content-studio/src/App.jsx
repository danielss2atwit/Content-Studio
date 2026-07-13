import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function useCloudState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const loadedFromCloud = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('kv_store')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setState(data.value);
        loadedFromCloud.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable — cloud sync below still applies
    }
    if (!loadedFromCloud.current) return; // avoid overwriting cloud data with local defaults before the initial fetch resolves
    const timeout = setTimeout(() => {
      supabase.from('kv_store').upsert({ key, value: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' }).then(({ error }) => {
        if (error) console.error('Cloud sync failed for', key, error);
      });
    }, 600);
    return () => clearTimeout(timeout);
  }, [key, state]);

  return [state, setState];
}

const PALETTE = {
  coral: 'oklch(0.80 0.14 70)',
  sage: 'oklch(0.85 0.06 300)',
  lavender: 'oklch(0.76 0.10 285)',
  butter: 'oklch(0.87 0.10 85)',
  ink: 'oklch(0.22 0.015 50)',
  inkSoft: 'oklch(0.5 0.02 50)',
  primary: 'oklch(0.32 0.11 300)',
  gold: 'oklch(0.78 0.15 70)',
};
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_OPTIONS = ['Needs Idea', 'Idea Set', 'Scripting', 'Filming', 'Editing', 'Ready to Post', 'Posted'];
const STATUS_OPTIONS_OTHER = ['Not Started', 'Idea', 'Notes', 'Draft', 'Final', 'Ready to Post', 'Posted'];
const ACTIVITY_TYPES = ['Planning & Ideation', 'Scripting', 'Filming', 'Editing', 'Final Prep & Publishing', 'Community', 'Analytics & Performance Review'];
const PLATFORMS = ['Instagram', 'LinkedIn', 'Email'];
const CONTENT_TYPES = ['30-Sec Reel', '60-Sec Reel', 'Carousel', 'B-Roll Reel', 'Single Photo', 'Talking Head', 'Meme / Text Post'];
const TODAY = new Date();
const BASE_MONDAY = startOfWeek(TODAY);
const TODAY_KEY = dateKey(TODAY);

const TYPE_TINT_MAP = {
  'Planning & Ideation': PALETTE.sage,
  Scripting: PALETTE.lavender,
  Filming: PALETTE.coral,
  Editing: PALETTE.butter,
  'Final Prep & Publishing': PALETTE.coral,
  Community: PALETTE.sage,
  'Analytics & Performance Review': PALETTE.lavender,
};

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}
function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // Mon=0
  r.setDate(r.getDate() - dow);
  return r;
}
function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function css(str) {
  const obj = {};
  (str || '').split(';').forEach((rule) => {
    const idx = rule.indexOf(':');
    if (idx === -1) return;
    const prop = rule.slice(0, idx).trim();
    const val = rule.slice(idx + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[camel] = val;
  });
  return obj;
}

const INITIAL_PILLARS = [
  { id: 'p1', name: 'Fueling Science', emoji: '🥑', color: PALETTE.coral, about: 'Evidence-based nutrition breakdowns for runners — what to eat before, during, and after training.', days: [0, 2, 4], ideas: [{ id: 'pi1', text: 'Myth vs fact: carb loading before a 10k' }] },
  { id: 'p2', name: 'Training Diary', emoji: '🏃‍♀️', color: PALETTE.sage, about: 'Behind-the-scenes of balancing D1 training with building a company.', days: [1, 5], ideas: [{ id: 'pi2', text: 'Film a 5am practice to alarm to first rep' }] },
  { id: 'p3', name: 'Founder Log', emoji: '🛠️', color: PALETTE.lavender, about: 'Building Fuel My Stride in public — product, lessons, wins and losses.', days: [3], ideas: [] },
  { id: 'p4', name: 'Runner Community', emoji: '💬', color: PALETTE.butter, about: 'Highlighting runner questions, wins, and stories from the Fuel My Stride community.', days: [6], ideas: [] },
];

const INITIAL_SCHEDULE = [
  { title: 'Brainstorm content for the week', type: 'Planning & Ideation', minutes: 45 },
  { title: "Script out this week's posts", type: 'Scripting', minutes: 60 },
  { title: 'Film your content for the week', type: 'Filming', minutes: 90 },
  { title: 'Edit your videos', type: 'Editing', minutes: 90 },
  { title: 'Take cover photos & write captions', type: 'Final Prep & Publishing', minutes: 60 },
  { title: 'Respond & engage with your community', type: 'Community', minutes: 30 },
  { title: "Analyze last week's performance", type: 'Analytics & Performance Review', minutes: 45 },
];

const INITIAL_GENERAL_IDEAS = [
  { id: 'g1', text: `${TODAY.getFullYear()} trend-spotting: best runner launches this year`, pillarId: 'p3' },
  { id: 'g2', text: "If you're a smaller creator, your content isn't bad — you just don't know what bigger creators do", pillarId: null },
];

const INITIAL_HOOK_IDEAS = [
  { id: 'h1', text: "The breakfast mistake that's sabotaging your long run.", pillarId: 'p1' },
  { id: 'h2', text: 'I was tired of choosing between practice and building something real.', pillarId: 'p3' },
];

const INITIAL_POSTS = {
  [dateKey(addDays(BASE_MONDAY, 0))]: [{ id: 'm1', title: "3 pre-run breakfasts that won't wreck your stomach", pillarId: 'p1', status: 'Ready to Post', platforms: ['Instagram'], hook: "The breakfast mistake that's sabotaging your long run.", script: '- Why timing matters more than food\n- 3 go-to combos\n- What to avoid 90 min out', caption: "Your gut doesn't care how good the recipe sounds if you eat it at the wrong time 👀" }],
  [dateKey(addDays(BASE_MONDAY, 1))]: [{ id: 't1', title: '6am practice, 8am class: a day in my shoes', pillarId: 'p2', status: 'Filming', platforms: ['Instagram', 'LinkedIn'], hook: '', script: '', caption: '' }],
  [dateKey(addDays(BASE_MONDAY, 2))]: [{ id: 'w1', title: 'What I eat the night before a race', pillarId: 'p1', status: 'Scripting', platforms: ['Instagram'], hook: '', script: '- Dinner timing\n- Hydration plan\n- My exact plate', caption: '' }],
  [dateKey(addDays(BASE_MONDAY, 3))]: [{ id: 'th1', title: 'Why I built Fuel My Stride as a D1 athlete', pillarId: 'p3', status: 'Posted', platforms: ['LinkedIn'], hook: 'I was tired of choosing between practice and building something real.', script: '', caption: 'Posted this morning — full story in the caption.' }],
  [dateKey(addDays(BASE_MONDAY, 4))]: [{ id: 'f1', title: 'Hydration myths runners still believe', pillarId: 'p1', status: 'Ready to Post', platforms: ['Instagram'], hook: "You don't need 8 glasses a day — you need this instead.", script: '- Myth 1\n- Myth 2\n- What actually works', caption: 'Save this before your next long run 💧' }],
  [dateKey(addDays(BASE_MONDAY, 5))]: [{ id: 'sa1', title: 'Long run playlist + fuel check', pillarId: 'p2', status: 'Idea Set', platforms: ['Instagram'], hook: '', script: '', caption: '' }],
  [dateKey(addDays(BASE_MONDAY, 6))]: [{ id: 'su1', title: 'Your Sunday long run questions, answered', pillarId: 'p4', status: 'Needs Idea', platforms: [], hook: '', script: '', caption: '' }],
};

const INITIAL_STORIES_BY_DATE = {
  [TODAY_KEY]: [{ id: 's1', text: 'Poll: what should I break down next?' }],
};

const INITIAL_TASKS = [
  { id: 'tk1', text: 'Take cover photo for hydration post', done: false, tag: 'Priority' },
  { id: 'tk2', text: 'Schedule LinkedIn post', done: false, tag: 'LinkedIn' },
  { id: 'tk3', text: 'Reply to comments from this week', done: true, tag: 'Instagram' },
];

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'strategize', label: 'Strategize' },
  { key: 'plan', label: 'Plan' },
  { key: 'grid', label: 'Grid' },
];

const TASK_TAGS = ['All', 'Priority', 'Instagram', 'LinkedIn'];

function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [pillars, setPillars] = useCloudState('cs_pillars', INITIAL_PILLARS);
  const [schedule, setSchedule] = useCloudState('cs_schedule', INITIAL_SCHEDULE);
  const [generalIdeas, setGeneralIdeas] = useCloudState('cs_generalIdeas', INITIAL_GENERAL_IDEAS);
  const [hookIdeas, setHookIdeas] = useCloudState('cs_hookIdeas', INITIAL_HOOK_IDEAS);
  const [posts, setPosts] = useCloudState('cs_posts', INITIAL_POSTS);
  const [storiesByDate, setStoriesByDate] = useCloudState('cs_storiesByDate', INITIAL_STORIES_BY_DATE);
  const [tasks, setTasks] = useCloudState('cs_tasks', INITIAL_TASKS);
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedPillarId, setSelectedPillarId] = useState(null);
  const [selectedPostRef, setSelectedPostRef] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newHookText, setNewHookText] = useState('');
  const [newStoryText, setNewStoryText] = useState('');
  const [newDayStoryText, setNewDayStoryText] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  function setTab(tab) {
    setActiveTab(tab);
    setSelectedPillarId(null);
    setSelectedPostRef(null);
  }

  function pillarTint(pillarId) {
    const p = pillars.find((x) => x.id === pillarId);
    return p ? p.color : 'oklch(0.93 0.01 60)';
  }
  function pillarName(pillarId) {
    const p = pillars.find((x) => x.id === pillarId);
    return p ? p.name : 'Unassigned';
  }

  function addStoryToDate(dk, text, clear) {
    if (!text.trim()) return;
    setStoriesByDate((prev) => ({ ...prev, [dk]: [...(prev[dk] || []), { id: 'st' + Date.now(), text }] }));
    clear('');
  }
  function removeStoryFromDate(dk, id) {
    setStoriesByDate((prev) => ({ ...prev, [dk]: (prev[dk] || []).filter((x) => x.id !== id) }));
  }
  function removePost(dk, idx) {
    setPosts((prev) => ({ ...prev, [dk]: (prev[dk] || []).filter((_, i) => i !== idx) }));
  }

  function updateSelectedPost(field, value) {
    setPosts((prev) => {
      const { dateKey: dk, index } = selectedPostRef;
      const arr = [...prev[dk]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [dk]: arr };
    });
  }
  function openTodayPost() {
    if (!hasTodayPost) return;
    setActiveTab('plan');
    setSelectedPostRef({ dateKey: TODAY_KEY, index: 0 });
  }


  function togglePlatform(pf) {
    setPosts((prev) => {
      const { dateKey: dk, index } = selectedPostRef;
      const arr = [...prev[dk]];
      const p = { ...arr[index] };
      p.platforms = p.platforms.includes(pf) ? p.platforms.filter((x) => x !== pf) : [...p.platforms, pf];
      arr[index] = p;
      return { ...prev, [dk]: arr };
    });
  }

  // Mini calendar (current month)
  const firstOfMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const daysInMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate();
  const startDow = (firstOfMonth.getDay() + 6) % 7; // Mon=0
  const calendarCells = [];
  for (let i = 0; i < startDow; i++) calendarCells.push({ label: '', style: 'height:16px;' });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(new Date(TODAY.getFullYear(), TODAY.getMonth(), d));
    const dayPosts = posts[key] || [];
    const isToday = key === TODAY_KEY;
    calendarCells.push({
      label: '' + d,
      style: `height:20px;border-radius:5px;font-size:9.5px;display:flex;align-items:center;justify-content:center;color:${dayPosts.length ? 'oklch(0.25 0.02 50)' : 'oklch(0.6 0.01 60)'};${dayPosts.length ? `background:${pillarTint(dayPosts[0].pillarId)};` : ''}${isToday ? 'box-shadow:0 0 0 1.5px #fff inset;font-weight:700;' : ''}`,
    });
  }

  // TODAY
  const todayDate = TODAY;
  const topBarDateLabel = todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const todayDow = (todayDate.getDay() + 6) % 7;
  const sched = schedule[todayDow];
  const todayTask = { type: sched.type, title: sched.title, description: `Step for your Day ${todayDow + 1} batching cycle — about ${sched.minutes} min.`, tint: TYPE_TINT_MAP[sched.type] || PALETTE.sage };
  const todayPostsArr = posts[TODAY_KEY] || [];
  const hasTodayPost = todayPostsArr.length > 0;
  const todayPost = hasTodayPost ? todayPostsArr[0] : null;
  const todayStories = storiesByDate[TODAY_KEY] || [];
  const visibleTasks = tasks.filter((t) => taskFilter === 'All' || t.tag === taskFilter);

  // STRATEGIZE
  const selectedPillar = selectedPillarId ? pillars.find((p) => p.id === selectedPillarId) : null;
  const pillarOptions = [{ id: '', name: 'Unassigned' }, ...pillars.map((p) => ({ id: p.id, name: p.name }))];
  const scheduleRows = schedule.map((row, i) => ({ dayNum: i + 1, title: row.title, type: row.type, tint: TYPE_TINT_MAP[row.type] || PALETTE.sage }));

  // PLAN
  const weekStart = addDays(BASE_MONDAY, weekOffset * 7);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekRangeLabel = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}`;

  let selectedPost = null;
  let selectedPostDayLabel = '';
  let selectedDayStories = [];
  if (selectedPostRef) {
    const { dateKey: dk, index } = selectedPostRef;
    const raw = (posts[dk] || [])[index];
    if (raw) {
      selectedPost = raw;
      const d = new Date(dk + 'T00:00:00');
      selectedPostDayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      selectedDayStories = storiesByDate[dk] || [];
    }
  }

  // GRID
  const allPosts = [];
  Object.keys(posts)
    .sort()
    .reverse()
    .forEach((dk) => (posts[dk] || []).forEach((post, idx) => allPosts.push({ ...post, dk, idx })));

  return (
    <div style={css('min-height:100vh;width:100%;color:' + PALETTE.ink + ';')}>
      {/* TOP BAR */}
      <div style={css('position:sticky;top:0;z-index:40;background:oklch(0.985 0.005 70);border-bottom:1px solid oklch(0.9 0.01 60);display:flex;align-items:center;padding:16px 36px;gap:28px;')}>
        <div style={css("font-family:'Lora',serif;font-style:italic;font-weight:700;font-size:20px;letter-spacing:-0.3px;")}>Fuel My Stride</div>
        <div style={css('flex:1;')}></div>
        <div style={css('display:flex;gap:6px;background:oklch(0.94 0.006 60);border-radius:30px;padding:4px;')}>
          {TABS.map((t) => (
            <div
              key={t.key}
              onClick={() => setTab(t.key)}
              style={css(`padding:9px 20px;border-radius:24px;font-size:13.5px;font-weight:600;cursor:pointer;${activeTab === t.key ? `background:${PALETTE.primary};color:#fff;` : 'color:' + PALETTE.ink + ';'}`)}
            >
              {t.label}
            </div>
          ))}
        </div>
        <div style={css('flex:1;')}></div>
        <div style={css('font-size:13px;color:' + PALETTE.inkSoft + ';')}>{topBarDateLabel}</div>
      </div>

      {/* MAIN */}
      <div style={css('max-width:1280px;margin:0 auto;padding:38px 36px 80px;')}>
        {activeTab === 'today' && (
          <>
            <div style={css(`display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:22px;overflow:hidden;background:${todayTask.tint};margin-bottom:40px;min-height:280px;`)}>
              <div style={css('padding:44px 44px 44px 4px;display:flex;flex-direction:column;justify-content:center;')}>
                <div style={css('font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:oklch(0.35 0.02 50);margin-bottom:14px;')}>{`${topBarDateLabel} · ${todayTask.type}`}</div>
                <div style={css("font-family:'Lora',serif;font-size:38px;font-weight:700;line-height:1.1;margin-bottom:14px;max-width:480px;")}>{todayTask.title}</div>
                <div style={css('font-size:14.5px;color:oklch(0.32 0.02 50);max-width:420px;')}>{todayTask.description}</div>
              </div>
              <div style={css('display:flex;align-items:center;justify-content:center;padding:30px;')}>
                <div
                  onClick={openTodayPost}
                  style={css('width:100%;max-width:340px;background:rgba(255,255,255,0.65);border-radius:18px;padding:20px;cursor:pointer;backdrop-filter:blur(2px);')}
                >
                  {hasTodayPost ? (
                    <>
                      <span style={css('display:inline-block;background:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:10px;')}>{pillarName(todayPost.pillarId)}</span>
                      <div style={css("font-family:'Lora',serif;font-size:17px;font-weight:600;margin-bottom:6px;")}>{todayPost.title}</div>
                      <div style={css('font-size:12px;color:oklch(0.4 0.02 50);')}>{`${todayPost.status} · today's post`}</div>
                    </>
                  ) : (
                    <div style={css('font-size:13px;color:oklch(0.4 0.02 50);text-align:center;padding:10px;')}>Nothing planned yet — click to add today's post.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={css('display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:22px;')}>
              <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:18px;padding:22px;')}>
                <div style={css("font-family:'Lora',serif;font-size:16px;font-weight:700;margin-bottom:12px;")}>Today's Tasks</div>
                <div style={css('display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;')}>
                  {TASK_TAGS.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => setTaskFilter(tag)}
                      style={css(`font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;cursor:pointer;${taskFilter === tag ? `background:${PALETTE.primary};color:#fff;` : 'background:oklch(0.94 0.005 60);color:' + PALETTE.inkSoft + ';'}`)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
                {visibleTasks.map((t) => (
                  <div key={t.id} style={css('display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid oklch(0.95 0.005 60);')}>
                    <div
                      onClick={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                      style={css(`width:16px;height:16px;border-radius:5px;border:1.5px solid ${PALETTE.primary};cursor:pointer;flex:none;${t.done ? `background:${PALETTE.primary};` : ''}`)}
                    ></div>
                    <div style={css(`font-size:13.5px;${t.done ? 'text-decoration:line-through;color:' + PALETTE.inkSoft + ';' : ''}`)}>{t.text}</div>
                    <div style={css('flex:1;')}></div>
                    <span onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))} style={css('cursor:pointer;opacity:0.4;font-size:12px;')}>
                      ✕
                    </span>
                  </div>
                ))}
                <div style={css('display:flex;gap:8px;margin-top:12px;')}>
                  <input
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a task…"
                    style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13px;')}
                  />
                  <div
                    onClick={() => {
                      if (!newTaskText.trim()) return;
                      setTasks((prev) => [...prev, { id: 'tk' + Date.now(), text: newTaskText, done: false, tag: 'Priority' }]);
                      setNewTaskText('');
                    }}
                    style={css(`background:${PALETTE.primary};color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;`)}
                  >
                    +
                  </div>
                </div>
              </div>

              <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:18px;padding:22px;')}>
                <div style={css("font-family:'Lora',serif;font-size:16px;font-weight:700;margin-bottom:12px;")}>Stories</div>
                {todayStories.map((story) => (
                  <div key={story.id} style={css('display:flex;justify-content:space-between;align-items:center;background:oklch(0.22 0.015 50);color:#fff;font-size:13px;border-radius:10px;padding:10px 12px;margin-bottom:8px;')}>
                    <span>{story.text}</span>
                    <span onClick={() => removeStoryFromDate(TODAY_KEY, story.id)} style={css('cursor:pointer;opacity:0.6;')}>
                      ✕
                    </span>
                  </div>
                ))}
                <div style={css('display:flex;gap:8px;')}>
                  <input
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    placeholder="Add a story idea…"
                    style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13px;')}
                  />
                  <div
                    onClick={() => addStoryToDate(TODAY_KEY, newStoryText, setNewStoryText)}
                    style={css(`background:${PALETTE.primary};color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;`)}
                  >
                    +
                  </div>
                </div>
              </div>

              <div style={css(`background:${PALETTE.ink};color:#fff;border-radius:18px;padding:22px;`)}>
                <div style={css("font-family:'Lora',serif;font-size:16px;font-weight:700;margin-bottom:14px;")}>This Month</div>
                <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px;')}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dow, i) => (
                    <div key={'dow' + i} style={css('font-size:9.5px;text-align:center;color:oklch(0.7 0.01 60);')}>
                      {dow}
                    </div>
                  ))}
                  {calendarCells.map((cell, i) => (
                    <div key={'cell' + i} style={css(cell.style)}>
                      {cell.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'strategize' &&
          (selectedPillar ? (
            <div style={css('max-width:1040px;')}>
              <div onClick={() => setSelectedPillarId(null)} style={css('cursor:pointer;font-size:13px;color:' + PALETTE.inkSoft + ';margin-bottom:18px;')}>
                ← Back to Strategize
              </div>
              <div style={css(`background:${selectedPillar.color};border-radius:22px;padding:36px 40px;margin-bottom:28px;`)}>
                <div style={css('font-size:30px;margin-bottom:10px;')}>{selectedPillar.emoji}</div>
                <input
                  value={selectedPillar.name}
                  onChange={(e) => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, name: e.target.value } : p)))}
                  style={css("font-family:'Lora',serif;font-size:30px;font-weight:700;border:none;background:transparent;outline:none;display:block;margin-bottom:10px;width:100%;")}
                />
                <textarea
                  value={selectedPillar.about}
                  onChange={(e) => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, about: e.target.value } : p)))}
                  style={css('width:100%;min-height:44px;border:none;background:transparent;font-size:14.5px;resize:vertical;outline:none;color:oklch(0.3 0.02 50);')}
                />
              </div>

              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:28px;')}>
                <div>
                  <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px;')}>Posting days</div>
                  <div style={css('display:flex;gap:8px;margin-bottom:24px;')}>
                    {DOW.map((d, i) => (
                      <div
                        key={d}
                        onClick={() =>
                          setPillars((prev) =>
                            prev.map((p) => (p.id === selectedPillar.id ? { ...p, days: p.days.includes(i) ? p.days.filter((x) => x !== i) : [...p.days, i] } : p))
                          )
                        }
                        style={css(`width:42px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:600;cursor:pointer;${selectedPillar.days.includes(i) ? `background:${selectedPillar.color};` : 'background:#fff;color:' + PALETTE.inkSoft + ';'}`)}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div
                    onClick={() => {
                      setPillars((prev) => prev.filter((p) => p.id !== selectedPillar.id));
                      setSelectedPillarId(null);
                    }}
                    style={css('display:inline-block;font-size:12.5px;color:oklch(0.5 0.1 25);cursor:pointer;border:1px solid oklch(0.9 0.01 60);padding:7px 14px;border-radius:8px;')}
                  >
                    Delete pillar
                  </div>
                </div>

                <div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;')}>
                    <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;')}>Ideas</div>
                    <div
                      onClick={() => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, ideas: [...p.ideas, { id: 'pi' + Date.now(), text: '' }] } : p)))}
                      style={css('cursor:pointer;background:oklch(0.94 0.005 60);border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;')}
                    >
                      +
                    </div>
                  </div>
                  {selectedPillar.ideas.map((idea) => (
                    <div key={idea.id} style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;')}>
                      <textarea
                        value={idea.text}
                        onChange={(e) =>
                          setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, ideas: p.ideas.map((x) => (x.id === idea.id ? { ...x, text: e.target.value } : x)) } : p)))
                        }
                        style={css('flex:1;border:none;font-size:13.5px;resize:none;min-height:20px;outline:none;')}
                      />
                      <span
                        onClick={() => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, ideas: p.ideas.filter((x) => x.id !== idea.id) } : p)))}
                        style={css('cursor:pointer;opacity:0.4;')}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={css('max-width:1200px;')}>
              <div style={css("font-family:'Lora',serif;font-size:28px;font-weight:700;margin-bottom:18px;")}>Strategize</div>
              <div style={css('display:flex;gap:16px;overflow-x:auto;padding-bottom:10px;margin-bottom:36px;')}>
                {pillars.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPillarId(p.id)}
                    style={css(`flex:none;width:220px;height:180px;border-radius:18px;background:${p.color};padding:20px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;`)}
                  >
                    <div style={css('font-size:26px;')}>{p.emoji}</div>
                    <div>
                      <div style={css("font-family:'Lora',serif;font-size:17px;font-weight:700;margin-bottom:4px;")}>{p.name}</div>
                      <div style={css('font-size:12px;color:oklch(0.32 0.02 50);')}>{`${p.days.length} posting days/wk`}</div>
                    </div>
                  </div>
                ))}
                <div
                  onClick={() => {
                    const id = 'p' + Date.now();
                    setPillars((prev) => [...prev, { id, name: 'New Pillar', emoji: '✨', color: PALETTE.sage, about: '', days: [], ideas: [] }]);
                    setSelectedPillarId(id);
                  }}
                  style={css('flex:none;width:220px;height:180px;border-radius:18px;border:2px dashed oklch(0.85 0.01 60);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:oklch(0.55 0.02 50);')}
                >
                  + Add pillar
                </div>
              </div>

              <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;')}>
                <div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;')}>
                    <div style={css("font-family:'Lora',serif;font-size:18px;font-weight:700;")}>Batching Schedule</div>
                    <div onClick={() => setScheduleModalOpen(true)} style={css('cursor:pointer;font-size:12.5px;border:1px solid oklch(0.9 0.01 60);padding:6px 14px;border-radius:8px;')}>
                      Edit
                    </div>
                  </div>
                  <div style={css('display:flex;flex-direction:column;gap:1px;background:oklch(0.9 0.01 60);border-radius:14px;overflow:hidden;')}>
                    {scheduleRows.map((s) => (
                      <div key={s.dayNum} style={css('background:#fff;padding:12px 16px;display:flex;align-items:center;gap:14px;')}>
                        <div style={css(`width:46px;flex:none;font-size:11px;font-weight:700;color:${PALETTE.inkSoft};background:${s.tint};padding:5px 0;text-align:center;border-radius:8px;`)}>{`D${s.dayNum}`}</div>
                        <div>
                          <div style={css('font-size:13.5px;font-weight:600;')}>{s.title}</div>
                          <div style={css('font-size:11.5px;color:' + PALETTE.inkSoft + ';')}>{s.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={css("font-family:'Lora',serif;font-size:18px;font-weight:700;margin-bottom:12px;")}>My Ideas</div>
                  <div style={css('display:flex;flex-direction:column;gap:8px;')}>
                    {generalIdeas.map((idea) => (
                      <div key={idea.id} style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;')}>
                        <div style={css('display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;')}>
                          <textarea
                            value={idea.text}
                            onChange={(e) => setGeneralIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, text: e.target.value } : x)))}
                            style={css('flex:1;border:none;font-size:13.5px;resize:none;min-height:20px;outline:none;')}
                          />
                          <span onClick={() => setGeneralIdeas((prev) => prev.filter((x) => x.id !== idea.id))} style={css('cursor:pointer;opacity:0.4;')}>
                            ✕
                          </span>
                        </div>
                        <select
                          value={idea.pillarId || ''}
                          onChange={(e) => setGeneralIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, pillarId: e.target.value || null } : x)))}
                          style={css(`font-size:11.5px;border:1px solid oklch(0.9 0.01 60);border-radius:20px;padding:3px 10px;background:${idea.pillarId ? pillarTint(idea.pillarId) : 'oklch(0.94 0.005 60)'};`)}
                        >
                          {pillarOptions.map((po) => (
                            <option key={po.id} value={po.id}>
                              {po.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div style={css('display:flex;gap:8px;')}>
                      <input
                        value={newIdeaText}
                        onChange={(e) => setNewIdeaText(e.target.value)}
                        placeholder="Brain dump an idea…"
                        style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13px;')}
                      />
                      <div
                        onClick={() => {
                          if (!newIdeaText.trim()) return;
                          setGeneralIdeas((prev) => [...prev, { id: 'g' + Date.now(), text: newIdeaText, pillarId: null }]);
                          setNewIdeaText('');
                        }}
                        style={css(`background:${PALETTE.primary};color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;`)}
                      >
                        +
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={css("font-family:'Lora',serif;font-size:18px;font-weight:700;margin-bottom:12px;")}>Hook Ideas</div>
                  <div style={css('display:flex;flex-direction:column;gap:8px;')}>
                    {hookIdeas.map((idea) => (
                      <div key={idea.id} style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;')}>
                        <div style={css('display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;')}>
                          <textarea
                            value={idea.text}
                            onChange={(e) => setHookIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, text: e.target.value } : x)))}
                            style={css('flex:1;border:none;font-size:13.5px;resize:none;min-height:20px;outline:none;')}
                          />
                          <span onClick={() => setHookIdeas((prev) => prev.filter((x) => x.id !== idea.id))} style={css('cursor:pointer;opacity:0.4;')}>
                            ✕
                          </span>
                        </div>
                        <select
                          value={idea.pillarId || ''}
                          onChange={(e) => setHookIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, pillarId: e.target.value || null } : x)))}
                          style={css(`font-size:11.5px;border:1px solid oklch(0.9 0.01 60);border-radius:20px;padding:3px 10px;background:${idea.pillarId ? pillarTint(idea.pillarId) : 'oklch(0.94 0.005 60)'};`)}
                        >
                          {pillarOptions.map((po) => (
                            <option key={po.id} value={po.id}>
                              {po.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div style={css('display:flex;gap:8px;')}>
                      <input
                        value={newHookText}
                        onChange={(e) => setNewHookText(e.target.value)}
                        placeholder="Jot down a hook…"
                        style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13px;')}
                      />
                      <div
                        onClick={() => {
                          if (!newHookText.trim()) return;
                          setHookIdeas((prev) => [...prev, { id: 'h' + Date.now(), text: newHookText, pillarId: null }]);
                          setNewHookText('');
                        }}
                        style={css(`background:${PALETTE.primary};color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;`)}
                      >
                        +
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {activeTab === 'plan' &&
          (selectedPost ? (
            <div style={css('max-width:1100px;')}>
              <div onClick={() => setSelectedPostRef(null)} style={css('cursor:pointer;font-size:13px;color:' + PALETTE.inkSoft + ';margin-bottom:6px;')}>
                ← Plan
              </div>
              <div style={css("font-family:'Lora',serif;font-size:22px;font-weight:700;margin-bottom:24px;")}>{selectedPostDayLabel}</div>

              <div style={css('display:grid;grid-template-columns:1fr 1.5fr;gap:30px;')}>
                <div>
                  <label
                    style={{
                      ...css(
                        `height:200px;background:${selectedPost.coverImage ? '#fff' : pillarTint(selectedPost.pillarId)};border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:12px;color:oklch(0.28 0.02 50);font-weight:600;margin-bottom:16px;cursor:pointer;overflow:hidden;position:relative;`
                      ),
                      ...(selectedPost.coverImage
                        ? { backgroundImage: `url(${selectedPost.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : {}),
                    }}
                  >
                    {!selectedPost.coverImage && <span>+ Upload cover image</span>}
                    {selectedPost.coverImage && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateSelectedPost('coverImage', null);
                        }}
                        style={css('position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.55);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;')}
                      >
                        ✕
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => updateSelectedPost('coverImage', reader.result);
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                      style={css('display:none;')}
                    />
                  </label>
                  <div style={css('display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;')}>
                    {selectedPost.platforms.includes('Instagram') && (
                      <select
                        value={selectedPost.pillarId || ''}
                        onChange={(e) => updateSelectedPost('pillarId', e.target.value || null)}
                        style={css('border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:6px 10px;font-size:13px;')}
                      >
                        {pillarOptions.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <select value={selectedPost.status} onChange={(e) => updateSelectedPost('status', e.target.value)} style={css('border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:6px 10px;font-size:13px;')}>
                      {(selectedPost.platforms.includes('Instagram') ? STATUS_OPTIONS : STATUS_OPTIONS_OTHER).map((so) => (
                        <option key={so} value={so}>
                          {so}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={css('display:flex;gap:6px;margin-bottom:20px;')}>
                    {PLATFORMS.map((pf) => (
                      <div
                        key={pf}
                        onClick={() => togglePlatform(pf)}
                        style={css(`font-size:12px;font-weight:600;padding:6px 12px;border-radius:20px;cursor:pointer;${selectedPost.platforms.includes(pf) ? `background:${PALETTE.primary};color:#fff;` : 'background:#fff;border:1px solid oklch(0.88 0.01 60);color:' + PALETTE.inkSoft + ';'}`)}
                      >
                        {pf}
                      </div>
                    ))}
                  </div>
                  <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Story Planner</div>
                  <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:14px;padding:14px;')}>
                    {selectedDayStories.map((story) => (
                      <div key={story.id} style={css('display:flex;justify-content:space-between;align-items:center;background:oklch(0.22 0.015 50);color:#fff;font-size:13px;border-radius:10px;padding:10px 12px;margin-bottom:8px;')}>
                        <span>{story.text}</span>
                        <span onClick={() => removeStoryFromDate(selectedPostRef.dateKey, story.id)} style={css('cursor:pointer;opacity:0.6;')}>
                          ✕
                        </span>
                      </div>
                    ))}
                    <div style={css('display:flex;gap:8px;')}>
                      <input
                        value={newDayStoryText}
                        onChange={(e) => setNewDayStoryText(e.target.value)}
                        placeholder="Add a story idea…"
                        style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13px;')}
                      />
                      <div
                        onClick={() => addStoryToDate(selectedPostRef.dateKey, newDayStoryText, setNewDayStoryText)}
                        style={css(`background:${PALETTE.primary};color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;`)}
                      >
                        +
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    value={selectedPost.title}
                    onChange={(e) => updateSelectedPost('title', e.target.value)}
                    style={css("font-family:'Lora',serif;font-size:22px;font-weight:700;background:transparent;border:none;outline:none;width:100%;margin-bottom:20px;")}
                  />
                  {(selectedPost.platforms.length === 0 || selectedPost.platforms.includes('Instagram')) && (
                    <>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Content Type</div>
                        <select
                          value={selectedPost.contentType || ''}
                          onChange={(e) => updateSelectedPost('contentType', e.target.value)}
                          style={css('width:100%;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:9px 12px;font-size:13.5px;')}
                        >
                          <option value="">Select a format…</option>
                          {CONTENT_TYPES.map((ct) => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Hook</div>
                        <textarea
                          value={selectedPost.hook}
                          onChange={(e) => updateSelectedPost('hook', e.target.value)}
                          placeholder="What's the opening line that stops the scroll?"
                          style={css('width:100%;min-height:52px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Script / Talking Points</div>
                        <textarea
                          value={selectedPost.script}
                          onChange={(e) => updateSelectedPost('script', e.target.value)}
                          placeholder="Bullet points or full script…"
                          style={css('width:100%;min-height:110px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Caption</div>
                        <textarea
                          value={selectedPost.caption}
                          onChange={(e) => updateSelectedPost('caption', e.target.value)}
                          placeholder="Pre-write the caption…"
                          style={css('width:100%;min-height:90px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                    </>
                  )}

                  {selectedPost.platforms.includes('LinkedIn') && (
                    <>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>LinkedIn Ideas</div>
                        <textarea
                          value={selectedPost.linkedinIdeas || ''}
                          onChange={(e) => updateSelectedPost('linkedinIdeas', e.target.value)}
                          placeholder="Angles, takeaways, stories to pull from…"
                          style={css('width:100%;min-height:70px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Full Post</div>
                        <textarea
                          value={selectedPost.linkedinPost || ''}
                          onChange={(e) => updateSelectedPost('linkedinPost', e.target.value)}
                          placeholder="Write out the whole LinkedIn post…"
                          style={css('width:100%;min-height:180px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                    </>
                  )}

                  {selectedPost.platforms.includes('Email') && (
                    <>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Email Ideas</div>
                        <textarea
                          value={selectedPost.emailIdeas || ''}
                          onChange={(e) => updateSelectedPost('emailIdeas', e.target.value)}
                          placeholder="What's this email about? Angles to cover…"
                          style={css('width:100%;min-height:70px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                      <div style={css('margin-bottom:16px;')}>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Links to Include</div>
                        <textarea
                          value={selectedPost.emailLinks || ''}
                          onChange={(e) => updateSelectedPost('emailLinks', e.target.value)}
                          placeholder="Paste links to feature in this email…"
                          style={css('width:100%;min-height:60px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                      <div>
                        <div style={css('font-size:12px;font-weight:700;color:' + PALETTE.inkSoft + ';letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Full Email</div>
                        <textarea
                          value={selectedPost.emailBody || ''}
                          onChange={(e) => updateSelectedPost('emailBody', e.target.value)}
                          placeholder="Write out the whole email…"
                          style={css('width:100%;min-height:180px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={css('max-width:1200px;')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:14px;')}>
                <div style={css("font-family:'Lora',serif;font-size:28px;font-weight:700;")}>Plan</div>
                <div style={css('display:flex;align-items:center;gap:10px;')}>
                  <div onClick={() => setWeekOffset((v) => v - 1)} style={css('cursor:pointer;border:1px solid oklch(0.9 0.01 60);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;')}>
                    ‹
                  </div>
                  <div style={css('font-size:13px;font-weight:600;background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:6px 14px;')}>{weekRangeLabel}</div>
                  <div onClick={() => setWeekOffset((v) => v + 1)} style={css('cursor:pointer;border:1px solid oklch(0.9 0.01 60);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;')}>
                    ›
                  </div>
                </div>
              </div>

              <div style={css('display:flex;flex-direction:column;gap:10px;')}>
                {weekDates.map((d, i) => {
                  const key = dateKey(d);
                  const dayPosts = posts[key] || [];
                  return (
                    <div key={key} style={css('display:flex;gap:20px;background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:16px;padding:18px 22px;align-items:flex-start;')}>
                      <div
                        onClick={() => {
                          if (dayPosts.length > 0) {
                            setSelectedPostRef({ dateKey: key, index: 0 });
                            return;
                          }
                          const newPost = {
                            id: 'np' + Date.now(),
                            title: '',
                            pillarId: null,
                            status: 'Needs Idea',
                            platforms: [],
                            hook: '',
                            script: '',
                            caption: '',
                            contentType: '',
                            linkedinIdeas: '',
                            linkedinPost: '',
                            emailIdeas: '',
                            emailLinks: '',
                            emailBody: '',
                          };
                          setPosts((prev) => ({ ...prev, [key]: [...(prev[key] || []), newPost] }));
                          setSelectedPostRef({ dateKey: key, index: dayPosts.length });
                        }}
                        style={css('width:70px;flex:none;cursor:pointer;')}
                      >
                        <div style={css('font-size:11px;font-weight:700;letter-spacing:0.04em;color:' + PALETTE.inkSoft + ';')}>{DOW[i]}</div>
                        <div style={css("font-family:'Lora',serif;font-size:20px;font-weight:700;")}>{fmtDate(d)}</div>
                      </div>
                      <div style={css('flex:1;display:flex;gap:10px;flex-wrap:wrap;')}>
                        {dayPosts.length === 0 ? (
                          <div style={css('font-size:13px;color:oklch(0.6 0.02 50);padding:10px 0;')}>Nothing scheduled</div>
                        ) : (
                          dayPosts.map((post, idx) => (
                            <div
                              key={post.id}
                              onClick={() => setSelectedPostRef({ dateKey: key, index: idx })}
                              style={css(
                                `cursor:pointer;background:${post.coverImage ? '#fff' : pillarTint(post.pillarId)};border-radius:12px;padding:10px 14px;min-width:200px;position:relative;overflow:hidden;`
                              )}
                            >
                              {post.coverImage && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: `url(${post.coverImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }}
                                ></div>
                              )}
                              <div
                                style={css(
                                  post.coverImage
                                    ? 'position:relative;background:linear-gradient(to top,rgba(0,0,0,0.6),rgba(0,0,0,0.15));margin:-10px -14px;padding:10px 14px;color:#fff;'
                                    : 'position:relative;'
                                )}
                              >
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePost(key, idx);
                                  }}
                                  style={css('position:absolute;top:8px;right:8px;cursor:pointer;opacity:0.5;font-size:11px;line-height:1;')}
                                >
                                  ✕
                                </span>
                                <div style={css('font-size:10.5px;font-weight:700;opacity:0.7;margin-bottom:4px;padding-right:14px;')}>{pillarName(post.pillarId)}</div>
                                <div style={css('font-size:13px;font-weight:600;line-height:1.3;margin-bottom:4px;padding-right:14px;')}>{post.title}</div>
                                <div style={css('font-size:10.5px;opacity:0.7;')}>{post.status}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {activeTab === 'grid' && (
          <div style={css('max-width:1400px;')}>
            <div style={css("font-family:'Lora',serif;font-size:28px;font-weight:700;margin-bottom:4px;")}>Grid Preview</div>
            <div style={css('font-size:13.5px;color:' + PALETTE.inkSoft + ';margin-bottom:26px;')}>How your feed will read across pillars.</div>
            <div style={css(`max-width:900px;margin:0 auto;border:14px solid ${PALETTE.ink};border-radius:44px;overflow:hidden;`)}>
              <div style={css('background:oklch(0.985 0.005 70);padding:22px 26px 14px;display:flex;align-items:center;gap:14px;')}>
                <div style={css(`width:52px;height:52px;border-radius:50%;background:${PALETTE.coral};`)}></div>
                <div style={css('font-size:18px;font-weight:700;')}>fuelmystride</div>
              </div>
              <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:3px;')}>
                {allPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      setActiveTab('plan');
                      setSelectedPostRef({ dateKey: post.dk, index: post.idx });
                    }}
                    style={{
                      ...css(`aspect-ratio:1;background:${pillarTint(post.pillarId)};position:relative;cursor:pointer;display:flex;align-items:flex-end;overflow:hidden;`),
                      ...(post.coverImage
                        ? { backgroundImage: `url(${post.coverImage})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
                        : {}),
                    }}
                  >
                    <div style={css('background:linear-gradient(to top,rgba(0,0,0,0.55),transparent 65%);padding:16px;width:100%;')}>
                      <div style={css('font-size:15px;font-weight:600;color:#fff;')}>{post.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE EDIT MODAL */}
        {scheduleModalOpen && (
          <div style={css('position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:50;')}>
            <div style={css('background:#fff;border-radius:16px;width:560px;max-height:82vh;overflow-y:auto;padding:26px 28px;')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;')}>
                <div style={css("font-family:'Lora',serif;font-size:20px;font-weight:600;")}>Edit your schedule</div>
                <span onClick={() => setScheduleModalOpen(false)} style={css('cursor:pointer;font-size:16px;opacity:0.5;')}>
                  ✕
                </span>
              </div>
              <div style={css('font-size:13px;color:oklch(0.5 0.02 50);margin-bottom:18px;')}>Choose activity types and details for your 7-day batching cycle.</div>

              {schedule.map((row, i) => (
                <div key={i} style={css('border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:14px 16px;margin-bottom:10px;')}>
                  <div style={css('font-size:11.5px;font-weight:600;color:oklch(0.5 0.02 50);margin-bottom:8px;')}>Day {i + 1}</div>
                  <input
                    value={row.title}
                    onChange={(e) =>
                      setSchedule((prev) => {
                        const sc = [...prev];
                        sc[i] = { ...sc[i], title: e.target.value };
                        return sc;
                      })
                    }
                    style={css('width:100%;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:8px 10px;font-size:13.5px;margin-bottom:8px;')}
                  />
                  <div style={css('display:flex;gap:10px;')}>
                    <select
                      value={row.type}
                      onChange={(e) =>
                        setSchedule((prev) => {
                          const sc = [...prev];
                          sc[i] = { ...sc[i], type: e.target.value };
                          return sc;
                        })
                      }
                      style={css('flex:1;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:7px 10px;font-size:13px;')}
                    >
                      {ACTIVITY_TYPES.map((at) => (
                        <option key={at} value={at}>
                          {at}
                        </option>
                      ))}
                    </select>
                    <input
                      value={row.minutes}
                      onChange={(e) =>
                        setSchedule((prev) => {
                          const sc = [...prev];
                          sc[i] = { ...sc[i], minutes: e.target.value };
                          return sc;
                        })
                      }
                      style={css('width:90px;border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:7px 10px;font-size:13px;')}
                    />
                  </div>
                </div>
              ))}

              <div onClick={() => setScheduleModalOpen(false)} style={css('background:oklch(0.32 0.11 300);color:#fff;text-align:center;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;margin-top:6px;')}>
                Save
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
