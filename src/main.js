import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabase = createClient('https://ltjnxncwdorjtmlnywgm.supabase.co', 'sb_publishable_RQPNDUY1H0-SXQqjw2dugA_NXcFeYGr')
const teams = [['מקסיקו','🇲🇽'],['דרום אפריקה','🇿🇦'],['דרום קוריאה','🇰🇷'],['צ׳כיה','🇨🇿'],['קנדה','🇨🇦'],['בוסניה והרצגובינה','🇧🇦'],['קטר','🇶🇦'],['שווייץ','🇨🇭'],['ברזיל','🇧🇷'],['מרוקו','🇲🇦'],['האיטי','🇭🇹'],['סקוטלנד','🏴'],['ארצות הברית','🇺🇸'],['פרגוואי','🇵🇾'],['אוסטרליה','🇦🇺'],['טורקיה','🇹🇷'],['גרמניה','🇩🇪'],['קוראסאו','🇨🇼'],['חוף השנהב','🇨🇮'],['אקוודור','🇪🇨'],['הולנד','🇳🇱'],['יפן','🇯🇵'],['שוודיה','🇸🇪'],['תוניסיה','🇹🇳'],['בלגיה','🇧🇪'],['מצרים','🇪🇬'],['איראן','🇮🇷'],['ניו זילנד','🇳🇿'],['ספרד','🇪🇸'],['כף ורדה','🇨🇻'],['ערב הסעודית','🇸🇦'],['אורוגוואי','🇺🇾'],['צרפת','🇫🇷'],['סנגל','🇸🇳'],['עיראק','🇮🇶'],['נורווגיה','🇳🇴'],['ארגנטינה','🇦🇷'],['אלג׳יריה','🇩🇿'],['אוסטריה','🇦🇹'],['ירדן','🇯🇴'],['פורטוגל','🇵🇹'],['קונגו הדמוקרטית','🇨🇩'],['אוזבקיסטן','🇺🇿'],['קולומביה','🇨🇴'],['אנגליה','🏴'],['קרואטיה','🇭🇷'],['גאנה','🇬🇭'],['פנמה','🇵🇦']].map(([name, flag], id) => ({ id, name, flag }))
const app = document.querySelector('#app')
let user = null; let leagues = []; let league = null; let selected = []; let search = ''; let creating = false; let loading = true; let loadError = ''

function dateValue(date = new Date()) { const offset = date.getTimezoneOffset() * 60000; return new Date(date - offset).toISOString().slice(0, 10) }
function dateText(date) { return new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`)) }
function shuffled(items) { const copy = [...items]; for (let i = copy.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] } return copy }
function accountEmail(nickname) { return `player-${Array.from(nickname.trim().toLocaleLowerCase('he')).map(char => char.codePointAt(0).toString(36)).join('-')}@kids-league.app` }
function fromRow(row) { return { id: row.id, name: row.name, teams: row.teams, gamesPerWeek: row.games_per_week, fixtures: row.fixtures } }
function toRow(item) { return { name: item.name, teams: item.teams, games_per_week: item.gamesPerWeek, fixtures: item.fixtures } }

function fixtures(chosen, legs, startDate, weekly) {
  const rotation = shuffled(chosen); if (rotation.length % 2) rotation.push(null); const rounds = []
  for (let round = 0; round < rotation.length - 1; round++) { const games = []; for (let i = 0; i < rotation.length / 2; i++) { const home = rotation[i], away = rotation[rotation.length - 1 - i]; if (home && away) games.push({ home, away }) } rounds.push(games); rotation.splice(1, 0, rotation.pop()) }
  const all = legs === 2 ? [...rounds, ...rounds.map(games => games.map(({ home, away }) => ({ home: away, away: home })))] : rounds; const start = new Date(`${startDate}T12:00:00`)
  return all.flatMap((games, round) => { const date = new Date(start); date.setDate(start.getDate() + Math.floor(round * 7 / weekly)); return games.map((game, index) => ({ ...game, id: `${round}-${index}`, round: round + 1, date: dateValue(date), homeScore: '', awayScore: '' })) })
}

function table() {
  const rows = Object.fromEntries(league.teams.map(team => [team.id, { ...team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }]))
  league.fixtures.forEach(game => { if (game.homeScore === '' || game.awayScore === '') return; const h = rows[game.home.id], a = rows[game.away.id], hs = +game.homeScore, as = +game.awayScore; h.played++; a.played++; h.gf += hs; h.ga += as; a.gf += as; a.ga += hs; if (hs > as) { h.wins++; a.losses++; h.points += 3 } else if (as > hs) { a.wins++; h.losses++; a.points += 3 } else { h.draws++; a.draws++; h.points++; a.points++ } })
  return Object.values(rows).sort((a,b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name, 'he'))
}

function authScreen(message = '') {
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><p class="eyebrow">ליגת הכדורגל שלי</p><h1>נכנסים למגרש</h1><p>בוחרים כינוי וקוד בן 6 ספרות. אין צורך בדוא״ל.</p><form id="auth-form"><label>כינוי<input name="nickname" minlength="2" maxlength="20" placeholder="למשל: תום" required></label><label>קוד כניסה<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" placeholder="6 ספרות" required></label><button class="primary">כניסה למגרש</button><p class="auth-hint">כינוי חדש? ניצור עבורך שחקן חדש מיד.</p><p class="error">${message}</p></form></section></main>`
}

