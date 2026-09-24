/* ---------------------------------------------------------------------------
 *  EVERYTHING YOU WRITE LIVES HERE.
 *
 *  The 3D room never needs to change. Edit this file, refresh, done.
 *  All of the text below is placeholder in your voice — swap it for the real
 *  thing. Each section's `kind` decides how the panel renders it.
 * ------------------------------------------------------------------------- */

export const SITE = {
  name: 'SUBIT',
  tagline: "Don't read my résumé. Come into my room.",
  email: 'subit.shekhar@gmail.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'X', href: 'https://x.com/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/' },
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
    title: 'SUBIT_OS',
    kind: 'terminal',
    boot: ['SUBIT_OS v0.1 — booting…', 'mounting /home/subit', 'ok'],
    dirs: {
      '~/work': {
        blurb: 'Where the salary came from.',
        items: [
          {
            name: 'Company — Senior Engineer',
            meta: '2023 → now',
            body: 'One line on what you own. The system, the scale, the thing that would break if you left.',
          },
          {
            name: 'Previous Co. — Engineer',
            meta: '2021 → 2023',
            body: 'What you shipped and what it taught you.',
          },
        ],
      },
      '~/projects': {
        blurb: 'Things that exist because I made them exist.',
        items: [
          {
            name: 'project-one',
            meta: 'TypeScript · Postgres',
            body: 'What it does in one sentence. Who uses it. Link it.',
            href: '#',
          },
          {
            name: 'project-two',
            meta: 'Python · LLMs',
            body: 'The AI thing. Say the honest version, not the launch-post version.',
            href: '#',
          },
        ],
      },
      '~/experiments': {
        blurb: 'Weekend code. No promises about the tests.',
        items: [
          { name: 'tiny-interpreter', meta: 'Rust (allegedly)', body: 'Started. Not finished. Still thinking about it.' },
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
      'Two sentences on how it started. A cousin, a TV, a night you were too young to be awake for.',
      'And the honest bit: why a result in another country can decide what kind of Sunday you have.',
    ],
    facts: [
      { k: 'Since', v: '20XX' },
      { k: 'The night', v: 'Istanbul / Barcelona — pick yours' },
      { k: 'The player', v: 'Gerrard' },
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
    been: ['Your city', 'Somewhere you loved', 'Somewhere that surprised you', 'Somewhere overrated'],
    next: ['Anfield', 'Japan', 'Iceland', 'A long drive with no plan'],
  },


  /* -------------------------------------------- CAMERA → PHOTOS --------- */
  photos: {
    hotspot: 'Camera',
    nav: 'PHOTOS',
    title: 'SHOT ON A SATURDAY',
    kind: 'gallery',
    subtitle: 'Placeholder frames. Drop real ones into public/photos/ and point `src` at them.',
    shots: [
      { title: 'Morning, from the balcony', place: 'Home', year: '2025', src: null, tint: ['#e8c9a0', '#8c6b4f'] },
      { title: 'The long way back', place: 'Somewhere north', year: '2025', src: null, tint: ['#9fb8c8', '#2f4658'] },
      { title: 'Nobody on the pitch', place: 'Sunday, 7am', year: '2024', src: null, tint: ['#b6cfa6', '#3e5a3a'] },
      { title: 'Shutter left open', place: 'A road at night', year: '2024', src: null, tint: ['#c9a5c4', '#3b2a44'] },
      { title: 'She wasn\u2019t looking', place: 'A café', year: '2024', src: null, tint: ['#e0cdbb', '#6b584a'] },
      { title: 'Too much grain, kept anyway', place: 'Anfield', year: '2023', src: null, tint: ['#d99a9a', '#5c2027'] },
    ],
  },

  /* ------------------------------------------- SPEAKER → LISTEN --------- */
  listen: {
    hotspot: 'Speaker',
    nav: 'LISTEN',
    title: 'NOW PLAYING',
    kind: 'player',
    subtitle: 'Press play. With no mp3 set, the room improvises something itself.',
    /* Give a track a `src` (e.g. '/music/thing.mp3') and it plays the file.
     * Leave it null and the page synthesises a slow pad in that key instead. */
    tracks: [
      { title: 'Rooms we do not leave', artist: 'placeholder', src: null, seconds: 96 },
      { title: 'Late, and still thinking', artist: 'placeholder', src: null, seconds: 84 },
      { title: 'Seventy-two hours', artist: 'placeholder', src: null, seconds: 108 },
      { title: 'Nothing to add', artist: 'placeholder', src: null, seconds: 72 },
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
  'listen',
  'music',
  'sport',
  'places',
  'thinking',
  'bed',
]
