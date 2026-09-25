/* ---------------------------------------------------------------------------
 *  Run once: `npm run spotify:auth`
 *
 *  Spotify will only hand over your own listening data if you log in, and
 *  the access token it gives back dies after an hour. The refresh token
 *  does not, so this gets one, prints it, and then you never run it again.
 *
 *  Before running, at https://developer.spotify.com/dashboard create an app
 *  and add exactly this redirect URI:
 *
 *      http://127.0.0.1:8888/callback
 *
 *  then put the app's id and secret in .env.local:
 *
 *      SPOTIFY_CLIENT_ID=...
 *      SPOTIFY_CLIENT_SECRET=...
 * ------------------------------------------------------------------------- */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const PORT = 8888
const REDIRECT = `http://127.0.0.1:${PORT}/callback`
/* enough to read what you have been playing, and nothing else */
const SCOPES = 'user-top-read user-read-recently-played'

function env() {
  let raw = ''
  try {
    raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  } catch {
    /* fall through to the real environment */
  }
  const out = { ...process.env }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = env()

if (!id || !secret) {
  console.error(
    'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.\n' +
      'Put them in .env.local — see the comment at the top of this file.'
  )
  process.exit(1)
}

const state = randomBytes(8).toString('hex')
const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    client_id: id,
    response_type: 'code',
    redirect_uri: REDIRECT,
    scope: SCOPES,
    state,
  })

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }

  const done = (msg) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(`<body style="font:16px system-ui;padding:3rem">${msg}</body>`)
  }

  if (url.searchParams.get('state') !== state) {
    done('State did not match. Close this and run the command again.')
    server.close()
    process.exit(1)
  }

  const code = url.searchParams.get('code')
  if (!code) {
    done(`Spotify said: ${url.searchParams.get('error')}`)
    server.close()
    process.exit(1)
  }

  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT,
    }),
  })

  const body = await r.json()
  if (!r.ok) {
    done(`Token exchange failed: ${body.error_description ?? r.status}`)
    console.error(body)
    server.close()
    process.exit(1)
  }

  done('Done. Back to the terminal.')
  console.log('\nAdd this to .env.local:\n')
  console.log(`SPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n`)
  console.log('Then run:  npm run spotify\n')
  server.close()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('\nOpen this in your browser and approve:\n')
  console.log(authUrl + '\n')
})