function leaguesScreen() {
  app.innerHTML = `<main class="manager"><header class="manager-head"><div><p class="eyebrow">שלום, ${user.user_metadata.nickname || 'שחקן'}!</p><h1>הליגות שלי</h1></div><button class="text-button" data-signout>התנתקות</button></header><button class="primary" data-create>+ הקמת ליגה חדשה</button>${loadError ? `<p class="error">${loadError}</p>` : ''}<section class="league-list">${leagues.length ? leagues.map(item => `<button class="league-card" data-open="${item.id}"><span>⚽</span><div><b>${item.name}</b><small>${item.teams.length} נבחרות · ${item.fixtures.length} משחקים</small></div><i>←</i></button>`).join('') : '<p class="empty">עדיין אין לך ליגות. בואו נקים את הראשונה!</p>'}</section></main>`
}

function setup() {
  const list = teams.filter(team => team.name.includes(search)); const chosen = id => selected.some(team => team.id === id)
  app.innerHTML = `<main class="setup"><header><button class="text-button back" data-leagues>חזרה לליגות</button><p class="eyebrow">מגרש הבית שלך</p><h1>בונים ליגה<br><em>משלכם.</em></h1><p>בחרו נבחרות, קבעו קצב, והמשחקים כבר יסתדרו בלוח.</p></header><form id="league-form" class="card"><div class="fields"><label>שם הליגה<input name="name" maxlength="40" placeholder="למשל: הליגה של תום"></label><label>יום פתיחה<input name="startDate" type="date" value="${dateValue()}" required></label></div><section><div class="title"><h2><span>01</span> בוחרים נבחרות</h2><strong>${selected.length} נבחרו</strong></div><input id="search" class="search" placeholder="חיפוש נבחרת..." value="${search}"><div class="random-picker"><label>מספר נבחרות אקראי<input id="random-count" type="number" min="2" max="${teams.length}" value="8"></label><button type="button" id="random-teams">בחירה אקראית</button></div><div class="teams">${list.map(team => `<button type="button" class="team ${chosen(team.id) ? 'selected' : ''}" data-team="${team.id}"><span>${team.flag}</span>${team.name}<b>${chosen(team.id) ? '✓' : '+'}</b></button>`).join('')}</div><p class="hint">צריך לפחות 2 נבחרות. במספר אי-זוגי, נבחרת אחת תנוח בכל מחזור.</p></section><section><div class="title"><h2><span>02</span> קובעים חוקים</h2></div><div class="rules"><fieldset><legend>כמה מפגשים מול כל יריבה?</legend><label class="choice"><input type="radio" name="legs" value="1" checked> סיבוב אחד <small>מפגש אחד לכל זוג</small></label><label class="choice"><input type="radio" name="legs" value="2"> בית וחוץ <small>שני מפגשים לכל זוג</small></label></fieldset><fieldset><legend>כמה משחקים לכל נבחרת בשבוע?</legend><label class="rate"><input name="weekly" type="number" min="1" max="7" value="2"> משחקים בשבוע</label><p class="hint">כל משחקי המחזור יתקיימו באותו יום.</p></fieldset></div></section><button class="primary">מגרילים את הליגה <span>←</span></button><p id="error" class="error"></p></form></main>`
}

