/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Upload, 
  RefreshCcw, 
  ChevronRight, 
  BrainCircuit, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  X,
  FileImage,
  Loader2,
  Heart,
  Zap,
  TrendingUp,
  Stethoscope,
  Printer,
  Globe
} from 'lucide-react';
import { HealthData, INITIAL_HEALTH_DATA, HEALTH_METRICS, AnalysisResult } from './types';
import { extractHealthDataFromImages, analyzeHealthData } from './services/geminiService';

const TRANSLATIONS = {
  ko: {
    appTitle: '오늘의 건강관리 코치',
    appDesc: '아이폰 건강 데이터를 기반으로 한 맞춤형 일일 피드백',
    healthDataInput: '데이터 입력',
    metricCount: '16개 항목',
    uploadBtn: '아이폰 건강 앱 캡처 화면 업로드',
    ocrBtn: '추출하기',
    ocrBadge: 'OCR 자동 인식 가능',
    analyzeBtn: '오늘의 건강 상태 분석하기',
    resetBtn: '초기화',
    reportTitle: '분석 리포트',
    ready: '준비됨',
    complete: '분석 완료',
    placeholder: '데이터를 입력하고 분석 버튼을 눌러주세요',
    analyzing: '심층 분석 보고서를 작성하고 있습니다...',
    summaryHeader: 'A. 요약',
    itemizedHeader: 'B. 항목별 분석',
    adviceHeader: 'C. 개선 조언',
    precautionsHeader: 'D. 주의사항',
    statusGood: '좋음',
    statusNormal: '보통',
    statusCaution: '주의',
    statusNoData: '데이터 없음',
    footerNotice: '입력한 건강 데이터와 업로드 이미지는 저장되지 않으며 분석 후 즉시 소멸됩니다.',
    medicalDisclaimer: '의료 진단이 아닌 생활 건강 참고용입니다.',
    printBtn: '인쇄 / PDF 저장',
  },
  en: {
    appTitle: 'Daily Health Coach',
    appDesc: 'Personalized daily feedback based on your iPhone Health data',
    healthDataInput: 'Health Data Input',
    metricCount: '16 Metrics',
    uploadBtn: 'Upload iPhone Health App Screenshots',
    ocrBtn: 'Extract Data',
    ocrBadge: 'OCR auto-detection available',
    analyzeBtn: 'Analyze Today’s Health',
    resetBtn: 'Reset',
    reportTitle: 'Analysis Report',
    ready: 'Ready',
    complete: 'Analysis Complete',
    placeholder: 'Enter your data and tap the analysis button',
    analyzing: 'Creating your in-depth health report...',
    summaryHeader: 'A. Summary',
    itemizedHeader: 'B. Itemized Analysis',
    adviceHeader: 'C. Improvement Advice',
    precautionsHeader: 'D. Precautions',
    statusGood: 'Good',
    statusNormal: 'Normal',
    statusCaution: 'Caution',
    statusNoData: 'No Data',
    footerNotice: 'Your health data and uploaded images are not stored and are discarded after analysis.',
    medicalDisclaimer: 'This is for general wellness reference only and is not a medical diagnosis.',
    printBtn: 'Print / Save PDF',
  }
};

const ENGLISH_LABELS: Record<string, string> = {
  absoluteIntensity: 'Absolute Exercise Intensity',
  walkingRunningDistance: 'Walking + Running Distance',
  steps: 'Steps',
  walkingStepLength: 'Walking Step Length',
  walkingSpeed: 'Walking Speed',
  doubleSupportTime: 'Double Support Time',
  activityMove: 'Activity - Move',
  activityExercise: 'Activity - Exercise',
  activityStand: 'Activity - Stand',
  activeEnergy: 'Active Energy',
  restingEnergy: 'Resting Energy',
  heartRate: 'Heart Rate',
  heartRateVariability: 'Heart Rate Variability',
  bloodOxygen: 'Blood Oxygen',
  walkingHeartRateAverage: 'Walking Heart Rate Average',
  walkingAsymmetry: 'Walking Asymmetry',
};

