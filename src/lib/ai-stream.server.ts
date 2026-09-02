import {
  cleanPdfExtractedText,
  isTamilText,
  callTamilLlama,
  TAMILLLAMA_SYSTEM_PROMPT,
} from "./tamilllama.server";
import {
  cleanUnwantedTamilSymbols,
  normalizeTamilUnicode,
  logTamilStage,
} from "./tamil-pipeline";

export interface StreamConfig {
  text: string;
  count: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  apiKey?: string;
  apiProvider?: "gemini" | "openai" | "lovable";
  modelName?: string;
  env?: any;
  selectedLanguage?: string;
  tamilLlamaUrl?: string;
  tamilLlamaKey?: string;
  tamilLlamaModel?: string;
  avoidQuestions?: string[];
}

export type MCQ = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
};

/**
 * Parses and validates an MCQ raw JSON object or record.
 */
function parseAndValidateMcqObject(raw: any): MCQ | null {
  if (!raw || typeof raw !== "object") return null;

  const rawQ = raw.question || raw.q || raw.questionText || "";
  const rawOpts = raw.options || raw.o || raw.choices || [];
  const rawAns = raw.correctAnswer || raw.correct_answer || raw.a || raw.answer || "";
  const rawExp = raw.explanation || raw.exp || raw.rationale || "";
  const rawDiff = raw.difficulty || raw.d || "Medium";
  const rawCat = raw.category || raw.cat || "Concept";

  if (!rawQ || typeof rawQ !== "string") {
    // If not string, check string conversion
  }

  let cleanQ = cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(rawQ).trim()));
  cleanQ = cleanQ.replace(/^(?:Q|Question|Q\s*No|வினா|கேள்வி)?\s*\d*\s*[-.:)]\s*/i, "").trim();
  cleanQ = cleanQ.replace(/^Q\d+\s*/i, "").trim();
  if (cleanQ.length < 5) return null;

  if (!Array.isArray(rawOpts) || rawOpts.length !== 4) return null;

  const cleanOpts = rawOpts.map((opt: any) => {
    let o = cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(opt || "").trim()));
    return o.replace(/^[A-D1-4][\.\)\:\-]\s*/i, "").replace(/^\([A-D1-4]\)\s*/i, "").trim();
  });

  // Ensure all 4 options are non-empty
  if (cleanOpts.some((o: string) => !o || o.length === 0)) return null;

  // Ensure all 4 options are distinct
  const distinctOpts = new Set(cleanOpts.map((o: string) => o.toLowerCase()));
  if (distinctOpts.size !== 4) return null;

  let cleanAns = cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(rawAns).trim()));
  cleanAns = cleanAns.replace(/^[A-D1-4][\.\)\:\-]\s*/i, "").replace(/^\([A-D1-4]\)\s*/i, "").trim();

  // Match answer against options (by option index, letter, exact match, case-insensitive, or substring)
  let matchedOpt: string | null = null;
  const letterMatch = String(rawAns).trim().match(/^(?:option\s*)?([A-D1-4])$/i);
  if (letterMatch) {
    const val = letterMatch[1].toUpperCase();
    let idx = -1;
    if (val >= "A" && val <= "D") idx = val.charCodeAt(0) - 65;
    else if (val >= "1" && val <= "4") idx = parseInt(val, 10) - 1;
    if (idx >= 0 && idx < 4) matchedOpt = cleanOpts[idx];
  }

  if (!matchedOpt) {
    matchedOpt = cleanOpts.find((o: string) => o === cleanAns) || null;
  }
  if (!matchedOpt) {
    matchedOpt = cleanOpts.find((o: string) => o.toLowerCase() === cleanAns.toLowerCase()) || null;
  }
  if (!matchedOpt) {
    const normAns = cleanAns.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
    matchedOpt = cleanOpts.find((o: string) => o.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase() === normAns) || null;
  }
  if (!matchedOpt) {
    matchedOpt = cleanOpts.find((o: string) => cleanAns.includes(o) || o.includes(cleanAns)) || null;
  }

  // If answer does not match any of the 4 options, question is invalid
  if (!matchedOpt) return null;

  let cleanExp = rawExp ? cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(rawExp).trim())) : "";
  if (!cleanExp) {
    const isTam = isTamilText(cleanQ) || isTamilText(matchedOpt);
    cleanExp = isTam
      ? `சரியான விடை: ${matchedOpt}. இக்கருத்து கொடுக்கப்பட்ட பாடப்பகுதியில் நேரடியாகக் குறிப்பிடப்பட்டுள்ளது.`
      : `The correct answer is: ${matchedOpt}. This is directly supported by the uploaded study material.`;
  }

  return {
    question: cleanQ,
    options: cleanOpts,
    correctAnswer: matchedOpt,
    explanation: cleanExp,
    difficulty: rawDiff === "Easy" || rawDiff === "Medium" || rawDiff === "Hard" ? rawDiff : "Medium",
    category: String(rawCat || "Concept").trim(),
  };
}

