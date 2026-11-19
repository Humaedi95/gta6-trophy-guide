// Leonida Trophy Guide — checklist, filters, spoiler mode, export/import.
// All state lives in localStorage under one key; nothing leaves the browser.
const STORAGE_KEY = 'leonida-trophy-guide-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';

const KIND_LABELS = {
  story: 'Story',
  side: 'Side missions',
  collectible: 'Collectibles',
  combat: 'Combat',
  exploration: 'Exploration',
  activities: 'Activities',
  progression: 'Progression',
};

// The roadmap is the order of play: story first, then the long grinds, then
// clean-up. Each step names the trophies it covers so the guide stays usable
// as a checklist rather than a wall of text.
const ROADMAP = [
  {
    title: 'Before you start: set up your saves',
    body: 'GTA VI has no mission replay and no New Game Plus, so your saves are your only safety net. Make a manual save at the start of every chapter and one before the final mission. Turn cheats off — reports say cheats disable trophies and saving.',
    covers: 'Protects every story trophy and Positive Mental Attitude',
  },
  {
    title: 'Chapter 1 — do the balcony meditation first',
    body: 'Play through Chapter 1, but meditate on Lucia\u2019s balcony before the chapter ends. It is the one meditation spot in the whole game that disappears after its chapter, and it counts toward Positive Mental Attitude — the only trophy reported as missable.',
    covers: 'Just Like Paradise, Paradise Lost, Positive Mental Attitude',
  },
  {
    title: 'Play the story, chapters 2 to 4',
    body: 'Finish the story. Chapter 2 opens both protagonists and most of the map, so use the gaps between missions to try activities, discover vehicles and start the collectible hunts. Keep a manual save at the start of each chapter.',
    covers: 'All chapter and mission trophies, You Gotta Know When to Get Off',
  },
  {
    title: 'Side characters and strangers',
    body: 'Work through the mission strands for Andy, Kenton, Billy, Randy and Tyrone, then the stranger strands marked on the map. Eight stranger strands earn the silver; there are more than eight in the game, so pick the nearest ones first.',
    covers: 'Road to Rehabilitation, This Was No Boat Accident, The Lone Rider, Supply & Demand, Spin On This!, Strangers & Freaks, Fair Game',
  },
  {
    title: 'The big grinds',
    body: 'These are the long ones, so start them early and chip away between other goals: 250 stunts, gold medals in all 42 Shooting Range challenges, WAiNK at 100 locations, three collectible card sets, 100 vehicles discovered, and 50 challenges.',
    covers: 'Cunning Stunts, The Shootist, You WAiNKer!, Don\u2019t Touch My Deck, Whip It Good, One Last Thing',
  },
  {
    title: 'Activities, races and the open world',
    body: 'Try every activity type once, win a drone race at all 14 locations, win 20 different races, beat Cal at fishing, finish an arcade game, bowl a game at Kolt & Associates, and explore every corner of Leonida.',
    covers: 'Master of None, Top Fun, Earn Cash, Not Kudos, Baited My Tackle, Stick Fiddler, Let\u2019s Go Bowling, The Goodtime State',
  },
  {
    title: 'Crime spree: robberies, heists and the law',
    body: 'Rob shops with your partner, hit jewellery stores undetected, rob armoured trucks and bank vaults, rob an illegal operation for each gang, and lose a four-star wanted level with your partner. Bring a fast getaway car to every job.',
    covers: 'Hot Together, Retail Therapy, Sneakthief, Maximum Withdrawal, A Classic Blitz Play, Pest Control, Gunslinger, Ten Pin',
  },
  {
    title: 'Money and property',
    body: 'Launder $250,000 in Marked Bills through your contacts, spend $100,000 across the shops, buy every garage property and register ten vehicles to the Scooter Bros app. These finish naturally if you keep playing — check the totals in the stats screen.',
    covers: 'Dime on the Dollar, Treat Yo Self, Little Boxes, On the Spot',
  },
  {
    title: '100% completion and the platinum',
    body: 'When everything else is done, check the in-game 100% completion checklist and finish whatever is left — that earns the gold A Long Road, and the platinum Vice Got a Price! pops with it.',
    covers: 'A Long Road, Vice Got a Price!',
  },
];

let trophies = [];
let earned = new Set();
let hideSpoilers = true;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const missableListEl = $('missableList');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned.filter((n) => Number.isInteger(n)));
    }
  } catch {
    earned = new Set();
  }
  try {
    const raw = localStorage.getItem(SPOILER_KEY);
    hideSpoilers = raw === null ? true : raw === 'true';
  } catch {
    hideSpoilers = true;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned].sort((a, b) => a - b), savedAt: new Date().toISOString() }));
  } catch {
    // Storage full or unavailable (private mode): the checklist still works
    // for this session; the user just cannot persist it.
  }
}

function saveSpoilerPref() {
  try {
    localStorage.setItem(SPOILER_KEY, String(hideSpoilers));
  } catch {
    // Ignore: spoiler preference is a nicety, not progress.
  }
}

function spoilerHidden(trophy) {
  return hideSpoilers && trophy.spoiler && !earned.has(trophy.id);
}

