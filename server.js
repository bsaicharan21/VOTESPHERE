const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════
app.use(express.json());

// Skip ngrok browser warning for all responses
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════
// LOCAL STORAGE (JSON file)
// ═══════════════════════════════════════════
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default seed data
const DEFAULT_DATA = {
  elections: [
    {
      id: 'e1', title: 'Presidential Election 2024', type: 'plurality',
      desc: 'Annual presidential election for the student body',
      status: 'live', registeredVoters: 500, maxSelections: 1,
      start: '2024-12-01', end: '2024-12-31',
      emoji: '🏛️', color: '#7c3aed',
      candidates: [
        { id: 'c1', name: 'Alexandra Voss', party: 'Progressive Alliance', emoji: '🌟', color: '#7c3aed', bio: 'Former VP, 12 years experience', votes: 0 },
        { id: 'c2', name: 'Marcus Chen', party: 'Liberty Front', emoji: '⚡', color: '#06b6d4', bio: 'Tech entrepreneur, innovation first', votes: 0 },
        { id: 'c3', name: 'Sofia Ramirez', party: 'Unity Coalition', emoji: '🌊', color: '#ec4899', bio: 'Community organizer, grassroots', votes: 0 },
        { id: 'c4', name: 'James Okafor', party: 'Green Future', emoji: '🌸', color: '#10b981', bio: 'Environmental scientist, sustainability', votes: 0 },
      ]
    },
    {
      id: 'e2', title: 'Best Campus Project', type: 'approval',
      desc: 'Approve all projects you support — multiple selections allowed',
      status: 'live', registeredVoters: 300, maxSelections: 10,
      start: '2024-12-05', end: '2024-12-25',
      emoji: '🎓', color: '#06b6d4',
      candidates: [
        { id: 'c5', name: 'Solar Roof Initiative', party: 'Green Tech', emoji: '☀️', color: '#f59e0b', bio: 'Campus-wide solar panel installation', votes: 0 },
        { id: 'c6', name: 'Mental Health App', party: 'Student Wellness', emoji: '🧠', color: '#ec4899', bio: '24/7 anonymous support platform', votes: 0 },
        { id: 'c7', name: 'Open Library 24h', party: 'Academic Access', emoji: '📚', color: '#7c3aed', bio: 'Round-the-clock library access', votes: 0 },
        { id: 'c8', name: 'Urban Garden', party: 'Sustainability', emoji: '🌱', color: '#10b981', bio: 'Community garden and food program', votes: 0 },
        { id: 'c9', name: 'Esports Arena', party: 'Recreation', emoji: '🎮', color: '#f97316', bio: 'State-of-the-art gaming center', votes: 0 },
      ]
    },
    {
      id: 'e3', title: 'Faculty of the Year', type: 'ranked',
      desc: 'Rank your top 3 choices — ranked choice voting applied',
      status: 'live', registeredVoters: 800, maxSelections: 3,
      start: '2024-12-10', end: '2024-12-28',
      emoji: '🏆', color: '#f59e0b',
      candidates: [
        { id: 'ca', name: 'Dr. Elena Park', party: 'Computer Science', emoji: '💻', color: '#7c3aed', bio: 'AI & Machine Learning expert', votes: 0 },
        { id: 'cb', name: 'Prof. William Hart', party: 'Physics Dept.', emoji: '⚛️', color: '#06b6d4', bio: 'Quantum computing pioneer', votes: 0 },
        { id: 'cc', name: 'Dr. Aisha Nkosi', party: 'Medical School', emoji: '🩺', color: '#ec4899', bio: 'Groundbreaking oncology research', votes: 0 },
        { id: 'cd', name: 'Prof. Raj Patel', party: 'Engineering', emoji: '⚙️', color: '#f59e0b', bio: 'Robotics and automation specialist', votes: 0 },
        { id: 'ce', name: 'Dr. Laura Kim', party: 'Economics', emoji: '📊', color: '#10b981', bio: 'Behavioral economics innovator', votes: 0 },
      ]
    }
  ],
  voters: [],
  voteLog: []  // Stores every vote: { timestamp, electionId, voterId, candidateIds }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDB() {
  ensureDataDir();
  let data;
  if (!fs.existsSync(DB_FILE)) {
    writeDB(DEFAULT_DATA);
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  } else {
    try {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (err) {
      console.error('Error reading DB:', err);
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  // --- Auto-cleanup elections older than 10 days ---
  const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let changed = false;
  
  const defaultIds = ['e1', 'e2', 'e3'];
  const newElections = data.elections.filter(e => {
    if (defaultIds.includes(e.id)) return true; // Keep default ones
    const timestamp = parseInt(e.id.substring(1));
    if (!isNaN(timestamp) && (now - timestamp > TEN_DAYS)) {
      changed = true;
      return false; // delete old ones
    }
    return true;
  });

  if (changed) {
    data.elections = newElections;
    const validIds = newElections.map(e => e.id);
    data.voteLog = (data.voteLog || []).filter(v => validIds.includes(v.electionId));
    writeDB(data);
  }

  return data;
}

function writeDB(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════

// ── GET all elections ──
app.get('/api/elections', (req, res) => {
  const db = readDB();
  res.json(db.elections);
});

// ── GET election by ID (search by election ID) ──
app.get('/api/elections/:id', (req, res) => {
  const db = readDB();
  const election = db.elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  res.json(election);
});

// ── SEARCH elections by ID or title ──
app.get('/api/search', (req, res) => {
  const db = readDB();
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);
  const results = db.elections.filter(e =>
    e.id.toLowerCase().includes(q) ||
    e.title.toLowerCase().includes(q)
  );
  res.json(results);
});

// ── GET results for an election by ID ──
app.get('/api/elections/:id/results', (req, res) => {
  const db = readDB();
  const election = db.elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  const sorted = [...election.candidates].sort((a, b) => b.votes - a.votes);
  const totalVotes = sorted.reduce((s, c) => s + c.votes, 0);
  // Get vote log entries for this election
  const electionVotes = (db.voteLog || []).filter(v => v.electionId === req.params.id);
  res.json({
    election: {
      id: election.id,
      title: election.title,
      type: election.type,
      status: election.status,
      registeredVoters: election.registeredVoters,
      emoji: election.emoji,
      color: election.color,
    },
    totalVotes,
    turnout: election.registeredVoters > 0 ? Math.round(totalVotes / election.registeredVoters * 100) : 0,
    candidates: sorted,
    voteLog: electionVotes,
  });
});

// ── POST create a new election ──
app.post('/api/elections', (req, res) => {
  const db = readDB();
  const { title, type, desc, registeredVoters, maxSelections, start, end, emoji, color, candidates } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newElection = {
    id: 'e' + Date.now(),
    title,
    type: type || 'plurality',
    desc: desc || '',
    status: 'soon',
    registeredVoters: registeredVoters || 100,
    maxSelections: maxSelections || 1,
    start: start || new Date().toISOString().split('T')[0],
    end: end || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    emoji: emoji || '🗳️',
    color: color || '#7c3aed',
    candidates: candidates || [
      { id: 'c' + Date.now(), name: 'Candidate A', party: 'Party A', emoji: '🌟', color: '#7c3aed', bio: '', votes: 0 },
      { id: 'c' + (Date.now() + 1), name: 'Candidate B', party: 'Party B', emoji: '⚡', color: '#06b6d4', bio: '', votes: 0 },
    ]
  };
  db.elections.push(newElection);
  writeDB(db);
  res.status(201).json(newElection);
});

// ── PUT update election ──
app.put('/api/elections/:id', (req, res) => {
  const db = readDB();
  const idx = db.elections.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Election not found' });
  const updates = req.body;
  Object.assign(db.elections[idx], updates);
  writeDB(db);
  res.json(db.elections[idx]);
});

// ── PUT update election status ──
app.put('/api/elections/:id/status', (req, res) => {
  const db = readDB();
  const idx = db.elections.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Election not found' });
  db.elections[idx].status = req.body.status;
  writeDB(db);
  res.json(db.elections[idx]);
});

// ── POST cast a vote ──
app.post('/api/elections/:id/vote', (req, res) => {
  const db = readDB();
  const election = db.elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  if (election.status !== 'live') return res.status(400).json({ error: 'Election is not live' });

  const { candidateIds, voterName, voterEmail } = req.body;
  if (!candidateIds || !candidateIds.length) return res.status(400).json({ error: 'No candidates selected' });

  // Increment vote counts
  candidateIds.forEach(cid => {
    const candidate = election.candidates.find(c => c.id === cid);
    if (candidate) candidate.votes++;
  });

  // Generate voter ID
  const voterId = 'V' + String(db.voteLog.length + 1).padStart(4, '0');

  // Log the vote with voter details
  const voteEntry = {
    id: 'vl' + Date.now(),
    timestamp: new Date().toISOString(),
    electionId: req.params.id,
    electionTitle: election.title,
    voterId,
    voterName: voterName || 'Anonymous',
    voterEmail: voterEmail || '',
    candidateIds,
    candidateNames: candidateIds.map(cid => {
      const c = election.candidates.find(x => x.id === cid);
      return c ? c.name : 'Unknown';
    }),
  };
  if (!db.voteLog) db.voteLog = [];
  db.voteLog.push(voteEntry);

  // Update voter record if voter exists
  if (voterEmail) {
    const voter = db.voters.find(v => v.email === voterEmail);
    if (voter) {
      voter.status = 'voted';
      voter.votedFor = voteEntry.candidateNames.join(', ');
    }
  }

  writeDB(db);
  res.json({ success: true, voteEntry });
});

// ── POST simulate voting ──
app.post('/api/elections/:id/simulate', (req, res) => {
  const db = readDB();
  const election = db.elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  const count = Math.floor(election.registeredVoters * 0.4);
  for (let i = 0; i < count; i++) {
    const c = election.candidates[Math.floor(Math.random() * election.candidates.length)];
    if (c) c.votes++;
  }
  // Update voter records
  db.voters.forEach(v => {
    if (Math.random() > 0.4) {
      v.status = 'voted';
      v.votedFor = election.candidates[Math.floor(Math.random() * election.candidates.length)]?.name || '—';
    }
  });
  writeDB(db);
  res.json({ success: true, simulatedVotes: count });
});

// ── POST reset votes for all elections ──
app.post('/api/reset', (req, res) => {
  const db = readDB();
  db.elections.forEach(e => e.candidates.forEach(c => c.votes = 0));
  db.voters.forEach(v => { v.status = 'pending'; v.votedFor = null; });
  db.voteLog = [];
  writeDB(db);
  res.json({ success: true });
});

// ── PUT update candidates for an election ──
app.put('/api/elections/:id/candidates', (req, res) => {
  const db = readDB();
  const election = db.elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  election.candidates = req.body.candidates;
  writeDB(db);
  res.json(election);
});

// ── GET all voters ──
app.get('/api/voters', (req, res) => {
  const db = readDB();
  res.json(db.voters);
});

// ── POST generate voters ──
app.post('/api/voters/generate', (req, res) => {
  const db = readDB();
  const FIRST = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Riley', 'Casey', 'Avery', 'Blake', 'Quinn', 'Logan', 'Sage', 'Drew', 'Rowan', 'Finley', 'Parker', 'Hayden'];
  const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Martinez', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'White', 'Harris', 'Martin'];
  db.voters = Array.from({ length: 20 }, (_, i) => {
    const name = FIRST[Math.floor(Math.random() * FIRST.length)] + ' ' + LAST[Math.floor(Math.random() * LAST.length)];
    return { id: `V${String(i + 1).padStart(4, '0')}`, name, email: name.toLowerCase().replace(' ', '.') + '@campus.edu', status: 'pending', votedFor: null };
  });
  writeDB(db);
  res.json(db.voters);
});

// ── PUT toggle voter status ──
app.put('/api/voters/:id/toggle', (req, res) => {
  const db = readDB();
  const voter = db.voters.find(v => v.id === req.params.id);
  if (!voter) return res.status(404).json({ error: 'Voter not found' });
  const map = { pending: 'voted', voted: 'abstained', abstained: 'pending' };
  voter.status = map[voter.status] || 'pending';
  writeDB(db);
  res.json(voter);
});

// ── GET vote log (all votes) ──
app.get('/api/votelog', (req, res) => {
  const db = readDB();
  res.json(db.voteLog || []);
});

// ── GET vote log filtered by election ID ──
app.get('/api/votelog/:electionId', (req, res) => {
  const db = readDB();
  const logs = (db.voteLog || []).filter(v => v.electionId === req.params.electionId);
  res.json(logs);
});

// ── DELETE election ──
app.delete('/api/elections/:id', (req, res) => {
  const db = readDB();
  db.elections = db.elections.filter(e => e.id !== req.params.id);
  db.voteLog = (db.voteLog || []).filter(v => v.electionId !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ── POST reset DB to defaults ──
app.post('/api/reset-db', (req, res) => {
  writeDB(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  res.json({ success: true });
});

// ═══════════════════════════════════════════
// FALLBACK — serve SPA
// ═══════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✦ VoteSphere Server running at http://localhost:${PORT}`);
  // Show local network IP for sharing with other devices
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  🌐 Network access: http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(`  📁 Data stored in: ${DB_FILE}`);
  console.log(`\n  Share the 🌐 Network URL with people on your Wi-Fi to let them vote!\n`);
});
