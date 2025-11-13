// WHO Growth Standards Reference Data and Z-score Calculation
// Based on WHO Child Growth Standards (2006)

export interface WHOReference {
  age_months: number
  gender: 'L' | 'P'
  weight_for_age: {
    L: number // Box-Cox transformation power
    M: number // Median
    S: number // Coefficient of variation
  }
  height_for_age: {
    L: number
    M: number
    S: number
  }
  bmi_for_age: {
    L: number
    M: number
    S: number
  }
}

// Simplified WHO reference data for key ages (in production, use complete WHO tables)
const WHO_REFERENCE_DATA: WHOReference[] = [
  // Boys (L) - sample data for key ages
  { age_months: 0, gender: 'L', weight_for_age: { L: 1.0, M: 3.5, S: 0.15 }, height_for_age: { L: 1.0, M: 50.0, S: 0.03 }, bmi_for_age: { L: 1.0, M: 13.4, S: 0.09 } },
  { age_months: 1, gender: 'L', weight_for_age: { L: 1.0, M: 4.5, S: 0.14 }, height_for_age: { L: 1.0, M: 54.7, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.0, S: 0.08 } },
  { age_months: 2, gender: 'L', weight_for_age: { L: 1.0, M: 5.6, S: 0.14 }, height_for_age: { L: 1.0, M: 58.4, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.4, S: 0.08 } },
  { age_months: 3, gender: 'L', weight_for_age: { L: 1.0, M: 6.4, S: 0.14 }, height_for_age: { L: 1.0, M: 61.4, S: 0.03 }, bmi_for_age: { L: 1.0, M: 17.0, S: 0.08 } },
  { age_months: 6, gender: 'L', weight_for_age: { L: 1.0, M: 7.8, S: 0.14 }, height_for_age: { L: 1.0, M: 67.6, S: 0.03 }, bmi_for_age: { L: 1.0, M: 17.1, S: 0.08 } },
  { age_months: 12, gender: 'L', weight_for_age: { L: 1.0, M: 9.6, S: 0.15 }, height_for_age: { L: 1.0, M: 75.7, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.8, S: 0.08 } },
  { age_months: 24, gender: 'L', weight_for_age: { L: 1.0, M: 12.2, S: 0.16 }, height_for_age: { L: 1.0, M: 87.1, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.1, S: 0.08 } },
  { age_months: 36, gender: 'L', weight_for_age: { L: 1.0, M: 14.3, S: 0.17 }, height_for_age: { L: 1.0, M: 96.1, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.5, S: 0.08 } },
  { age_months: 48, gender: 'L', weight_for_age: { L: 1.0, M: 16.4, S: 0.18 }, height_for_age: { L: 1.0, M: 103.4, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.3, S: 0.08 } },
  { age_months: 60, gender: 'L', weight_for_age: { L: 1.0, M: 18.3, S: 0.19 }, height_for_age: { L: 1.0, M: 109.8, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.2, S: 0.08 } },

  // Girls (P) - sample data for key ages
  { age_months: 0, gender: 'P', weight_for_age: { L: 1.0, M: 3.3, S: 0.15 }, height_for_age: { L: 1.0, M: 49.1, S: 0.03 }, bmi_for_age: { L: 1.0, M: 13.7, S: 0.09 } },
  { age_months: 1, gender: 'P', weight_for_age: { L: 1.0, M: 4.2, S: 0.14 }, height_for_age: { L: 1.0, M: 53.7, S: 0.03 }, bmi_for_age: { L: 1.0, M: 14.6, S: 0.08 } },
  { age_months: 2, gender: 'P', weight_for_age: { L: 1.0, M: 5.1, S: 0.14 }, height_for_age: { L: 1.0, M: 57.1, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.7, S: 0.08 } },
  { age_months: 3, gender: 'P', weight_for_age: { L: 1.0, M: 5.8, S: 0.14 }, height_for_age: { L: 1.0, M: 59.8, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.2, S: 0.08 } },
  { age_months: 6, gender: 'P', weight_for_age: { L: 1.0, M: 7.1, S: 0.14 }, height_for_age: { L: 1.0, M: 65.7, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.5, S: 0.08 } },
  { age_months: 12, gender: 'P', weight_for_age: { L: 1.0, M: 8.9, S: 0.15 }, height_for_age: { L: 1.0, M: 74.0, S: 0.03 }, bmi_for_age: { L: 1.0, M: 16.3, S: 0.08 } },
  { age_months: 24, gender: 'P', weight_for_age: { L: 1.0, M: 11.5, S: 0.16 }, height_for_age: { L: 1.0, M: 86.4, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.4, S: 0.08 } },
  { age_months: 36, gender: 'P', weight_for_age: { L: 1.0, M: 13.5, S: 0.17 }, height_for_age: { L: 1.0, M: 95.0, S: 0.03 }, bmi_for_age: { L: 1.0, M: 15.0, S: 0.08 } },
  { age_months: 48, gender: 'P', weight_for_age: { L: 1.0, M: 15.4, S: 0.18 }, height_for_age: { L: 1.0, M: 102.5, S: 0.03 }, bmi_for_age: { L: 1.0, M: 14.7, S: 0.08 } },
  { age_months: 60, gender: 'P', weight_for_age: { L: 1.0, M: 17.5, S: 0.19 }, height_for_age: { L: 1.0, M: 108.9, S: 0.03 }, bmi_for_age: { L: 1.0, M: 14.8, S: 0.08 } },
]

