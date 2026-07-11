import { useState } from 'react';

const PALETTE = {
  coral: 'oklch(0.82 0.10 40)',
  sage: 'oklch(0.82 0.08 150)',
  lavender: 'oklch(0.83 0.06 300)',
  butter: 'oklch(0.87 0.10 85)',
  ink: 'oklch(0.22 0.015 50)',
  inkSoft: 'oklch(0.5 0.02 50)',
  primary: 'oklch(0.38 0.10 20)',
};
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_OPTIONS = ['Needs Idea', 'Idea Set', 'Scripting', 'Filming', 'Editing', 'Ready to Post', 'Posted'];
const ACTIVITY_TYPES = ['Planning & Ideation', 'Scripting', 'Filming', 'Editing', 'Final Prep & Publishing', 'Community', 'Analytics & Performance Review'];
const PLATFORMS = ['Instagram', 'LinkedIn'];
const BASE_MONDAY = new Date(2026, 6, 6); // Mon Jul 6 2026
const TODAY_KEY = dateKey(new Date(2026, 6, 10)); // Fri Jul 10 2026

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
  { id: 'g1', text: '2026 trend-spotting: best runner launches this year', pillarId: 'p3' },
  { id: 'g2', text: "If you're a smaller creator, your content isn't bad — you just don't know what bigger creators do", pillarId: null },
];

const INITIAL_POSTS = {
  '2026-07-06': [{ id: 'm1', title: "3 pre-run breakfasts that won't wreck your stomach", pillarId: 'p1', status: 'Ready to Post', platforms: ['Instagram'], hook: "The breakfast mistake that's sabotaging your long run.", script: '- Why timing matters more than food\n- 3 go-to combos\n- What to avoid 90 min out', caption: "Your gut doesn't care how good the recipe sounds if you eat it at the wrong time 👀" }],
  '2026-07-07': [{ id: 't1', title: '6am practice, 8am class: a day in my shoes', pillarId: 'p2', status: 'Filming', platforms: ['Instagram', 'LinkedIn'], hook: '', script: '', caption: '' }],
  '2026-07-08': [{ id: 'w1', title: 'What I eat the night before a race', pillarId: 'p1', status: 'Scripting', platforms: ['Instagram'], hook: '', script: '- Dinner timing\n- Hydration plan\n- My exact plate', caption: '' }],
  '2026-07-09': [{ id: 'th1', title: 'Why I built Fuel My Stride as a D1 athlete', pillarId: 'p3', status: 'Posted', platforms: ['LinkedIn'], hook: 'I was tired of choosing between practice and building something real.', script: '', caption: 'Posted this morning — full story in the caption.' }],
  '2026-07-10': [{ id: 'f1', title: 'Hydration myths runners still believe', pillarId: 'p1', status: 'Ready to Post', platforms: ['Instagram'], hook: "You don't need 8 glasses a day — you need this instead.", script: '- Myth 1\n- Myth 2\n- What actually works', caption: 'Save this before your next long run 💧' }],
  '2026-07-11': [{ id: 'sa1', title: 'Long run playlist + fuel check', pillarId: 'p2', status: 'Idea Set', platforms: ['Instagram'], hook: '', script: '', caption: '' }],
  '2026-07-12': [{ id: 'su1', title: 'Your Sunday long run questions, answered', pillarId: 'p4', status: 'Needs Idea', platforms: [], hook: '', script: '', caption: '' }],
};

const INITIAL_STORIES_BY_DATE = {
  '2026-07-10': [{ id: 's1', text: 'Poll: what should I break down next?' }],
};

const INITIAL_TASKS = [
  { id: 'tk1', text: 'Take cover photo for hydration post', done: false, tag: 'Priority' },
  { id: 'tk2', text: 'Schedule LinkedIn post', done: false, tag: 'LinkedIn' },
  { id: 'tk3', text: 'Reply to comments from this week', done: true, tag: 'Instagram' },
];

const TABS = [
  { key: 'today', label: 'Today', icon: '📋' },
  { key: 'strategize', label: 'Strategize', icon: '🧭' },
  { key: 'plan', label: 'Plan', icon: '🐎' },
  { key: 'grid', label: 'Grid', icon: '▦' },
];

const TASK_TAGS = ['All', 'Priority', 'Instagram', 'LinkedIn'];