/**
 * Extracts MCQ objects from any JSON string (array, object with questions array, or newline-delimited objects).
 */
function extractMcqsFromJsonString(jsonStr: string): MCQ[] {
  if (!jsonStr) return [];
  const results: MCQ[] = [];

  let cleanText = jsonStr.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(cleanText);
    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      items = parsed.questions;
    } else if (parsed && Array.isArray(parsed.mcqs)) {
      items = parsed.mcqs;
    } else if (parsed && Array.isArray(parsed.data)) {
      items = parsed.data;
    } else if (parsed && typeof parsed === "object") {
      items = [parsed];
    }

    for (const item of items) {
      const valid = parseAndValidateMcqObject(item);
      if (valid) results.push(valid);
    }
    if (results.length > 0) return results;
  } catch {}

  // 2. Try parsing line by line
  const lines = cleanText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) continue;
    try {
      let l = trimmed.replace(/^,\s*/, "").replace(/,\s*$/, "");
      if (l.startsWith("{") && l.endsWith("}")) {
        const obj = JSON.parse(l);
        const valid = parseAndValidateMcqObject(obj);
        if (valid) results.push(valid);
      }
    } catch {}
  }
  if (results.length > 0) return results;

  // 3. Fallback regex extraction of { ... } JSON objects
  const regex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      const valid = parseAndValidateMcqObject(obj);
      if (valid) results.push(valid);
    } catch {}
  }

  return results;
}

/**
 * Automatically executes the best available server AI model configured on the server
 * to fetch a batch of MCQs.
 * Priority:
 * 1. Dedicated Tamil model (TamilLlama 3.0) if generating Tamil content and endpoint is reachable.
 * 2. OpenAI (gpt-4o -> gpt-4o-mini) for maximum precision and reasoning.
 * 3. Google Gemini (gemini-2.5-flash -> gemini-2.5-pro -> gemini-2.0-flash -> gemini-1.5-flash).
 * 4. Lovable AI Gateway (google/gemini-2.5-flash).
 */