export interface ZScoreResult {
  z_wfa: number // Weight-for-Age Z-score
  z_hfa: number // Height-for-Age Z-score
  z_bfa: number // BMI-for-Age Z-score
  wfa_status: 'SEVERE_UNDERWEIGHT' | 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE'
  hfa_status: 'SEVERELY_STUNTED' | 'STUNTED' | 'NORMAL' | 'TALL'
  bfa_status: 'SEVERELY_WASTED' | 'WASTED' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE'
}

export function calculateZScores(
  age_months: number,
  weight_kg: number,
  height_cm: number,
  gender: 'L' | 'P'
): ZScoreResult | null {
  if (age_months < 0 || age_months > 60 || weight_kg <= 0 || height_cm <= 0) {
    return null
  }

  // Find closest reference data (interpolate between available points)
  const reference = findClosestReference(age_months, gender)
  if (!reference) return null

  // Calculate Z-scores using WHO LMS method
  const z_wfa = calculateLMSZScore(weight_kg, reference.weight_for_age)
  const z_hfa = calculateLMSZScore(height_cm, reference.height_for_age)
  const bmi = weight_kg / Math.pow(height_cm / 100, 2)
  const z_bfa = calculateLMSZScore(bmi, reference.bmi_for_age)

  // Determine status based on WHO thresholds
  const wfa_status = getWeightForAgeStatus(z_wfa)
  const hfa_status = getHeightForAgeStatus(z_hfa)
  const bfa_status = getBMIForAgeStatus(z_bfa)

  return {
    z_wfa: Math.round(z_wfa * 100) / 100,
    z_hfa: Math.round(z_hfa * 100) / 100,
    z_bfa: Math.round(z_bfa * 100) / 100,
    wfa_status,
    hfa_status,
    bfa_status
  }
}

function findClosestReference(age_months: number, gender: 'L' | 'P'): WHOReference | null {
  const genderData = WHO_REFERENCE_DATA.filter(ref => ref.gender === gender)

  // Find exact match or closest
  let closest = genderData[0]
  let minDiff = Math.abs(age_months - closest.age_months)

  for (const ref of genderData) {
    const diff = Math.abs(age_months - ref.age_months)
    if (diff < minDiff) {
      minDiff = diff
      closest = ref
    }
  }

  return closest
}

function calculateLMSZScore(measurement: number, reference: { L: number; M: number; S: number }): number {
  const { L, M, S } = reference

  if (L === 0) {
    // Simplified calculation when L = 0
    return Math.log(measurement / M) / Math.log(S)
  } else {
    // Standard LMS method
    return ((measurement / M) ** L - 1) / (L * S)
  }
}

function getWeightForAgeStatus(z_score: number): ZScoreResult['wfa_status'] {
  if (z_score < -3) return 'SEVERE_UNDERWEIGHT'
  if (z_score < -2) return 'UNDERWEIGHT'
  if (z_score > 2) return 'OVERWEIGHT'
  if (z_score > 3) return 'OBESE'
  return 'NORMAL'
}