function trophyCard(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy' + (earned.has(trophy.id) ? ' earned' : '');
  li.dataset.id = String(trophy.id);

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned.has(trophy.id);
  check.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  check.addEventListener('change', () => {
    if (check.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveState();
    render();
  });

  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'trophy-head';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = spoilerHidden(trophy) ? 'Hidden trophy — earn it to reveal' : trophy.name;
  const grade = document.createElement('span');
  grade.className = 'grade grade-' + trophy.grade;
  grade.textContent = trophy.grade;
  const kind = document.createElement('span');
  kind.className = 'kind-tag';
  kind.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  head.append(name, grade, kind);
  body.append(head);

  if (spoilerHidden(trophy)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'This is a story trophy. Its name and description are hidden until you earn it — or turn the spoiler setting off.';
    body.append(note);
  } else {
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = trophy.description;
    const guide = document.createElement('p');
    guide.className = 'trophy-guide';
    guide.textContent = trophy.guide;
    body.append(desc, guide);
  }

  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'missable-flag';
    flag.textContent = '\u26A0 Missable — ' + trophy.missableWhy;
    body.append(flag);
  }

  li.append(check, body);
  return li;
}

function currentFilters() {
  return {
    q: $('search').value.trim().toLowerCase(),
    kind: $('filterKind').value,
    grade: $('filterGrade').value,
    earnedOnly: $('filterEarned').checked,
    unearnedOnly: $('filterUnearned').checked,
  };
}

function filteredTrophies() {
  const f = currentFilters();
  return trophies.filter((t) => {
    if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.earnedOnly && !earned.has(t.id)) return false;
    if (f.unearnedOnly && earned.has(t.id)) return false;
    if (f.q && !(t.name.toLowerCase().includes(f.q) || t.description.toLowerCase().includes(f.q) || t.guide.toLowerCase().includes(f.q))) return false;
    return true;
  });
}

function renderStats() {
  const count = earned.size;
  const pct = Math.round((count / trophies.length) * 100);
  $('statEarned').textContent = String(count);
  $('statPct').textContent = pct + '%';
  $('progressFill').style.width = pct + '%';
  $('progressBarWrap').setAttribute('aria-valuenow', String(count));
  $('progressText').textContent = count + ' of ' + trophies.length + ' trophies earned' + (count === trophies.length ? ' — platinum complete!' : '');
}

function renderList() {
  const shown = filteredTrophies();
  listEl.replaceChildren();
  if (shown.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No trophies match these filters. Clear the search or widen the filters.';
    listEl.append(li);
  } else {
    for (const t of shown) listEl.append(trophyCard(t));
  }
  $('countLine').textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies';
}

function renderMissable() {
  missableListEl.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) missableListEl.append(trophyCard(t));
  const safe = document.createElement('li');
  safe.className = 'empty';
  safe.textContent = 'Every other trophy (' + (trophies.length - missable.length) + ' of ' + trophies.length + ') is earned in free roam after the story — none of them is reported as missable. Use the Guide tab filters to browse them.';
  missableListEl.append(safe);
}

function renderRoadmap() {
  const ol = $('roadmapList');
  ol.replaceChildren();
  for (const step of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = step.title;
    const p = document.createElement('p');
    p.textContent = step.body;
    const covers = document.createElement('p');
    covers.className = 'covers';
    covers.textContent = 'Covers: ' + step.covers;
    li.append(h, p, covers);
    ol.append(li);
  }
}

function render() {
  renderStats();
  renderList();
  renderMissable();
}

function switchView(name) {
  for (const btn of document.querySelectorAll('.tab')) {
    btn.classList.toggle('active', btn.dataset.view === name);
  }
  for (const view of document.querySelectorAll('.view')) {
    view.hidden = view.id !== 'view-' + name;
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProgress() {
  const payload = {
    app: 'Leonida Trophy Guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    total: trophies.length,
  };
  download('leonida-trophy-progress.json', JSON.stringify(payload, null, 2));
  $('toolNote').textContent = 'Progress exported (' + payload.earned.length + ' earned).';
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.id));
      const next = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      earned = next;
      saveState();
      render();
      $('toolNote').textContent = 'Progress imported (' + earned.size + ' earned).';
    } catch {
      $('toolNote').textContent = 'That file could not be imported — it is not a progress export from this guide.';
    }
  };
  reader.readAsText(file);
}

function resetProgress() {
  if (!window.confirm('Reset all progress? This clears every ticked trophy.')) return;
  earned = new Set();
  saveState();
  render();
  $('toolNote').textContent = 'Progress reset.';
}

async function init() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  loadState();
  $('spoilerToggle').checked = hideSpoilers;
  renderRoadmap();
  render();

  for (const btn of document.querySelectorAll('.tab')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  $('search').addEventListener('input', renderList);
  $('filterKind').addEventListener('change', renderList);
  $('filterGrade').addEventListener('change', renderList);
  $('filterEarned').addEventListener('change', renderList);
  $('filterUnearned').addEventListener('change', renderList);
  $('spoilerToggle').addEventListener('change', (e) => {
    hideSpoilers = e.target.checked;
    saveSpoilerPref();
    render();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', resetProgress);

  // Deep-link a view from a screenshot or a shared link: #roadmap, #missable, #sources.
  const hash = window.location.hash.replace('#', '');
  if (['guide', 'roadmap', 'missable', 'sources'].includes(hash)) switchView(hash);
}

init();
