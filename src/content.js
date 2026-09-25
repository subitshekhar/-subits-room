/* ---------------------------------------------------------------------------
 *  EVERYTHING YOU WRITE LIVES HERE.
 *
 *  The 3D room never needs to change. Edit this file, refresh, done.
 *  All of the text below is placeholder in your voice — swap it for the real
 *  thing. Each section's `kind` decides how the panel renders it.
 * ------------------------------------------------------------------------- */

export const SITE = {
  name: 'PANDA',
  /* Text between asterisks is set apart — its own face and colour. */
  tagline: 'not the *kung fu* one',
  email: 'subit.shekhar@gmail.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/subitshekhar' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/subit-shekhar' },
  ],
}

/* `nav` is the short label in the side index and `title` is the panel
 * heading — deliberately not the same. `hotspot` names the object in the
 * room; it is documentation now rather than something the UI renders. */
export const SECTIONS = {
  /* ---------------------------------------------- LAPTOP → WORK ---------- */
  work: {
    hotspot: 'Laptop',
    nav: 'WORK',
    title: 'PANDA_OS',
    kind: 'terminal',
    boot: ['PANDA_OS v0.1 — booting…', 'mounting /home/panda', 'ok'],
    dirs: {
      '~/work': {
        blurb: 'Where the salary came from.',
        items: [
          {
            name: 'UnifyApps — Product Analyst',
            meta: '2026 → now',
            body:
              'Enterprise workflow automation: the platform large companies use to build AI agents, apps and integrations. ' +
              'I shipped a multi-agent content platform for an $18B CPG company that replaced manual copy rewrites for its ' +
              'top retailers, a computer-use agent that resolves denied medical claims for a 14,000-person RCM firm, and ' +
              'invoicing automation for a 38,000-home rental firm across Yardi and Snowflake.',
          },
          {
            name: 'Orbi — Founding AI Engineer',
            meta: '2024 → 2026',
            body:
              'VC-backed edtech building AI learning companions for children, growing 60% week on week in the US. ' +
              'I built the voice-first conversational layer and the adaptive learning engine behind 100,000+ interactions, ' +
              'plus the ingestion, inference and evaluation pipelines that cut our iteration time threefold. ' +
              'The part I care about most is the safety work: guardrails and content filters, because the users were children.',
          },
          {
            name: 'Walmart Tech — Summer Intern',
            meta: '2025, two months',
            body:
              'Built a replica of Walmart services that could be made to fail on purpose, so ten-odd microservices could be ' +
              'tested against real failure instead of hope. Added automated health checks and deep-dive diagnostics, which ' +
              'is the kind of work nobody notices until an outage gets caught early.',
          },
        ],
      },
      '~/projects': {
        blurb: 'Things that exist because I made them exist.',
        items: [
          {
            name: 'multimodal-learning-companion',
            meta: 'OpenAI · Gemini · realtime voice',
            body:
              'A voice tutor that answers fast enough to feel like a conversation, transcribes as you speak, and lets you ' +
              'cut it off mid-sentence. Underneath: phoneme-level pronunciation scoring with a GPT fallback, and a pipeline ' +
              'that streams from several models and fails over when one of them goes down.',
          },
          {
            name: 'knightsight-ai',
            meta: 'vision + LLM, in the browser',
            body:
              'A chess assistant that reads the board off your screen and answers questions about it in plain English. ' +
              'It keeps the move history alongside what it sees, so it can talk about strategy rather than just the position.',
          },
          {
            name: 'football-match-outcomes',
            meta: 'gradient-boosted trees',
            body:
              '56% accuracy on match results, which sounds modest until you price it against the bookmakers with the Kelly ' +
              'Index. Feature engineering bought the last ten percent.',
          },
        ],
      },
      '~/experiments': {
        blurb: 'Coursework, and things I built to find out how they worked.',
        items: [
          {
            name: 'machine-translation',
            meta: 'seq2seq · BiLSTM + attention',
            body: 'Wrote the attention mechanism out by hand, which is the only way I was ever going to understand it.',
          },
          {
            name: 'bank-management-db',
            meta: 'SQL · 100+ queries',
            body: 'Transaction history, branch transfers, and a front end so someone other than me could use it.',
          },
          {
            name: 'library-issuance-system',
            meta: 'UPPAAL',
            body:
              'Modelled the whole thing as a timed automaton, down to the bank interface that checks your balance before ' +
              'it sells you a membership.',
          },
          { name: 'this-website', meta: 'three.js', body: 'You are standing inside it.' },
        ],
      },
      '~/ideas': {
        blurb: 'Unbuilt. Open to co-conspirators.',
        items: [
          { name: 'idea_001.md', meta: 'startup-shaped', body: 'The one you keep coming back to at 1am.' },
          { name: 'idea_002.md', meta: 'probably a bad idea', body: 'Write it anyway.' },
        ],
      },
    },
  },

  /* ------------------------------------------- BOOKSHELF → THINK --------- */
  think: {
    hotspot: 'Bookshelf',
    nav: 'THINK',
    title: 'THINK',
    kind: 'list',
    subtitle: 'Currently reading, recently finished, permanently unfinished.',
    groups: [
      {
        heading: 'Philosophy',
        items: [
          { name: 'Meditations', meta: 'Marcus Aurelius', body: 'Re-read whenever things get loud.' },
          { name: 'The Myth of Sisyphus', meta: 'Camus', body: '' },
        ],
      },
      {
        heading: 'Psychology',
        items: [
          { name: 'Thinking, Fast and Slow', meta: 'Kahneman', body: '' },
          { name: 'The Body Keeps the Score', meta: 'van der Kolk', body: '' },
        ],
      },
      {
        heading: 'Mathematics',
        items: [
          { name: 'Gödel, Escher, Bach', meta: 'Hofstadter', body: 'Currently on page 200 for the third year running.' },
          { name: 'Linear Algebra Done Right', meta: 'Axler', body: '' },
        ],
      },
      {
        heading: 'Fiction & things I picked up',
        items: [
          { name: 'Blindsight', meta: 'Peter Watts', body: 'Intelligence without consciousness. Ruined my week.' },
          { name: 'Add yours', meta: '', body: '' },
        ],
      },
    ],
  },

  /* ---------------------------------------------- SCARF → LIVERPOOL ------ */
  liverpool: {
    kind: 'liverpool',
    hotspot: 'Photograph',
    nav: 'LIVERPOOL',
    /* Lives in public/. Set to null and the room falls back to a drawn
     * silhouette. Portrait, roughly 3:4 — the frame's print is 0.55 x 0.75. */
    photo: '/mosalah.png',
    title: 'LIVERPOOL',
    subtitle: 'This one needs no explanation.',
    body: [
      'A random match, some crazy goals, a TV, and thankfully a 9 p.m. Premier League kick-off.',
      'And the honest bit: why a result in another country can decide what kind of Sunday you have.',
    ],
    facts: [
      { k: 'Since', v: '2014' },
      { k: 'The night', v: 'Istanbul / Barcelona — pick yours' },
      { k: 'The player', v: 'Mo Salah' },
      { k: 'Current mood', v: 'cautiously terrified' },
    ],
    anthem: "You'll Never Walk Alone",
  },

  /* ---------------------------------------------- TV + PS5 → PLAY -------- */
  play: {
    kind: 'tv',
    hotspot: 'PS5',
    nav: 'PLAY',
    title: 'CONTINUE PLAYING',
    items: [
      { name: 'Black Myth: Wukong', meta: '34 hrs', body: 'Second boss. Still.' },
      { name: 'Cyberpunk 2077', meta: '80 hrs', body: 'Phantom Liberty fixed it. I said what I said.' },
      { name: 'Elden Ring', meta: '∞', body: 'Permanent resident.' },
      { name: 'FIFA / FC', meta: 'career mode only', body: 'Managing Liverpool. Obviously.' },
    ],
    allTime: ['RDR2', 'The Witcher 3', 'Hollow Knight', 'GTA V'],
  },

  /* ----------------------------------- CAR SHELF + HELMET → MACHINES ----- */
  machines: {
    kind: 'list',
    hotspot: 'Model car',
    nav: 'MACHINES',
    title: 'MACHINES',
    subtitle: 'Things that move, and the engineering that makes them move.',
    groups: [
      {
        heading: 'The shelf',
        items: [
          { name: 'Ayrton Senna — MP4/4', meta: '1:43', body: 'The one I would save in a fire.' },
          { name: 'Lancia Delta Integrale', meta: '1:43', body: 'Group B hangover, rally hero.' },
          { name: 'Add the rest', meta: '', body: 'This shelf only grows.' },
        ],
      },
      {
        heading: 'Fascinated by',
        items: [
          { name: 'Naturally aspirated engines', meta: '', body: 'An endangered species.' },
          { name: 'Motorcycle dynamics', meta: '', body: 'Countersteering still feels like a bug in physics.' },
          { name: 'F1 aero', meta: '', body: 'Ground effect is just plumbing with a budget.' },
        ],
      },
    ],
  },

  /* ---------------------------------------------- GUITAR → MUSIC --------- */
  music: {
    kind: 'list',
    hotspot: 'Record',
    nav: 'MUSIC',
    title: 'MUSIC',
    subtitle: 'What is on, and what has been on for years.',
    groups: [
      {
        heading: 'What I actually play',
        items: [
          { name: 'The same four chords', meta: 'daily', body: 'And I am at peace with that.' },
          { name: 'Learning: fingerstyle', meta: 'in progress', body: '' },
        ],
      },
      {
        heading: 'On repeat',
        items: [
          { name: 'Pink Floyd', meta: '', body: '' },
          { name: 'Arctic Monkeys', meta: '', body: '' },
          { name: 'Whatever is on right now', meta: '', body: 'Swap this out often — it dates the room nicely.' },
        ],
      },
    ],
  },

  /* ---------------------------------------------- RACKET → SPORT --------- */
  sport: {
    kind: 'list',
    hotspot: 'Racquet',
    nav: 'SPORT',
    title: 'SPORT',
    subtitle: 'Squash seriously. Everything else enthusiastically and badly.',
    groups: [
      {
        heading: 'Squash',
        items: [
          { name: 'Court 3, most evenings', meta: '3x a week', body: 'The drop shot is fine. Getting back to the T is a work in progress.' },
        ],
      },
      {
        heading: 'Football',
        items: [{ name: 'Weekend five-a-side', meta: '', body: 'Plays like a man who watches a lot of football.' }],
      },
      {
        heading: 'Tried once',
        items: [{ name: 'Badminton, climbing, running', meta: '', body: 'Ask me about the running.' }],
      },
    ],
  },

  /* ---------------------------------------------- MAP → PLACES ----------- */
  places: {
    kind: 'places',
    hotspot: 'The wall',
    nav: 'PLACES',
    title: 'PLACES',
    subtitle: 'Pins in a paper map, which is a deliberately inefficient way to remember things.',
    been: ['Bangalore', 'San Francisco', 'Liverpool', 'Singapore'],
    next: ['Japan', 'Spain', 'Italy', 'Switzerland'],
  },


  /* -------------------------------------------- CAMERA → PHOTOS --------- */
  photos: {
    hotspot: 'Camera',
    nav: 'PHOTOS',
    title: 'WHAT I POINTED IT AT',
    kind: 'gallery',
    subtitle: 'Seventeen I kept.',
    /* Files live in public/photos/. `place` is a guess from the frame —
     * swap in the real ones. Leave it empty and only the year shows. */
    shots: [
      { title: 'The bird got there first', place: 'Night', year: '2021', src: '/photos/the-bird-got-there-first.jpg' },
      { title: 'All silhouette', place: 'Live', year: '2023', src: '/photos/all-silhouette.jpg' },
      { title: 'Leopard, in profile', place: '', year: '2019', src: '/photos/leopard-in-profile.jpg' },
      { title: 'The water did the work', place: 'Dusk', year: '2022', src: '/photos/the-water-did-the-work.jpg' },
      { title: 'Smoke going up', place: 'Live', year: '2022', src: '/photos/smoke-going-up.jpg' },
      { title: 'Close enough for the eyes', place: '', year: '2022', src: '/photos/close-enough-for-the-eyes.jpg' },
      { title: 'Turned to face each other', place: 'Live', year: '2023', src: '/photos/turned-to-face-each-other.jpg' },
      { title: 'Gulls over the boats', place: 'Water', year: '2023', src: '/photos/gulls-over-the-boats.jpg' },
      { title: 'Long exposure at the desk', place: '', year: '2022', src: '/photos/long-exposure-at-the-desk.jpg' },
      { title: 'Crescent, through the leaves', place: 'Night', year: '2022', src: '/photos/crescent-through-the-leaves.jpg' },
      { title: 'From the back of the crowd', place: 'Live', year: '2022', src: '/photos/from-the-back-of-the-crowd.jpg' },
      { title: 'He sat still for it', place: '', year: '2022', src: '/photos/he-sat-still-for-it.jpg' },
      { title: 'Behind the music stand', place: 'Live', year: '2023', src: '/photos/behind-the-music-stand.jpg' },
      { title: 'Caught mid-drop', place: '', year: '2022', src: '/photos/caught-mid-drop.jpg' },
      { title: 'Red light, the whole band', place: 'Live', year: '2022', src: '/photos/red-light-whole-band.jpg' },
      { title: 'Vocals and bass', place: 'Live', year: '2023', src: '/photos/vocals-and-bass.jpg' },
      { title: 'Straight into the lens', place: 'Live', year: '2022', src: '/photos/straight-into-the-lens.jpg' },
    ],
  },

  /* ------------------------------------------- SPEAKER → LISTEN --------- */
  awards: {
    hotspot: 'Trophy',
    nav: 'AWARDS',
    title: 'WORTH THE SHELF SPACE',
    kind: 'list',
    subtitle: 'The short list. Everything else was just a nice email.',
    groups: [
      {
        heading: 'On the shelf',
        items: [
          {
            name: 'Bruce Henderson Insight Ideathon',
            meta: 'BCG · 2024',
            body: 'Cleared the first round of a national competition with a fix for how airlines handle grievances.',
          },
          {
            name: 'National Talent Search Examination',
            meta: 'NCERT · 2018',
            body: '1,408 of us got through Stage 1 out of a hundred thousand.',
          },
        ],
      },
      {
        heading: 'Rooms I talked my way into',
        items: [
          {
            name: 'Harvard Summer Business Academy',
            meta: 'Harvard Student Agencies · 2020',
            body:
              'Ten of us went from India. Elevator pitches, PEST, SWOT, all of it pointed at ergonomic chairs.',
          },
          {
            name: 'Placement Unit — core committee',
            meta: 'BITS Pilani · 2024 → 2025',
            body:
              'Twelve students out of two thousand, sitting between the batch and 300+ companies. ' +
              'In practice it meant being the person everyone texts at midnight.',
          },
        ],
      },
      {
        heading: 'Things I ran',
        items: [
          {
            name: 'PIEDS — Events Head',
            meta: 'BITS Pilani · 2024',
            body:
              'The campus incubator, the one that produced RedBus, Swiggy and Pixxel. I put on a founders ' +
              'conclave for 400 people and got turnout up by a third.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------ NOTEBOOK → THINKING -------- */
  thinking: {
    kind: 'notes',
    hotspot: 'Notebook',
    nav: 'THOUGHTS',
    title: 'Things I am currently thinking about',
    updated: 'September 2026',
    notes: [
      'Why do people become attached to AI companions?',
      'Is consciousness necessary for intelligence?',
      'Why does Liverpool somehow make football stressful?',
      'Should I actually learn Rust, or do I just like the idea of having learned Rust?',
      'Is taste a skill or an accumulation of exposure?',
    ],
  },

  /* ---------------------------------------------- BED → 3AM -------------- */
  bed: {
    kind: 'writing',
    hotspot: 'Bed',
    nav: '3AM',
    title: '3:00 AM',
    subtitle: 'The unexpected one.',
    body: [
      'This is where the writing goes. Not blog posts — the other thing.',
      'Half-formed paragraphs about attention, about building things nobody asked for, about the strange grief of finishing a project.',
      'Keep it short. Keep it honest. Nobody scrolls at 3am for a listicle.',
    ],
    entries: [
      { name: 'On shipping things that scare you', meta: 'draft' },
      { name: 'Notes on leaving a job', meta: 'unpublished, probably forever' },
    ],
  },

  /* ------------------------------------------- DRAWER → EASTER EGG ------- */
  drawer: {
    kind: 'drawer',
    hotspot: '',
    title: 'You found the drawer.',
    subtitle: 'Nothing in here is load-bearing.',
    items: [
      'A domain I bought in 2021 and never used',
      'Three abandoned startup landing pages',
      'A screenshot of a bug that took eleven days',
      'A playlist called "focus" with nine songs, none of which help',
      'The first commit of this website: "room??"',
      'An unsent email to a founder I admired',
      'A very bad joke about monads',
    ],
  },
}

/* Order matters — this drives the little index in the corner. */
export const SECTION_ORDER = [
  'work',
  'think',
  'liverpool',
  'play',
  'machines',
  'photos',
  'awards',
  'music',
  'sport',
  'places',
  'thinking',
  'bed',
]