function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [pillars, setPillars] = useState(INITIAL_PILLARS);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [generalIdeas, setGeneralIdeas] = useState(INITIAL_GENERAL_IDEAS);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [storiesByDate, setStoriesByDate] = useState(INITIAL_STORIES_BY_DATE);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedPillarId, setSelectedPillarId] = useState(null);
  const [selectedPostRef, setSelectedPostRef] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
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

  // Mini calendar (July 2026)
  const firstOfMonth = new Date(2026, 6, 1);
  const startDow = (firstOfMonth.getDay() + 6) % 7; // Mon=0
  const calendarCells = [];
  for (let i = 0; i < startDow; i++) calendarCells.push({ label: '', style: 'height:16px;' });
  for (let d = 1; d <= 31; d++) {
    const key = `2026-07-${pad(d)}`;
    const dayPosts = posts[key] || [];
    const bg = dayPosts.length ? pillarTint(dayPosts[0].pillarId) : 'transparent';
    const isToday = key === TODAY_KEY;
    calendarCells.push({
      label: '' + d,
      style: `height:20px;border-radius:5px;font-size:9.5px;display:flex;align-items:center;justify-content:center;background:${bg};${isToday ? 'box-shadow:0 0 0 1.5px ' + PALETTE.primary + ' inset;font-weight:700;' : ''}`,
    });
  }

  // TODAY
  const todayDate = new Date(2026, 6, 10);
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
      selectedPostDayLabel = `Content Planner / ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
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
    <div style={css('display:flex;height:100vh;width:100%;overflow:hidden;color:oklch(0.22 0.015 50);')}>
      {/* SIDEBAR */}
      <div style={css('width:230px;flex:none;background:oklch(0.965 0.008 60);border-right:1px solid oklch(0.9 0.01 60);display:flex;flex-direction:column;padding:22px 18px;')}>
        <div style={css("font-family:'Lora',serif;font-style:italic;font-weight:600;font-size:21px;letter-spacing:-0.3px;margin-bottom:2px;")}>Fuel My Stride</div>
        <div style={css('font-size:11px;color:oklch(0.5 0.02 50);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:26px;')}>Content Studio</div>

        {TABS.map((t) => (
          <div
            key={t.key}
            onClick={() => setTab(t.key)}
            style={css(`display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:4px;font-size:13.5px;font-weight:600;cursor:pointer;${activeTab === t.key ? `background:${PALETTE.primary};color:#fff;` : 'color:' + PALETTE.ink + ';'}`)}
          >
            <span style={css('font-size:15px;')}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}

        <div style={css('flex:1;')}></div>

        <div style={css('border-top:1px solid oklch(0.9 0.01 60);padding-top:16px;')}>
          <div style={css('font-size:11px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.04em;margin-bottom:10px;')}>JULY 2026</div>
          <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px;')}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dow, i) => (
              <div key={'dow' + i} style={css('font-size:10px;text-align:center;color:oklch(0.6 0.02 50);')}>
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

      {/* MAIN */}
      <div style={css('flex:1;overflow-y:auto;padding:32px 40px 60px;min-width:0;')}>
        {activeTab === 'today' && (
          <div style={css('max-width:1040px;')}>
            <div style={css("font-family:'Lora',serif;font-size:30px;font-weight:600;margin-bottom:4px;")}>Fri. Jul 10</div>
            <div style={css('font-size:14px;color:oklch(0.5 0.02 50);margin-bottom:26px;')}>{`Day ${todayDow + 1} of your batching cycle`}</div>

            <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Today's Batching Task</div>
            <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:14px;padding:22px 24px;margin-bottom:30px;')}>
              <span style={css(`display:inline-block;background:${todayTask.tint};color:oklch(0.28 0.02 50);font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:12px;`)}>{todayTask.type}</span>
              <div style={css("font-family:'Lora',serif;font-size:19px;font-weight:600;margin-bottom:6px;")}>{todayTask.title}</div>
              <div style={css('font-size:13.5px;color:oklch(0.5 0.02 50);')}>{todayTask.description}</div>
            </div>

            <div style={css('display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:start;')}>
              <div>
                <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>What To Post Today</div>
                <div
                  onClick={openTodayPost}
                  style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:14px;overflow:hidden;cursor:pointer;')}
                >
                  {hasTodayPost ? (
                    <>
                      <div style={css(`height:200px;background:${pillarTint(todayPost.pillarId)};display:flex;align-items:center;justify-content:center;font-size:12px;color:oklch(0.28 0.02 50);font-weight:600;`)}>cover image placeholder</div>
                      <div style={css('padding:16px 18px;')}>
                        <span style={css(`display:inline-block;background:${pillarTint(todayPost.pillarId)};font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:8px;`)}>{pillarName(todayPost.pillarId)}</span>
                        <div style={css('font-size:14px;font-weight:600;margin-bottom:4px;')}>{todayPost.title}</div>
                        <div style={css('font-size:12px;color:oklch(0.5 0.02 50);')}>{todayPost.status}</div>
                      </div>
                    </>
                  ) : (
                    <div style={css('padding:30px 18px;text-align:center;font-size:13px;color:oklch(0.55 0.02 50);')}>Nothing planned yet — click to add a post for today.</div>
                  )}
                </div>
              </div>

              <div>
                <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;')}>
                  <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;')}>Today's Stories</div>
                </div>
                <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:14px;padding:14px;margin-bottom:24px;')}>
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
                      style={css("background:oklch(0.38 0.10 20);color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;")}
                    >
                      +
                    </div>
                  </div>
                </div>

                <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Today's Tasks</div>
                <div style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:14px;padding:14px;')}>
                  <div style={css('display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;')}>
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
                    <div key={t.id} style={css('display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid oklch(0.94 0.005 60);')}>
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
                  <div style={css('display:flex;gap:8px;margin-top:10px;')}>
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
                      style={css("background:oklch(0.38 0.10 20);color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;")}
                    >
                      +
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategize' &&
          (selectedPillar ? (
            <div style={css('max-width:1040px;')}>
              <div onClick={() => setSelectedPillarId(null)} style={css('cursor:pointer;font-size:13px;color:oklch(0.5 0.02 50);margin-bottom:18px;')}>
                ← Back to Strategize
              </div>
              <div style={css('display:flex;align-items:center;gap:14px;margin-bottom:22px;')}>
                <div style={css(`width:52px;height:52px;border-radius:50%;background:${selectedPillar.color};display:flex;align-items:center;justify-content:center;font-size:24px;`)}>{selectedPillar.emoji}</div>
                <input
                  value={selectedPillar.name}
                  onChange={(e) => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, name: e.target.value } : p)))}
                  style={css("font-family:'Lora',serif;font-size:26px;font-weight:600;border:none;background:transparent;outline:none;")}
                />
                <div style={css('flex:1;')}></div>
                <div
                  onClick={() => {
                    setPillars((prev) => prev.filter((p) => p.id !== selectedPillar.id));
                    setSelectedPillarId(null);
                  }}
                  style={css('font-size:12.5px;color:oklch(0.5 0.1 25);cursor:pointer;border:1px solid oklch(0.9 0.01 60);padding:7px 14px;border-radius:8px;')}
                >
                  Delete pillar
                </div>
              </div>

              <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>About</div>
              <textarea
                value={selectedPillar.about}
                onChange={(e) => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, about: e.target.value } : p)))}
                style={css('width:100%;min-height:64px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:14px;font-size:14px;resize:vertical;margin-bottom:24px;')}
              />

              <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Posting days</div>
              <div style={css('display:flex;gap:8px;margin-bottom:28px;')}>
                {DOW.map((d, i) => (
                  <div
                    key={d}
                    onClick={() =>
                      setPillars((prev) =>
                        prev.map((p) => (p.id === selectedPillar.id ? { ...p, days: p.days.includes(i) ? p.days.filter((x) => x !== i) : [...p.days, i] } : p))
                      )
                    }
                    style={css(`width:42px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:600;cursor:pointer;${selectedPillar.days.includes(i) ? `background:${selectedPillar.color};` : 'background:oklch(0.94 0.005 60);color:' + PALETTE.inkSoft + ';'}`)}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;')}>
                <div style={css("font-family:'Lora',serif;font-size:16px;font-weight:600;")}>{selectedPillar.name} Ideas</div>
                <div
                  onClick={() => setPillars((prev) => prev.map((p) => (p.id === selectedPillar.id ? { ...p, ideas: [...p.ideas, { id: 'pi' + Date.now(), text: '' }] } : p)))}
                  style={css('cursor:pointer;background:oklch(0.94 0.005 60);border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;')}
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
          ) : (
            <div style={css('max-width:1040px;')}>
              <div style={css("font-family:'Lora',serif;font-size:26px;font-weight:600;margin-bottom:18px;")}>Content Pillars</div>
              <div style={css('display:flex;gap:22px;margin-bottom:40px;flex-wrap:wrap;')}>
                {pillars.map((p) => (
                  <div key={p.id} onClick={() => setSelectedPillarId(p.id)} style={css('display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;width:96px;')}>
                    <div style={css(`width:80px;height:80px;border-radius:50%;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:26px;`)}>{p.emoji}</div>
                    <div style={css('font-size:13px;font-weight:600;text-align:center;')}>{p.name}</div>
                  </div>
                ))}
                <div
                  onClick={() => {
                    const id = 'p' + Date.now();
                    setPillars((prev) => [...prev, { id, name: 'New Pillar', emoji: '✨', color: PALETTE.sage, about: '', days: [], ideas: [] }]);
                    setSelectedPillarId(id);
                  }}
                  style={css('display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;width:96px;')}
                >
                  <div style={css('width:80px;height:80px;border-radius:50%;border:2px dashed oklch(0.85 0.01 60);display:flex;align-items:center;justify-content:center;font-size:22px;color:oklch(0.6 0.02 50);')}>+</div>
                  <div style={css('font-size:13px;color:oklch(0.55 0.02 50);')}>Add pillar</div>
                </div>
              </div>

              <div style={css('display:grid;grid-template-columns:1.1fr 1fr;gap:30px;align-items:start;')}>
                <div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;')}>
                    <div style={css("font-family:'Lora',serif;font-size:18px;font-weight:600;")}>Content Batching Schedule</div>
                    <div onClick={() => setScheduleModalOpen(true)} style={css('cursor:pointer;font-size:12.5px;border:1px solid oklch(0.9 0.01 60);padding:6px 14px;border-radius:8px;')}>
                      Edit
                    </div>
                  </div>
                  {scheduleRows.map((s) => (
                    <div key={s.dayNum} style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:14px;')}>
                      <div style={css(`width:56px;flex:none;font-size:11px;font-weight:600;color:oklch(0.5 0.02 50);background:${s.tint};padding:6px 0;text-align:center;border-radius:8px;`)}>Day {s.dayNum}</div>
                      <div>
                        <div style={css('font-size:14px;font-weight:600;')}>{s.title}</div>
                        <div style={css('font-size:12px;color:oklch(0.5 0.02 50);')}>{s.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;')}>
                    <div style={css("font-family:'Lora',serif;font-size:18px;font-weight:600;")}>My Ideas</div>
                  </div>
                  <div style={css('background:oklch(0.97 0.006 60);border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:14px;')}>
                    {generalIdeas.map((idea) => (
                      <div key={idea.id} style={css('background:#fff;border-radius:10px;padding:12px 14px;margin-bottom:8px;')}>
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
                        style={css("background:oklch(0.38 0.10 20);color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;")}
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
              <div onClick={() => setSelectedPostRef(null)} style={css('cursor:pointer;font-size:13px;color:oklch(0.5 0.02 50);margin-bottom:6px;')}>
                ← Content Planner
              </div>
              <div style={css("font-family:'Lora',serif;font-size:24px;font-weight:600;margin-bottom:24px;")}>{selectedPostDayLabel}</div>

              <div style={css('display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:start;')}>
                <div>
                  <div style={css(`background:linear-gradient(135deg,${pillarTint(selectedPost.pillarId)},#fff);border-radius:16px;padding:24px;margin-bottom:20px;`)}>
                    <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;')}>
                      <input
                        value={selectedPost.title}
                        onChange={(e) => updateSelectedPost('title', e.target.value)}
                        style={css("font-family:'Lora',serif;font-size:22px;font-weight:600;background:transparent;border:none;outline:none;width:100%;")}
                      />
                    </div>
                    <div style={css('display:flex;gap:14px;flex-wrap:wrap;')}>
                      <div>
                        <div style={css('font-size:11px;color:oklch(0.5 0.02 50);margin-bottom:4px;')}>Pillar</div>
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
                      </div>
                      <div>
                        <div style={css('font-size:11px;color:oklch(0.5 0.02 50);margin-bottom:4px;')}>Status</div>
                        <select value={selectedPost.status} onChange={(e) => updateSelectedPost('status', e.target.value)} style={css('border:1px solid oklch(0.9 0.01 60);border-radius:8px;padding:6px 10px;font-size:13px;')}>
                          {STATUS_OPTIONS.map((so) => (
                            <option key={so} value={so}>
                              {so}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={css('font-size:11px;color:oklch(0.5 0.02 50);margin-bottom:4px;')}>Platforms</div>
                        <div style={css('display:flex;gap:6px;')}>
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
                      </div>
                    </div>
                  </div>

                  <div style={css('margin-bottom:18px;')}>
                    <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Hook</div>
                    <textarea
                      value={selectedPost.hook}
                      onChange={(e) => updateSelectedPost('hook', e.target.value)}
                      placeholder="What's the opening line that stops the scroll?"
                      style={css('width:100%;min-height:56px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                    />
                  </div>
                  <div style={css('margin-bottom:18px;')}>
                    <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Script / Talking Points</div>
                    <textarea
                      value={selectedPost.script}
                      onChange={(e) => updateSelectedPost('script', e.target.value)}
                      placeholder="Bullet points or full script…"
                      style={css('width:100%;min-height:110px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                    />
                  </div>
                  <div>
                    <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;')}>Caption</div>
                    <textarea
                      value={selectedPost.caption}
                      onChange={(e) => updateSelectedPost('caption', e.target.value)}
                      placeholder="Pre-write the caption…"
                      style={css('width:100%;min-height:90px;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px 14px;font-size:14px;resize:vertical;')}
                    />
                  </div>
                </div>

                <div>
                  <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Cover</div>
                  <div style={css(`height:180px;background:${pillarTint(selectedPost.pillarId)};border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:12px;color:oklch(0.28 0.02 50);font-weight:600;margin-bottom:22px;`)}>cover image placeholder</div>

                  <div style={css('font-size:12px;font-weight:600;color:oklch(0.5 0.02 50);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;')}>Story Planner</div>
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
                        style={css("background:oklch(0.38 0.10 20);color:#fff;border-radius:8px;width:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;")}
                      >
                        +
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={css('max-width:1200px;')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:14px;')}>
                <div style={css("font-family:'Lora',serif;font-size:26px;font-weight:600;")}>Content Planner</div>
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

              <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:12px;')}>
                {weekDates.map((d, i) => {
                  const key = dateKey(d);
                  const isToday = key === TODAY_KEY;
                  const dayPosts = posts[key] || [];
                  return (
                    <div key={key}>
                      <div style={css(`padding:10px 12px;border-radius:10px;${isToday ? `background:${PALETTE.primary};color:#fff;` : 'background:oklch(0.94 0.005 60);color:' + PALETTE.ink + ';'}`)}>
                        <div style={css('font-size:11px;font-weight:600;letter-spacing:0.04em;')}>{DOW[i]}</div>
                        <div style={css('font-size:15px;font-weight:600;')}>{fmtDate(d)}</div>
                      </div>
                      {dayPosts.map((post, idx) => (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPostRef({ dateKey: key, index: idx })}
                          style={css('background:#fff;border:1px solid oklch(0.9 0.01 60);border-radius:12px;padding:12px;margin-top:8px;cursor:pointer;')}
                        >
                          <span style={css(`display:inline-block;background:${pillarTint(post.pillarId)};font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:20px;margin-bottom:8px;`)}>{pillarName(post.pillarId)}</span>
                          <div style={css('font-size:12.5px;font-weight:600;line-height:1.3;margin-bottom:6px;')}>{post.title}</div>
                          <div style={css('font-size:11px;color:oklch(0.5 0.02 50);')}>{post.status}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {activeTab === 'grid' && (
          <div style={css('max-width:920px;')}>
            <div style={css("font-family:'Lora',serif;font-size:26px;font-weight:600;margin-bottom:4px;")}>Grid Preview</div>
            <div style={css('font-size:13.5px;color:oklch(0.5 0.02 50);margin-bottom:22px;')}>A quick look at how your feed will read across pillars.</div>
            <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border:1px solid oklch(0.9 0.01 60);')}>
              {allPosts.map((post) => {
                const d = new Date(post.dk + 'T00:00:00');
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      setActiveTab('plan');
                      setSelectedPostRef({ dateKey: post.dk, index: post.idx });
                    }}
                    style={css(`aspect-ratio:1;background:${pillarTint(post.pillarId)};position:relative;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;`)}
                  >
                    <div style={css('font-size:11px;color:oklch(0.28 0.02 50);font-weight:600;padding:8px;')}>{pillarName(post.pillarId)}</div>
                    <div style={css('background:linear-gradient(to top,rgba(0,0,0,0.55),transparent 60%);padding:10px;')}>
                      <div style={css('font-size:12.5px;font-weight:600;color:#fff;')}>{post.title}</div>
                      <div style={css('font-size:10.5px;color:rgba(255,255,255,0.8);margin-top:4px;')}>
                        {fmtDate(d)} · {post.status}
                      </div>
                    </div>
                  </div>
                );
              })}
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

              <div onClick={() => setScheduleModalOpen(false)} style={css('background:oklch(0.38 0.10 20);color:#fff;text-align:center;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;margin-top:6px;')}>
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