function getHeightForAgeStatus(z_score: number): ZScoreResult['hfa_status'] {
  if (z_score < -3) return 'SEVERELY_STUNTED'
  if (z_score < -2) return 'STUNTED'
  if (z_score > 2) return 'TALL'
  return 'NORMAL'
}

function getBMIForAgeStatus(z_score: number): ZScoreResult['bfa_status'] {
  if (z_score < -3) return 'SEVERELY_WASTED'
  if (z_score < -2) return 'WASTED'
  if (z_score > 2) return 'OVERWEIGHT'
  if (z_score > 3) return 'OBESE'
  return 'NORMAL'
}

// Validation thresholds based on analyze.md
export const VALIDATION_THRESHOLDS = {
  // Absolute biological plausibility limits (0-5 years)
  MIN_HEIGHT_CM: 40,
  MAX_HEIGHT_CM: 130,
  MIN_WEIGHT_KG: 2,
  MAX_WEIGHT_KG: 30,

  // Technical outlier detection
  MAX_Z_SCORE: 4,
  MIN_Z_SCORE: -4,

  // Extreme jumps (month-to-month changes)
  MAX_HEIGHT_INCREASE_CM_PER_MONTH: 3.5,
  MAX_WEIGHT_INCREASE_KG_PER_MONTH: 2.5,

  // Weight change thresholds
  WEIGHT_WARNING_THRESHOLD_PERCENT: -3, // -3% decrease
  WEIGHT_ERROR_THRESHOLD_PERCENT: -7,   // -7% decrease
  WEIGHT_ERROR_THRESHOLD_KG: -1.0,      // -1.0 kg decrease

  // Age gap for missing months
  MAX_MONTH_GAP: 1,
} as const

export type ValidationStatus = 'OK' | 'WARNING' | 'ERROR' | 'MISSING'

export interface ValidationResult {
  status: ValidationStatus
  flags: string[]
  z_scores?: ZScoreResult
  technical_notes?: string[]
}