export default function App() {
  const [formData, setFormData] = useState<HealthData>(INITIAL_HEALTH_DATA);
  const [images, setImages] = useState<{ id: string; data: string; mimeType: string; preview: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  const handleInputChange = (key: keyof HealthData, value: string) => {
    // Only allow numbers and decimal point
    if (value !== '' && !/^-?(\d+\.?\d*|\.\d+)$/.test(value)) return;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const preview = event.target?.result as string;
        setImages(prev => [...prev, { 
          id: Math.random().toString(36).substr(2, 9), 
          data: base64, 
          mimeType: file.type, 
          preview 
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const triggerOCR = async () => {
    if (images.length === 0) return;
    setIsExtracting(true);
    setError(null);
    try {
      const extractedData = await extractHealthDataFromImages(images);
      setFormData(prev => ({ ...prev, ...extractedData }));
      // Highlight that it's done
    } catch (err) {
      setError(language === 'ko' ? '이미지에서 데이터를 추출하는데 실패했습니다.' : 'Failed to extract data from images.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_HEALTH_DATA);
    setImages([]);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const analysis = await analyzeHealthData(formData, language);
      setResult(analysis);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko' ? '분석 중 오류가 발생했습니다.' : 'An error occurred during analysis.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ko' ? 'en' : 'ko');
  };

  return (
    <div className="h-screen flex flex-col p-4 bg-slate-50 overflow-hidden print:overflow-visible print:h-auto print:bg-white print:p-0">
      {/* Header */}
      <header className="flex-none flex justify-between items-end mb-4 px-2 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">H</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.appTitle}</h1>
          </div>
          <p className="text-sm text-slate-500 italic">{t.appDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Medical Disclaimer</p>
            <p className="text-xs text-amber-600 font-medium">{t.medicalDisclaimer}</p>
          </div>
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Globe size={14} className="text-emerald-500" />
            {language === 'ko' ? 'English' : '한국어'}
          </button>
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors md:hidden"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      {/* Print-only title */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">{t.appTitle} - {t.reportTitle}</h1>
        <p className="text-sm text-slate-500 mt-2">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
      </div>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden print:block print:overflow-visible">
        {/* Left Column: Data Input */}
        <section className="md:col-span-5 flex flex-col gap-3 overflow-hidden no-print">
          <div className="card-container flex-1">
            <div className="card-header">
              <h2 className="font-bold text-xs text-slate-700 flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                {t.healthDataInput}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleReset}
                  className="p-1 px-2 text-[10px] font-bold bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCcw size={10} /> {t.resetBtn}
                </button>
                <span className="text-[10px] text-slate-400">{t.metricCount}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-x-3 gap-y-3">
              {HEALTH_METRICS.map((metric) => (
                <div key={metric.key} className="input-field-group">
                  <label className="input-label">
                    {language === 'ko' ? metric.label : ENGLISH_LABELS[metric.key]}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData[metric.key]}
                      onChange={(e) => handleInputChange(metric.key, e.target.value)}
                      placeholder="-"
                      className="input-base"
                    />
                    <span className="input-unit">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || Object.values(formData).every(v => v === '')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
              {t.analyzeBtn}
            </button>
          </div>
        </section>

        {/* Right Column: Upload & Results */}
        <section className="md:col-span-7 flex flex-col gap-4 overflow-hidden print:block print:w-full print:overflow-visible">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="card-container h-24 p-4 border-dashed border-2 border-emerald-200 bg-emerald-50 cursor-pointer hover:bg-emerald-100/50 transition-colors flex-none items-center justify-center text-center no-print"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            <Upload size={24} className="text-emerald-500 mb-1" />
            <span className="text-sm font-semibold text-emerald-700">{t.uploadBtn}</span>
            <span className="text-[10px] text-emerald-600/70 uppercase tracking-tighter">{t.ocrBadge}</span>
          </div>

          {/* Image Previews & Recognition Button */}
          {images.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto p-1 bg-slate-100/50 rounded-lg flex-none h-16 no-print">
              {images.map((img) => (
                <div key={img.id} className="relative group w-10 h-10 rounded border border-slate-200 bg-white shrink-0">
                  <img src={img.preview} alt="Preview" className="w-full h-full object-cover rounded" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
              <div className="ml-auto pr-2">
                <button 
                  onClick={triggerOCR}
                  disabled={isExtracting}
                  className="py-1 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                >
                  {isExtracting ? <Loader2 size={10} className="animate-spin" /> : <BrainCircuit size={10} />}
                  {t.ocrBtn}
                </button>
              </div>
            </div>
          )}

          {/* Result Card */}
          <div className="card-container flex-1 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
            <div className="card-header bg-white no-print">
              <h2 className="font-bold text-xs text-slate-700 flex items-center gap-2">
                <Stethoscope size={14} className="text-sky-500" />
                {t.reportTitle}
              </h2>
              <div className="flex items-center gap-2">
                {result && (
                  <button 
                    onClick={handlePrint}
                    className="p-1 px-2 text-[10px] font-bold bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Printer size={12} /> {t.printBtn}
                  </button>
                )}
                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] rounded-full font-bold uppercase tracking-tighter">
                  {result ? t.complete : t.ready}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 print:overflow-visible print:p-0">
              {!result && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-10 opacity-60 no-print">
                  <TrendingUp size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">{t.placeholder}</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20 no-print">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                  <p className="text-sm font-medium animate-pulse">{t.analyzing}</p>
                </div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 print:space-y-8"
                >
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300">
                    <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest print:text-slate-600">{t.summaryHeader}</h3>
                    <p className="text-sm leading-relaxed text-slate-700 font-medium tracking-tight">
                      {result.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:block print:space-y-8">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-slate-600">{t.itemizedHeader}</h3>
                      <div className="grid grid-cols-1 gap-1.5 print:grid-cols-2">
                        {result.itemized.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-white border border-slate-100 rounded group relative print:border-slate-300 print:break-inside-avoid">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-500 font-bold">{item.label}</span>
                                <span className={`font-black ${
                                  item.status === 'good' ? 'text-emerald-600' :
                                  item.status === 'normal' ? 'text-blue-600' :
                                  item.status === 'caution' ? 'text-amber-500' : 'text-slate-300'
                                }`}>
                                  {item.status === 'good' ? t.statusGood : 
                                   item.status === 'normal' ? t.statusNormal : 
                                   item.status === 'caution' ? t.statusCaution : t.statusNoData}
                                </span>
                              </div>
                              <div className="text-slate-900 font-bold text-xs mb-0.5">{item.value || '-'}</div>
                              <p className="text-[9px] text-slate-400 leading-tight">{item.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3 print:pt-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-slate-600">{t.adviceHeader}</h3>
                      <div className="bg-white border border-slate-100 rounded p-3 print:border-slate-300">
                        <ul className="text-[11px] text-slate-600 space-y-2">
                          {result.advice.map((adv, i) => (
                            <li key={i} className="flex gap-2 print:break-inside-avoid">
                              <span className="text-emerald-500 font-bold shrink-0">•</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 print:border-slate-300">
                    <h3 className="text-[10px] font-bold text-rose-400 mb-2 uppercase tracking-widest">{t.precautionsHeader}</h3>
                    <div className="text-[11px] text-slate-500 bg-rose-50 p-3 rounded border border-rose-100 space-y-2 print:bg-white print:border-rose-200">
                      <ul className="space-y-1">
                        {result.precautions.map((p, i) => (
                          <li key={i} className="flex gap-2 print:break-inside-avoid">
                            <span className="text-rose-300 shrink-0">!</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-rose-100 mt-2">
                        <p className="text-[9px] font-bold text-rose-600 uppercase italic">
                          {t.medicalDisclaimer}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center no-print">
              <p className="text-[9px] text-slate-400 font-medium">
                {t.footerNotice}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex-none mt-2 text-center pb-1 text-[10px] text-slate-400 flex justify-center items-center gap-4 no-print">
        <span>© 2024 {t.appTitle}</span>
        <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
        <span>{t.medicalDisclaimer}</span>
      </footer>
    </div>
  );
}