function game(game) { const done = game.homeScore !== '' && game.awayScore !== ''; return `<article class="game ${done ? 'done' : ''}"><div class="home"><span>${game.home.flag}</span><b>${game.home.name}</b></div><div class="score"><input data-game="${game.id}" data-side="home" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="שערי ${game.home.name}" value="${game.homeScore}"><i>:</i><input data-game="${game.id}" data-side="away" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="שערי ${game.away.name}" value="${game.awayScore}"></div><div class="away"><b>${game.away.name}</b><span>${game.away.flag}</span></div></article>` }

function dashboard(autoScroll = false) {
  const groups = Object.groupBy(league.fixtures, game => game.date); const dates = Object.keys(groups).sort(); const closestDate = dates.find(date => date >= dateValue()) || dates.at(-1); const completed = league.fixtures.filter(game => game.homeScore !== '' && game.awayScore !== '').length
  app.innerHTML = `<main class="league"><header class="league-head"><button class="text-button" data-leagues>כל הליגות</button><div><p class="eyebrow">עונת משחקים</p><h1>${league.name}</h1></div><button class="text-button" data-signout>התנתקות</button></header><section class="summary"><div><span>נבחרות</span><strong>${league.teams.length}</strong></div><div><span>משחקים שהוזנו</span><strong>${completed} <small>/ ${league.fixtures.length}</small></strong></div><div><span>קצב משחקים</span><strong>${league.gamesPerWeek}<small> בשבוע</small></strong></div></section><div class="layout"><section><div class="heading"><div><p class="eyebrow">לוח המשחקים</p><h2>מתי משחקים?</h2></div></div>${dates.map(date => `<details class="matchday ${date === closestDate ? 'closest' : ''}" ${date === closestDate ? 'open' : ''}><summary><span>${dateText(date)}</span><small>מחזור ${groups[date][0].round}</small></summary><div class="games">${groups[date].map(game).join('')}</div></details>`).join('')}</section><aside><div class="heading"><div><p class="eyebrow">טבלת הליגה</p><h2>מי מובילה?</h2></div><small>נקודות · הפרש · שערים</small></div><div class="table"><table><thead><tr><th>#</th><th>נבחרת</th><th>מש'</th><th>נ'</th><th>ת'</th><th>ה'</th><th>שע'</th><th>הפרש</th><th>נק'</th></tr></thead><tbody>${table().map((team,i) => `<tr><td>${i + 1}</td><td>${team.flag} ${team.name}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.gf}:${team.ga}</td><td>${team.gf - team.ga > 0 ? '+' : ''}${team.gf - team.ga}</td><td><b>${team.points}</b></td></tr>`).join('')}</tbody></table></div></aside></div></main>`
  if (autoScroll) requestAnimationFrame(() => document.querySelector('.matchday.closest')?.scrollIntoView({ block: 'start' }))
}

function render() { if (loading) { app.innerHTML = '<main class="auth-shell"><p>טוענים...</p></main>'; return } if (!user) authScreen(); else if (creating) setup(); else if (league) dashboard(true); else leaguesScreen() }

async function loadLeagues() {
  const { data, error } = await supabase.from('leagues').select('*').order('created_at', { ascending: false })
  if (error) loadError = 'לא הצלחנו לטעון את הליגות. נסו שוב בעוד רגע.'; else { leagues = data.map(fromRow); loadError = '' }
  loading = false; render()
}