export function validateMeasurement(
  current: { age_months: number; weight_kg: number; height_cm: number; date: Date },
  previous: { age_months: number; weight_kg: number; height_cm: number; date: Date } | undefined,
  gender: 'L' | 'P'
): ValidationResult {
  const flags: string[] = []
  const technical_notes: string[] = []
  let status: ValidationStatus = 'OK'

  // 1. Hard Error checks (highest priority)

  // Absolute biological limits
  if (current.height_cm < VALIDATION_THRESHOLDS.MIN_HEIGHT_CM ||
      current.height_cm > VALIDATION_THRESHOLDS.MAX_HEIGHT_CM) {
    status = 'ERROR'
    flags.push(`Nilai tidak masuk akal: tinggi ${current.height_cm}cm (di luar rentang ${VALIDATION_THRESHOLDS.MIN_HEIGHT_CM}-${VALIDATION_THRESHOLDS.MAX_HEIGHT_CM}cm)`)
  }

  if (current.weight_kg < VALIDATION_THRESHOLDS.MIN_WEIGHT_KG ||
      current.weight_kg > VALIDATION_THRESHOLDS.MAX_WEIGHT_KG) {
    if (status !== 'ERROR') status = 'ERROR'
    flags.push(`Nilai tidak masuk akal: berat ${current.weight_kg}kg (di luar rentang ${VALIDATION_THRESHOLDS.MIN_WEIGHT_KG}-${VALIDATION_THRESHOLDS.MAX_WEIGHT_KG}kg)`)
  }

  // Height monotonicity (should never decrease)
  if (previous && current.height_cm < previous.height_cm) {
    const decrease = previous.height_cm - current.height_cm
    if (status !== 'ERROR') status = 'ERROR'
    flags.push(`Tinggi menurun: ${previous.height_cm}cm → ${current.height_cm}cm (penurunan ${decrease.toFixed(1)}cm)`)
  }

  // Calculate Z-scores
  const z_scores = calculateZScores(current.age_months, current.weight_kg, current.height_cm, gender)

  if (z_scores) {
    // Technical Z-score limits (|z| > 4)
    if (Math.abs(z_scores.z_wfa) > VALIDATION_THRESHOLDS.MAX_Z_SCORE) {
      if (status !== 'ERROR') status = 'ERROR'
      flags.push(`Z-score di luar batas teknis: WFA = ${z_scores.z_wfa}`)
    }

    if (Math.abs(z_scores.z_hfa) > VALIDATION_THRESHOLDS.MAX_Z_SCORE) {
      if (status !== 'ERROR') status = 'ERROR'
      flags.push(`Z-score di luar batas teknis: HFA = ${z_scores.z_hfa}`)
    }

    // WHO thresholds (|z| > 3 = Error)
    if (Math.abs(z_scores.z_wfa) > 3 || Math.abs(z_scores.z_hfa) > 3) {
      if (status !== 'ERROR') status = 'ERROR'
      flags.push(`Z-score di luar ±3: WFA=${z_scores.z_wfa}, HFA=${z_scores.z_hfa}`)
    }
  }

  // 2. Warning checks (if no errors found)
  if (status !== 'ERROR') {
    // Extreme jumps
    if (previous) {
      const age_gap_months = current.age_months - previous.age_months
      if (age_gap_months > 0 && age_gap_months <= 2) { // Only check for reasonable age gaps
        const height_increase = current.height_cm - previous.height_cm
        const weight_increase = current.weight_kg - previous.weight_kg
        const height_increase_per_month = height_increase / age_gap_months
        const weight_increase_per_month = weight_increase / age_gap_months

        if (height_increase_per_month > VALIDATION_THRESHOLDS.MAX_HEIGHT_INCREASE_CM_PER_MONTH) {
          status = 'WARNING'
          flags.push(`Lonjakan tinggi ekstrem: ${height_increase.toFixed(1)}cm dalam ${age_gap_months} bulan (${height_increase_per_month.toFixed(1)}cm/bulan)`)
        }

        if (weight_increase_per_month > VALIDATION_THRESHOLDS.MAX_WEIGHT_INCREASE_KG_PER_MONTH) {
          if (status !== 'WARNING') status = 'WARNING'
          flags.push(`Lonjakan berat ekstrem: ${weight_increase.toFixed(1)}kg dalam ${age_gap_months} bulan (${weight_increase_per_month.toFixed(1)}kg/bulan)`)
        }

        // Weight decrease thresholds
        const weight_change_percent = (weight_increase / previous.weight_kg) * 100

        if (weight_change_percent <= VALIDATION_THRESHOLDS.WEIGHT_ERROR_THRESHOLD_PERCENT ||
            weight_increase <= VALIDATION_THRESHOLDS.WEIGHT_ERROR_THRESHOLD_KG) {
          status = 'WARNING'
          flags.push(`Penurunan berat signifikan: ${previous.weight_kg}kg → ${current.weight_kg}kg (${weight_change_percent.toFixed(1)}%)`)
        } else if (weight_change_percent <= VALIDATION_THRESHOLDS.WEIGHT_WARNING_THRESHOLD_PERCENT) {
          if (status !== 'WARNING') status = 'WARNING'
          flags.push(`Penurunan berat moderat: ${previous.weight_kg}kg → ${current.weight_kg}kg (${weight_change_percent.toFixed(1)}%)`)
        }
      }
    }

    // WHO warning thresholds (2 < |z| ≤ 3)
    if (z_scores) {
      if (Math.abs(z_scores.z_wfa) > 2 && Math.abs(z_scores.z_wfa) <= 3) {
        if (status !== 'WARNING') status = 'WARNING'
        flags.push(`Berat tidak ideal: WFA = ${z_scores.z_wfa}`)
      }

      if (Math.abs(z_scores.z_hfa) > 2 && Math.abs(z_scores.z_hfa) <= 3) {
        if (status !== 'WARNING') status = 'WARNING'
        flags.push(`Tinggi tidak ideal: HFA = ${z_scores.z_hfa}`)
      }
    }
  }

  return {
    status,
    flags,
    z_scores,
    technical_notes: technical_notes.length > 0 ? technical_notes : undefined
  }
}