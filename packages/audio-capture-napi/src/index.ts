// audio-capture-napi: cross-platform audio capture using SoX (rec) on macOS
// and arecord (ALSA) on Linux. Replaces the original cpal-based native module.

import { type ChildProcess, spawn, spawnSync } from 'child_process'

// ─── State ───────────────────────────────────────────────────────────

let recordingProcess: ChildProcess | null = null
let availabilityCache: boolean | null = null

// ─── Helpers ─────────────────────────────────────────────────────────

function commandExists(cmd: string): boolean {
  const result = spawnSync(cmd, ['--version'], {
    stdio: 'ignore',
    timeout: 3000,
  })
  return result.error === undefined
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Check whether a supported audio recording command is available.
 * Returns true if `rec` (SoX) is found on macOS, or `arecord` (ALSA) on Linux.
 * Windows is not supported and always returns false.
 */
export function isNativeAudioAvailable(): boolean {
  if (availabilityCache !== null) {
    return availabilityCache
  }

  if (process.platform === 'win32') {
    availabilityCache = false
    return false
  }

  if (process.platform === 'darwin') {
    // macOS: use SoX rec
    availabilityCache = commandExists('rec')
    return availabilityCache
  }

  if (process.platform === 'linux') {
    // Linux: prefer arecord, fall back to rec
    availabilityCache = commandExists('arecord') || commandExists('rec')
    return availabilityCache
  }

  availabilityCache = false
  return false
}

/**
 * Check whether a recording is currently in progress.
 */
export function isNativeRecordingActive(): boolean {
  return recordingProcess !== null && !recordingProcess.killed
}

/**
 * Stop the active recording process, if any.
 */
export function stopNativeRecording(): void {
  if (recordingProcess) {
    const proc = recordingProcess
    recordingProcess = null
    if (!proc.killed) {
      proc.kill('SIGTERM')
    }
  }
}

/**
 * Start recording audio. Raw PCM data (16kHz, 16-bit signed, mono) is
 * streamed via the onData callback. onEnd is called when recording stops
 * (either from silence detection or process termination).
 *
 * Returns true if recording started successfully, false otherwise.
 */
export function startNativeRecording(
  onData: (data: Buffer) => void,
  onEnd: () => void,
): boolean {
  // Don't start if already recording
  if (isNativeRecordingActive()) {
    stopNativeRecording()
  }

  if (!isNativeAudioAvailable()) {
    return false
  }

  let child: ChildProcess

  if (process.platform === 'darwin' || (process.platform === 'linux' && commandExists('rec'))) {
    // Use SoX rec: output raw PCM 16kHz 16-bit signed mono to stdout
    child = spawn(
      'rec',
      [
        '-q',           // quiet
        '--buffer',
        '1024',         // small buffer for low latency
        '-t', 'raw',    // raw PCM output
        '-r', '16000',  // 16kHz sample rate
        '-e', 'signed', // signed integer encoding
        '-b', '16',     // 16-bit
        '-c', '1',      // mono
        '-',            // output to stdout
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } else if (process.platform === 'linux' && commandExists('arecord')) {
    // Use arecord: output raw PCM 16kHz 16-bit signed LE mono to stdout
    child = spawn(
      'arecord',
      [
        '-f', 'S16_LE', // signed 16-bit little-endian
        '-r', '16000',  // 16kHz sample rate
        '-c', '1',      // mono
        '-t', 'raw',    // raw PCM, no header
        '-q',           // quiet
        '-',            // output to stdout
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } else {
    return false
  }

  recordingProcess = child

  child.stdout?.on('data', (chunk: Buffer) => {
    onData(chunk)
  })

  // Consume stderr to prevent backpressure
  child.stderr?.on('data', () => {})

  child.on('close', () => {
    recordingProcess = null
    onEnd()
  })

  child.on('error', () => {
    recordingProcess = null
    onEnd()
  })

  return true
}
