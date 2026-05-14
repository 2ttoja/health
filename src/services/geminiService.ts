/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { HealthData, HealthMetricConfig, AnalysisResult, HEALTH_METRICS } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const modelName = "gemini-3-flash-preview";

export async function extractHealthDataFromImages(images: { data: string; mimeType: string }[]): Promise<Partial<HealthData>> {
  if (images.length === 0) return {};

  const prompt = `
    You are an expert at extracting health data from iPhone Health app screenshots.
    Look at the provided images and extract the values for the following health metrics:
    ${HEALTH_METRICS.map(m => `- ${m.label} (${m.unit})`).join('\n')}

    Rules:
    1. Only extract values you are certain about.
    2. If a value is not found or unclear, do not guess. Leave it out of the JSON.
    3. If multiple images contain the same metric, use the most clear or recent value.
    4. Return ONLY a JSON object where keys match the internal keys provided below.
    5. Internal keys mapping:
    ${HEALTH_METRICS.map(m => `- ${m.label}: ${m.key}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          ...images.map(img => ({
            inlineData: {
              data: img.data,
              mimeType: img.mimeType,
            },
          })),
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: HEALTH_METRICS.reduce((acc, m) => {
            acc[m.key] = { type: Type.STRING };
            return acc;
          }, {} as any),
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("OCR Error:", error);
    return {};
  }
}

export async function analyzeHealthData(data: HealthData): Promise<AnalysisResult> {
  const inputDataStr = HEALTH_METRICS.map(m => {
    const val = data[m.key];
    return `${m.label}: ${val ? `${val} ${m.unit}` : '데이터 없음'}`;
  }).join('\n');

  const prompt = `
    당신은 전문 건강 관리 코치입니다. 다음 데이터를 바탕으로 사용자의 오늘의 건강 상태를 분석해주세요.

    입력 데이터:
    ${inputDataStr}

    요구사항:
    1. 요약: 전체적인 건강 상태를 3~5문장으로 요약합니다.
    2. 항목별 분석: 입력된 각 항목에 대해 상태 평가(good/normal/caution/no_data)와 코멘트를 제공합니다. 데이터가 없는 항목은 반드시 'no_data'로 표시하세요.
    3. 개선 조언: 구체적이고 실천 가능한 조언 5개 이내.
    4. 주의사항: 수치가 이상하거나 주의가 필요한 경우에 대해 안내합니다.
    5. 어조: 친절하고 전문적인 말투를 사용하세요. 진단보다는 생활 개선 위주로 설명하세요.
    6. 필수 문구: 마지막에 "의료 진단이 아닌 생활 건강 참고용입니다."를 포함하세요 (주의사항 섹션에).

    반드시 다음 JSON 구조로 응답하세요.
    {
      "summary": "...",
      "itemized": [
        { "label": "항목명", "value": "입력값+단위", "status": "good|normal|caution|no_data", "comment": "..." }
      ],
      "advice": ["...", "..."],
      "precautions": ["...", "..."]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            itemized: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["good", "normal", "caution", "no_data"] },
                  comment: { type: Type.STRING },
                },
                required: ["label", "value", "status", "comment"],
              },
            },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "itemized", "advice", "precautions"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("건강 데이터를 분석하는 중 오류가 발생했습니다.");
  }
}
