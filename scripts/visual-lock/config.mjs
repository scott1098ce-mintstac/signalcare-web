export const VISUAL_LOCK_PORT = Number(process.env.SIGNALCARE_VISUAL_LOCK_PORT || 4173)
export const VISUAL_LOCK_ORIGIN = `http://127.0.0.1:${VISUAL_LOCK_PORT}`

export const FOUNDER_BASELINE_APPROVAL_VALUE = 'I-approve-locked-baseline-update'

export const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
]

export const BROWSERS = ['chromium', 'webkit']

export const SURFACES = [
  { id: 'command-queue', path: '/visual-lock/command-queue' },
  { id: 'command-queue-empty', path: '/visual-lock/command-queue-empty' },
  { id: 'patients', path: '/visual-lock/patients' },
  { id: 'workspace', path: '/visual-lock/workspace' },
  { id: 'protocols', path: '/visual-lock/protocols' },
  { id: 'reports', path: '/visual-lock/reports' },
  { id: 'settings', path: '/visual-lock/settings' },
]

/** Per-pixel AA tolerance. Material layout/font/icon changes still fail. */
export const PIXELMATCH_THRESHOLD = 0.1

/**
 * Max differing pixels as a fraction of the screenshot.
 * 0.15% at 1440×900 ≈ 1,944 px — enough for antialiasing, far below a Times/12.25px/missing-icon regression.
 */
export const MAX_DIFF_RATIO = 0.0015

export const APPROVED_BODY_FONT_SIZE = '14px'
export const APPROVED_SIDEBAR_WIDTH = 80
export const APPROVED_HEADER_HEIGHT = 72
export const SIDEBAR_WIDTH_TOLERANCE_PX = 1
export const HEADER_HEIGHT_TOLERANCE_PX = 1
