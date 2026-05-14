/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthData {
  absoluteIntensity: string; // MET
  walkingRunningDistance: string; // km
  steps: string; // 걸음
  walkingStepLength: string; // cm
  walkingSpeed: string; // KPH
  doubleSupportTime: string; // %
  activityMove: string; // kcal
  activityExercise: string; // 분
  activityStand: string; // 시간
  activeEnergy: string; // kcal
  restingEnergy: string; // kcal
  heartRate: string; // BPM
  heartRateVariability: string; // ms
  bloodOxygen: string; // %
  walkingHeartRateAverage: string; // BPM
  walkingAsymmetry: string; // %
}

export const INITIAL_HEALTH_DATA: HealthData = {
  absoluteIntensity: '',
  walkingRunningDistance: '',
  steps: '',
  walkingStepLength: '',
  walkingSpeed: '',
  doubleSupportTime: '',
  activityMove: '',
  activityExercise: '',
  activityStand: '',
  activeEnergy: '',
  restingEnergy: '',
  heartRate: '',
  heartRateVariability: '',
  bloodOxygen: '',
  walkingHeartRateAverage: '',
  walkingAsymmetry: '',
};

export interface HealthMetricConfig {
  key: keyof HealthData;
  label: string;
  unit: string;
}

export const HEALTH_METRICS: HealthMetricConfig[] = [
  { key: 'absoluteIntensity', label: '절대적 운동 강도', unit: 'MET' },
  { key: 'walkingRunningDistance', label: '걷기 + 달리기 거리', unit: 'km' },
  { key: 'steps', label: '걸음', unit: '걸음' },
  { key: 'walkingStepLength', label: '보행보폭', unit: 'cm' },
  { key: 'walkingSpeed', label: '보행속도', unit: 'KPH' },
  { key: 'doubleSupportTime', label: '이중지지시간', unit: '%' },
  { key: 'activityMove', label: '활동 - 움직이기', unit: 'kcal' },
  { key: 'activityExercise', label: '활동 - 운동하기', unit: '분' },
  { key: 'activityStand', label: '활동 - 일어서기', unit: '시간' },
  { key: 'activeEnergy', label: '활동에너지', unit: 'kcal' },
  { key: 'restingEnergy', label: '휴식에너지', unit: 'kcal' },
  { key: 'heartRate', label: '심박수', unit: 'BPM' },
  { key: 'heartRateVariability', label: '심박변이', unit: '밀리초' },
  { key: 'bloodOxygen', label: '혈중산소', unit: '%' },
  { key: 'walkingHeartRateAverage', label: '걷기 심박수 평균', unit: 'BPM' },
  { key: 'walkingAsymmetry', label: '보행 비대칭성', unit: '%' },
];

export interface AnalysisResult {
  summary: string;
  itemized: {
    label: string;
    value: string;
    status: 'good' | 'normal' | 'caution' | 'no_data';
    comment: string;
  }[];
  advice: string[];
  precautions: string[];
}