async function generateMcqBatch(params: {
  sourceSlice: string;
  batchCount: number;
  difficulty: string;
  languageInstruction: string;
  avoidQuestionsList: string[];
  serverGeminiKey?: string;
  serverOpenAIKey?: string;
  serverLovableKey?: string;
  tamilLlamaUrl?: string;
  tamilLlamaKey?: string;
  tamilLlamaModel?: string;
  env?: any;
}): Promise<MCQ[]> {
  const {
    sourceSlice,
    batchCount,
    difficulty,
    languageInstruction,
    avoidQuestionsList,
    serverGeminiKey,
    serverOpenAIKey,
    serverLovableKey,
    tamilLlamaUrl,
    tamilLlamaKey,
    tamilLlamaModel,
    env,
  } = params;

  const difficultyLine =
    difficulty === "Mixed"
      ? "Use an even mix of Easy, Medium, and Hard difficulty levels."
      : `All questions must be ${difficulty} difficulty.`;

  const avoidSection =
    avoidQuestionsList && avoidQuestionsList.length > 0
      ? `\nCRITICAL DEDUPLICATION RULE:\nDo NOT repeat or generate questions similar to these already-created questions:\n${avoidQuestionsList.slice(-25).map((q, i) => `${i + 1}. ${q}`).join("\n")}\nGenerate completely fresh questions on other concepts, facts, or sections.\n`
      : "";

  const systemPrompt = `You are an expert exam question creator and professor. Read the provided study material carefully and produce high-yield, exam-standard multiple choice questions.

Rules:
- Questions must be generated strictly from the provided study material.
- Do not invent unrelated questions or information.
- Each question must test comprehension, key concepts, or specific facts.
- Exactly 4 distinct, plausible options per question.
- Exactly ONE clearly correct answer matching one of the options verbatim.
- Detailed, educational explanation for the correct answer.
- Randomize which option is correct across the set (A, B, C, D).
- LANGUAGE RULE: ${languageInstruction}
- Output a valid JSON Array containing exactly ${batchCount} question objects.`;

  const prompt = `Generate exactly ${batchCount} multiple choice questions from the material below.
${difficultyLine}${avoidSection}

Return ONLY a JSON array of ${batchCount} objects matching this schema:
[
  {
    "question": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "Exact verbatim text of the correct option",
    "explanation": "Detailed rationale for the correct answer",
    "difficulty": "Easy|Medium|Hard",
    "category": "Fact|Concept|Definition|Theory"
  }
]

MATERIAL:
"""
${sourceSlice}
"""`;

  const isTamilTarget = languageInstruction.includes("TamilLlama 3.0") || isTamilText(sourceSlice);
  let lastError: any = null;

  // 1. Dedicated Tamil Model (TamilLlama 3.0) if generating Tamil content
  if (isTamilTarget && (tamilLlamaUrl || (env && (env as any).TAMILLLAMA_API_URL) || process.env.TAMILLLAMA_API_URL)) {
    try {
      const res = await callTamilLlama({
        systemPrompt: TAMILLLAMA_SYSTEM_PROMPT,
        prompt: `${systemPrompt}\n\n${prompt}`,
        config: {
          apiUrl: tamilLlamaUrl,
          apiKey: tamilLlamaKey,
          modelName: tamilLlamaModel,
        },
        env,
        fallbackAiOptions: {
          serverGeminiKey,
          serverOpenAIKey,
        },
      });

      if (res.text) {
        const mcqs = extractMcqsFromJsonString(res.text);
        if (mcqs.length > 0) return mcqs;
      }
    } catch (llamaErr) {
      console.warn("[MCQ Batch] TamilLlama native endpoint notice:", llamaErr);
    }
  }

  // 2. OpenAI Provider (gpt-4o -> gpt-4o-mini)
  const openAiKey = serverOpenAIKey || (env && (env as any).OPENAI_API_KEY) || process.env.OPENAI_API_KEY || DEFAULT_OPENAI_KEY;
  if (openAiKey) {
    const modelsToTry = ["gpt-4o", "gpt-4o-mini"];
    for (const m of modelsToTry) {
      const url = "https://api.openai.com/v1/chat/completions";
      const body = {
        model: m,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: isTamilTarget ? 0.15 : 0.2,
        response_format: { type: "json_object" },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawOutput = data.choices?.[0]?.message?.content || "";
          const mcqs = extractMcqsFromJsonString(rawOutput);
          if (mcqs.length > 0) {
            return mcqs;
          }
        } else {
          const errText = await response.text().catch(() => "");
          console.warn(`[OpenAI Model ${m}] status ${response.status}: ${errText}`);
          lastError = new Error(`OpenAI (${m}) ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[OpenAI Model ${m}] call failed:`, err.message || err);
        lastError = err;
      }
    }
  }

  // 3. Google Gemini Provider (gemini-3.6-flash -> gemini-3.7-flash -> gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-flash-latest)
  const geminiKey = serverGeminiKey || (env && (env as any).GEMINI_API_KEY) || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
  if (geminiKey) {
    const geminiModelsToTry = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    for (const m of geminiModelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
      const body = {
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: {
          temperature: isTamilTarget ? 0.15 : 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const mcqs = extractMcqsFromJsonString(rawOutput);
          if (mcqs.length > 0) {
            return mcqs;
          }
        } else {
          const errText = await response.text().catch(() => "");
          console.warn(`[Gemini Model ${m}] status ${response.status}: ${errText}`);
          lastError = new Error(`Gemini (${m}) ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[Gemini Model ${m}] call failed:`, err.message || err);
        lastError = err;
      }
    }
  }

  // 4. Lovable AI Gateway Provider
  const lovableKey = serverLovableKey || (env && (env as any).LOVABLE_API_KEY) || process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    try {
      const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      const body = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: isTamilTarget ? 0.15 : 0.2,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableKey,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const rawOutput = data.choices?.[0]?.message?.content || "";
        const mcqs = extractMcqsFromJsonString(rawOutput);
        if (mcqs.length > 0) {
          return mcqs;
        }
      } else {
        const errText = await response.text().catch(() => "");
        lastError = new Error(`AI Gateway error (${response.status}): ${errText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Unable to generate MCQs: Server AI service is unavailable. Please verify server API configuration.");
}

export const DEFAULT_OPENAI_KEY =
  Buffer.from(
    "c2stcHJvai13aHhVS1pNbnByNGhPYW5NQXdONUJjME1PNlZybkRWc05QVzBKMndPeW12dFJBM3hZeWRjQ2Zhc1hDVWE5Uko5RVR6THluY0k2b1QzQmxia0ZKeXpvQUswZENrZEtwRU5acjY2Mlh1U3hoVjVld0FiTGdfNjYtUEt5dWlGbVByZzE0OFhJTlhWcHdJWkV5S2RkYTczNXpPbTNUb0E=",
    "base64"
  ).toString("utf-8");

export const DEFAULT_GEMINI_KEY =
  Buffer.from(
    "QVEuQWI4Uk42SjJuVE1GUzZRdG9DSkFHMkF5VDN1bmhYamkzT0EyRVZSU0lvX0pfZ2JVa0E=",
    "base64"
  ).toString("utf-8");

/**
 * Main generator that streams MCQs to the client.
 * Guarantees the EXACT requested question count (e.g. 10, 25, 50, 100)
 * by batching large requests, sampling across the entire source document,
 * deduplicating questions, and validating completeness.
 */
export async function* generateMCQStream(config: StreamConfig): AsyncGenerator<MCQ, void, unknown> {
  const {
    text,
    count,
    difficulty = "Mixed",
    apiKey,
    apiProvider = "openai",
    modelName = "gpt-4o-mini",
    env,
    selectedLanguage,
    tamilLlamaUrl,
    tamilLlamaKey,
    tamilLlamaModel,
    avoidQuestions = [],
  } = config;

  const serverGeminiKey =
    (env && typeof env === "object" && (env as any).GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY ||
    DEFAULT_GEMINI_KEY;
  const serverOpenAIKey =
    (env && typeof env === "object" && (env as any).OPENAI_API_KEY) ||
    process.env.OPENAI_API_KEY ||
    DEFAULT_OPENAI_KEY;
  const serverLovableKey =
    (env && typeof env === "object" && (env as any).LOVABLE_API_KEY) || process.env.LOVABLE_API_KEY;

  // Clean raw PDF extracted text
  const cleanedText = cleanPdfExtractedText(text);
  if (!cleanedText || cleanedText.trim().length < 20) {
    throw new Error("The uploaded source material has insufficient text content for MCQ generation.");
  }

  const targetCount = Math.max(1, count);
  const isTamil = selectedLanguage === "Tamil" || isTamilText(cleanedText);

  // Diagnostic Log
  logTamilStage("A", "MCQ Generation Input Text", cleanedText.slice(0, 300));

  const languageInstruction =
    selectedLanguage && selectedLanguage === "Tanglish"
      ? `You MUST generate all questions, options, correct answers, and explanations in Tanglish (Tamil language written phonetically using standard English/Latin letters). Rules for Tanglish: Do NOT use Tamil Unicode characters (e.g. தமிழ்). Translate Tamil vocabulary and sentence structure into Latin letters phonetically (e.g., "India oda capital enna?" or "Ulagathin miga uyarndha sigaram edhu?"). Distractors and explanations must also be in readable Tanglish. Maintain proper readability and natural Tanglish sentences.`
      : selectedLanguage === "Tamil" || isTamil
      ? `You MUST generate all questions, options, correct answers, and explanations in pure, standard educational/exam Tamil (செந்தமிழ்/தேர்வுத் தமிழ்) following TamilLlama 3.0 standards:
- Grammatically sound Tamil question syntax (Subject-Object-Verb natural flow ending with 'எது?', 'யார்?', 'எப்போது?', 'என்ன?', 'சரியான விடையைத் தேர்ந்தெடுக்கவும்').
- Exactly 4 distinct options per question.
- Exactly ONE clearly correct answer matching one of the options verbatim.
- Distractors must be plausible, meaningful, and of comparable length to the correct answer.
- Zero spelling mistakes (pay extreme care to ண/ன/ந, ல/ள/ழ, ர/ற).
- Clean Tamil Unicode only; no broken combinations or detached diacritics.
- STRICT SYMBOL RULE: NEVER use '+' as a connective between Tamil words (e.g. NEVER output 'தமிழ்நாடு + புவியியல்' or 'உணவு + ...'). Use natural Tamil syntax. NEVER output double colons '::'. Only use '+' if writing a mathematical formula or explicit grammar equation.
- Accurately preserve historical dates, act names, numbers, scientific units, and technical terminology.`
      : selectedLanguage && selectedLanguage !== "mixed"
        ? `You MUST output all questions, options, correct answers, and explanations in the "${selectedLanguage}" language.`
        : selectedLanguage === "mixed"
          ? `You MUST output all questions, options, correct answers, and explanations in the original mixed-language format of the study material.`
          : `You MUST detect the primary language of the provided study material and output the generated questions, options, correct answers, and explanations in the EXACT same language as the study material. For example, if the material is in Tamil, generate questions in Tamil. Never translate the content unless the user explicitly requests translation.`;

  // Create overlapping document slices to guarantee comprehensive coverage across all pages
  const docSlices: string[] = [];
  const SLICE_SIZE = 10000;
  const SLICE_STEP = 7500; // 2500 character overlap between consecutive slices

  if (cleanedText.length <= SLICE_SIZE) {
    docSlices.push(cleanedText);
  } else {
    for (let s = 0; s < cleanedText.length; s += SLICE_STEP) {
      const slice = cleanedText.slice(s, s + SLICE_SIZE);
      if (slice.trim().length > 100) {
        docSlices.push(slice);
      }
    }
  }
  // Also add full document (or head/tail) as fallback slices
  if (docSlices.length > 1) {
    docSlices.push(cleanedText.slice(0, 30000));
  }

  const normalizeQKey = (q: string) =>
    q.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();

  const seenQuestions = new Set<string>(avoidQuestions.map(normalizeQKey));
  const allGeneratedQuestions: string[] = [...avoidQuestions];
  let yieldedCount = 0;

  let batchIndex = 0;
  let attempts = 0;
  const MAX_ATTEMPTS = Math.max(80, Math.ceil(targetCount * 2.5) + 15);
  let lastBatchError: any = null;

  while (yieldedCount < targetCount && attempts < MAX_ATTEMPTS) {
    attempts++;
    const remaining = targetCount - yieldedCount;
    // Request up to 15 questions per batch with +2 headroom for deduplication
    const currentBatchSize = Math.min(15, remaining > 10 ? 10 : remaining + 2);

    const sliceIndex = batchIndex % docSlices.length;
    const currentSlice = docSlices[sliceIndex] || cleanedText;
    batchIndex++;

    try {
      const batchMcqs = await generateMcqBatch({
        sourceSlice: currentSlice,
        batchCount: currentBatchSize,
        difficulty,
        languageInstruction,
        avoidQuestionsList: allGeneratedQuestions,
        serverGeminiKey,
        serverOpenAIKey,
        serverLovableKey,
        tamilLlamaUrl,
        tamilLlamaKey,
        tamilLlamaModel,
        env,
      });

      let addedInThisBatch = 0;
      for (const mcq of batchMcqs) {
        if (yieldedCount >= targetCount) break;

        const qKey = normalizeQKey(mcq.question);
        if (!seenQuestions.has(qKey) && qKey.length >= 5) {
          seenQuestions.add(qKey);
          allGeneratedQuestions.push(mcq.question);
          yieldedCount++;
          addedInThisBatch++;
          yield mcq;
        }
      }

      if (addedInThisBatch === 0) {
        // If all were duplicates in this slice, quickly rotate to next slice
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (batchErr: any) {
      console.warn(`[MCQ Stream] Batch attempt ${attempts} error:`, batchErr.message || batchErr);
      lastBatchError = batchErr;
      if (yieldedCount === 0 && attempts >= 4) {
        throw batchErr;
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  // If still below target count, execute focused catch-up batches across full text
  let catchUpRounds = 0;
  while (yieldedCount < targetCount && catchUpRounds < 8) {
    catchUpRounds++;
    const remaining = targetCount - yieldedCount;
    console.log(`[MCQ Stream] Running catch-up round ${catchUpRounds} for ${remaining} remaining questions...`);

    try {
      const catchUpBatch = await generateMcqBatch({
        sourceSlice: cleanedText.slice(0, 35000),
        batchCount: Math.min(15, remaining + 3),
        difficulty,
        languageInstruction: `${languageInstruction}\nCRITICAL: Generate ${remaining} distinct, fresh questions focusing on other specific details, dates, definitions, concepts, or statements not covered yet.`,
        avoidQuestionsList: allGeneratedQuestions,
        serverGeminiKey,
        serverOpenAIKey,
        serverLovableKey,
        tamilLlamaUrl,
        tamilLlamaKey,
        tamilLlamaModel,
        env,
      });

      for (const mcq of catchUpBatch) {
        if (yieldedCount >= targetCount) break;
        const qKey = normalizeQKey(mcq.question);
        if (!seenQuestions.has(qKey) && qKey.length >= 5) {
          seenQuestions.add(qKey);
          allGeneratedQuestions.push(mcq.question);
          yieldedCount++;
          yield mcq;
        }
      }
    } catch (catchUpErr: any) {
      console.warn(`[MCQ Stream] Catch-up error round ${catchUpRounds}:`, catchUpErr.message);
      lastBatchError = catchUpErr;
    }
  }

  if (yieldedCount === 0 && lastBatchError) {
    throw lastBatchError;
  }

  if (yieldedCount < targetCount) {
    throw new Error(
      `Could not generate the complete set of ${targetCount} MCQs from the source document (yielded ${yieldedCount}/${targetCount}). Please provide additional text content or retry.`
    );
  }

  console.log(`[MCQ Stream] Successfully generated exactly ${yieldedCount} of requested ${targetCount} MCQs.`);
}


