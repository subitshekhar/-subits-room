/* ---------------------------------------------------------------------------
 * A small generative pad.
 *
 * The speaker should play something the moment you press play, before any
 * real audio exists. Give a track a `src` in content.js and the player uses
 * the file instead; this is only the fallback.
 * ------------------------------------------------------------------------- */

const SCALES = [
  [0, 3, 5, 7, 10], /* minor pentatonic */
  [0, 2, 4, 7, 9], /* major pentatonic */
  [0, 2, 3, 7, 10],
  [0, 3, 5, 8, 10],
]
const ROOTS = [196.0, 220.0, 174.61, 146.83]
const PROGRESSION = [0, 5, 3, 7]

export function createSynth() {
  let ctx = null
  let master = null
  let bus = null
  let timer = null
  let step = 0

  const supported = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext)

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()

    master = ctx.createGain()
    master.gain.value = 0.0001
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1700
    filter.Q.value = 0.6
    filter.connect(master)

    /* a long echo does most of the work of making this sound deliberate */
    const delay = ctx.createDelay(1.5)
    delay.delayTime.value = 0.38
    const feedback = ctx.createGain()
    feedback.gain.value = 0.34
    const wet = ctx.createGain()
    wet.gain.value = 0.3
    filter.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(master)

    bus = filter
  }

  function note(freq, at, dur, vel, type = 'triangle') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    /* exponential ramps cannot reach zero, hence the epsilons */
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(vel, at + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(gain)
    gain.connect(bus)
    osc.start(at)
    osc.stop(at + dur + 0.06)
  }

  return {
    supported,

    async start(seed) {
      if (!supported()) return false
      if (!ctx) build()
      if (ctx.state === 'suspended') await ctx.resume()

      clearInterval(timer)
      step = 0

      const scale = SCALES[seed % SCALES.length]
      const root = ROOTS[seed % ROOTS.length]

      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime)
      master.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 1.1)

      const tick = () => {
        const at = ctx.currentTime + 0.03
        const bar = step >> 3

        if (step % 8 === 0) {
          const shift = PROGRESSION[bar % PROGRESSION.length]
          ;[0, 2, 4].forEach((d) => {
            note((root * Math.pow(2, (scale[d] + shift) / 12)) / 2, at, 3.6, 0.05, 'sine')
          })
        }

        const degree = scale[(step * 3 + bar) % scale.length]
        const octave = step % 4 === 2 ? 2 : 1
        note(root * Math.pow(2, degree / 12) * octave, at, 1.3, 0.085)
        step++
      }

      tick()
      timer = setInterval(tick, 430)
      return true
    },

    stop() {
      clearInterval(timer)
      timer = null
      if (!ctx || !master) return
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime)
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    },

    dispose() {
      this.stop()
      const dying = ctx
      ctx = null
      if (dying) setTimeout(() => dying.close().catch(() => {}), 700)
    },
  }
}