async function authenticate(form) {
  const data = new FormData(form); const nickname = data.get('nickname').trim(); const pin = data.get('pin')
  if (!/^[\p{L}\p{N} _-]{2,20}$/u.test(nickname) || !/^\d{6}$/.test(pin)) { authScreen('יש להזין כינוי וקוד של 6 ספרות.'); return }
  const details = { email: accountEmail(nickname), password: pin }
  const login = await supabase.auth.signInWithPassword(details)
  if (login.data.session) { user = login.data.user; await loadLeagues(); return }
  const signup = await supabase.auth.signUp({ ...details, options: { data: { nickname } } })
  if (signup.data.session) { user = signup.data.user; await loadLeagues(); return }
  if (signup.data.user?.identities?.length === 0) { authScreen('הכינוי כבר קיים, אבל הקוד לא מתאים. נסו שוב.'); return }
  authScreen('לא הצלחנו להיכנס כרגע. נסו שוב בעוד רגע.')
}

async function createLeague(form) {
  if (selected.length < 2) { document.querySelector('#error').textContent = 'בחרו לפחות שתי נבחרות כדי להתחיל.'; return }
  const data = new FormData(form); const legs = +data.get('legs'); const gamesPerWeek = +data.get('weekly'); const item = { name: data.get('name').trim() || 'הליגה שלי', teams: selected, gamesPerWeek, fixtures: fixtures(selected, legs, data.get('startDate'), gamesPerWeek) }
  const { data: row, error } = await supabase.from('leagues').insert(toRow(item)).select().single()
  if (error) { document.querySelector('#error').textContent = 'לא הצלחנו לשמור את הליגה. נסו שוב.'; return }
  league = fromRow(row); leagues = [league, ...leagues]; creating = false; render()
}

async function saveScores() {
  const { error } = await supabase.from('leagues').update({ fixtures: league.fixtures }).eq('id', league.id)
  if (error) alert('לא הצלחנו לשמור את התוצאה. נסו שוב.')
}

app.addEventListener('input', event => { if (event.target.id === 'search') { const caret = event.target.selectionStart; search = event.target.value; setup(); const input = document.querySelector('#search'); input.focus(); input.setSelectionRange(caret, caret) } if (event.target.matches('[data-side]')) event.target.value = event.target.value.replace(/\D/g, '').slice(0, 2) })
app.addEventListener('click', async event => {
  const button = event.target.closest('[data-team]'); if (button) { const team = teams.find(team => team.id === +button.dataset.team); selected = selected.some(item => item.id === team.id) ? selected.filter(item => item.id !== team.id) : [...selected, team]; setup(); return }
  if (event.target.id === 'random-teams') { const count = Math.max(2, Math.min(teams.length, Number(document.querySelector('#random-count').value) || 8)); selected = shuffled(teams).slice(0, count); setup(); return }
  if (event.target.closest('[data-create]')) { creating = true; selected = []; search = ''; render(); return }
  if (event.target.closest('[data-leagues]')) { league = null; creating = false; render(); return }
  const open = event.target.closest('[data-open]'); if (open) { league = leagues.find(item => item.id === open.dataset.open); render(); return }
  if (event.target.closest('[data-signout]')) await supabase.auth.signOut()
})
app.addEventListener('change', event => { if (!event.target.matches('[data-side]')) return; const value = event.target.value; if (value !== '' && (!Number.isInteger(+value) || +value < 0)) return; const match = league.fixtures.find(game => game.id === event.target.dataset.game); match[`${event.target.dataset.side}Score`] = value; dashboard(); void saveScores() })
app.addEventListener('submit', event => { event.preventDefault(); if (event.target.id === 'auth-form') { void authenticate(event.target); return } if (event.target.id === 'league-form') void createLeague(event.target) })

supabase.auth.onAuthStateChange((_event, session) => { user = session?.user || null; league = null; creating = false; if (user) void loadLeagues(); else { loading = false; render() } })
const { data: { session } } = await supabase.auth.getSession()
user = session?.user || null; if (user) await loadLeagues(); else { loading = false; render() }
