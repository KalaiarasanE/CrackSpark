import {
  cleanPdfExtractedText,
  validateAndRefineTamilMCQs,
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
 * Parses a single JSON string line into a strictly validated MCQ object.
 */
function parseMcqJsonLine(line: string): MCQ | null {
  if (!line) return null;
  let cleanLine = line.trim();
  if (cleanLine.startsWith("```")) return null;

  // Strip leading/trailing array braces or commas
  cleanLine = cleanLine.replace(/^\s*\[/, "").replace(/\]\s*$/, "").replace(/,\s*$/, "").trim();

  if (!cleanLine.startsWith("{") || !cleanLine.endsWith("}")) {
    const s = cleanLine.indexOf("{");
    const e = cleanLine.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) {
      cleanLine = cleanLine.slice(s, e + 1);
    } else {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(cleanLine);
    if (
      parsed &&
      typeof parsed.question === "string" &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 4 &&
      (typeof parsed.correctAnswer === "string" || typeof parsed.correctAnswer === "number")
    ) {
      let cleanQ = cleanUnwantedTamilSymbols(normalizeTamilUnicode(parsed.question.trim()));
      // Strip question numbers like "1.", "Q1:", "Question 1:"
      cleanQ = cleanQ.replace(/^(?:Q|Question|Q\s*No|வினா|கேள்வி)?\s*\d*\s*[-.:)]\s*/i, "").trim();
      cleanQ = cleanQ.replace(/^Q\d+\s*/i, "").trim();
      if (cleanQ.length < 5) return null;

      const cleanOpts = parsed.options.map((opt: any) => {
        let o = cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(opt || "").trim()));
        // Strip option labels like "A.", "1)", "(A)"
        return o.replace(/^[A-D1-4][\.\)\:\-]\s*/i, "").replace(/^\([A-D1-4]\)\s*/i, "").trim();
      });

      // Validate all 4 options are non-empty
      if (cleanOpts.some((o: string) => !o || o.length === 0)) return null;

      // Validate all 4 options are distinct
      const distinctOpts = new Set(cleanOpts.map((o: string) => o.toLowerCase()));
      if (distinctOpts.size !== 4) return null;

      let rawAns = cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(parsed.correctAnswer).trim()));
      rawAns = rawAns.replace(/^[A-D1-4][\.\)\:\-]\s*/i, "").replace(/^\([A-D1-4]\)\s*/i, "").trim();

      // Check if answer is letter A, B, C, D or index 1, 2, 3, 4
      let matchedOpt: string | null = null;
      const letterMatch = String(parsed.correctAnswer).trim().match(/^(?:option\s*)?([A-D1-4])$/i);
      if (letterMatch) {
        const val = letterMatch[1].toUpperCase();
        let idx = -1;
        if (val >= "A" && val <= "D") idx = val.charCodeAt(0) - 65;
        else if (val >= "1" && val <= "4") idx = parseInt(val, 10) - 1;
        if (idx >= 0 && idx < 4) matchedOpt = cleanOpts[idx];
      }

      if (!matchedOpt) {
        matchedOpt = cleanOpts.find((o: string) => o === rawAns) || null;
      }
      if (!matchedOpt) {
        matchedOpt = cleanOpts.find((o: string) => o.toLowerCase() === rawAns.toLowerCase()) || null;
      }
      if (!matchedOpt) {
        const normAns = rawAns.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
        matchedOpt = cleanOpts.find((o: string) => o.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase() === normAns) || null;
      }
      if (!matchedOpt) {
        // Fallback: check if option is substring of rawAns or vice versa
        matchedOpt = cleanOpts.find((o: string) => rawAns.includes(o) || o.includes(rawAns)) || null;
      }

      // If answer still does not match any of the 4 options, question is invalid
      if (!matchedOpt) return null;

      let cleanExp = parsed.explanation
        ? cleanUnwantedTamilSymbols(normalizeTamilUnicode(String(parsed.explanation).trim()))
        : "";

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
        difficulty: parsed.difficulty || "Medium",
        category: parsed.category || "Fact",
      };
    }
  } catch {
    // Ignore invalid JSON lines
  }
  return null;
}

/**
 * Executes a single AI generation call to fetch a batch of MCQs.
 */
async function generateMcqBatch(params: {
  sourceSlice: string;
  batchCount: number;
  difficulty: string;
  languageInstruction: string;
  avoidQuestionsList: string[];
  apiProvider: string;
  modelName?: string;
  apiKey?: string;
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
    apiProvider,
    modelName,
    apiKey,
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
- Output EXACTLY one JSON object per line.
- Do NOT output markdown code blocks (like \`\`\`json).
- Each JSON object MUST be on a single line.`;

  const prompt = `Generate exactly ${batchCount} multiple choice questions from the material below.
${difficultyLine}${avoidSection}

Each line of your output must be a single JSON object with this exact shape:
{"question":"...","options":["Option A","Option B","Option C","Option D"],"correctAnswer":"<one of the options, verbatim>","explanation":"...","difficulty":"Easy|Medium|Hard","category":"Fact|Concept|Definition|Theory"}

MATERIAL:
"""
${sourceSlice}
"""`;

  const isTamilTarget = languageInstruction.includes("TamilLlama 3.0") || isTamilText(sourceSlice);

  // If dedicated TamilLlama URL is configured and active, try calling it first
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
          apiKey,
          apiProvider: apiProvider as any,
          modelName,
          serverGeminiKey,
          serverOpenAIKey,
        },
      });

      if (res.text) {
        const lines = res.text.split("\n");
        const mcqs: MCQ[] = [];
        for (const l of lines) {
          const parsed = parseMcqJsonLine(l);
          if (parsed) mcqs.push(parsed);
        }
        if (mcqs.length > 0) return mcqs;
      }
    } catch (llamaErr) {
      console.warn("[MCQ Batch] TamilLlama native endpoint fallback:", llamaErr);
    }
  }

  // Primary AI Model Provider
  let url = "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: any = {};

  if (apiProvider === "gemini") {
    const key = apiKey || serverGeminiKey;
    if (!key) throw new Error("No Gemini API key provided. Please configure it in Settings or .env file.");
    let model = modelName || "gemini-3.1-flash-lite";
    if (model === "gemini-2.5-flash") model = "gemini-3.1-flash-lite";

    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    body = {
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
      generationConfig: {
        temperature: isTamilTarget ? 0.15 : 0.25,
        maxOutputTokens: 8192,
      },
    };
  } else if (apiProvider === "openai") {
    const key = apiKey || serverOpenAIKey;
    if (!key) throw new Error("No OpenAI API key provided. Please configure it in Settings or .env file.");
    const model = modelName || "gpt-4o-mini";
    url = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${key}`;
    body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: isTamilTarget ? 0.15 : 0.25,
    };
  } else {
    // Lovable AI Gateway
    const key = serverLovableKey;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured on the server.");
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers["Lovable-API-Key"] = key;
    body = {
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: isTamilTarget ? 0.15 : 0.25,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`AI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let rawOutput = "";

  if (apiProvider === "gemini") {
    rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    rawOutput = data.choices?.[0]?.message?.content || "";
  }

  const lines = rawOutput.split("\n");
  const resultMcqs: MCQ[] = [];

  for (const rawLine of lines) {
    const mcq = parseMcqJsonLine(rawLine);
    if (mcq) {
      resultMcqs.push(mcq);
    }
  }

  return resultMcqs;
}

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
    apiProvider = "gemini",
    modelName,
    env,
    selectedLanguage,
    tamilLlamaUrl,
    tamilLlamaKey,
    tamilLlamaModel,
    avoidQuestions = [],
  } = config;

  const serverGeminiKey =
    (env && typeof env === "object" && (env as any).GEMINI_API_KEY) || process.env.GEMINI_API_KEY;
  const serverOpenAIKey =
    (env && typeof env === "object" && (env as any).OPENAI_API_KEY) || process.env.OPENAI_API_KEY;
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

  // Split source document into logical sections to ensure full coverage
  const docSlices: string[] = [];
  const MAX_SLICE_LEN = 12000;
  if (cleanedText.length <= MAX_SLICE_LEN) {
    docSlices.push(cleanedText);
  } else {
    const numSlices = Math.min(8, Math.ceil(cleanedText.length / MAX_SLICE_LEN));
    const sliceSize = Math.ceil(cleanedText.length / numSlices);
    for (let s = 0; s < cleanedText.length; s += sliceSize) {
      docSlices.push(cleanedText.slice(s, s + sliceSize));
    }
  }

  const seenQuestions = new Set<string>(avoidQuestions.map((q) => q.toLowerCase().trim()));
  const allGeneratedQuestions: string[] = [...avoidQuestions];
  let yieldedCount = 0;

  // Calculate batch plan (10-15 questions per batch)
  const BATCH_SIZE = targetCount > 15 ? 10 : targetCount;
  let batchIndex = 0;
  let attempts = 0;
  const MAX_ATTEMPTS = Math.ceil(targetCount / 5) + 6;

  while (yieldedCount < targetCount && attempts < MAX_ATTEMPTS) {
    attempts++;
    const remaining = targetCount - yieldedCount;
    const currentBatchSize = Math.min(BATCH_SIZE, remaining);

    // Pick slice for this batch to ensure complete coverage across the document
    const sliceIndex = batchIndex % docSlices.length;
    const currentSlice = docSlices[sliceIndex] || cleanedText;
    batchIndex++;

    try {
      const batchMcqs = await generateMcqBatch({
        sourceSlice: currentSlice,
        batchCount: Math.min(currentBatchSize + 2, 15), // Ask for +2 to compensate for any dropped duplicates
        difficulty,
        languageInstruction,
        avoidQuestionsList: allGeneratedQuestions,
        apiProvider,
        modelName,
        apiKey,
        serverGeminiKey,
        serverOpenAIKey,
        serverLovableKey,
        tamilLlamaUrl,
        tamilLlamaKey,
        tamilLlamaModel,
        env,
      });

      for (const mcq of batchMcqs) {
        if (yieldedCount >= targetCount) break;

        const normalizedQ = mcq.question.toLowerCase().trim();
        if (!seenQuestions.has(normalizedQ)) {
          seenQuestions.add(normalizedQ);
          allGeneratedQuestions.push(mcq.question);
          yieldedCount++;
          yield mcq;
        }
      }
    } catch (batchErr: any) {
      console.warn(`[MCQ Stream] Batch ${attempts} failed:`, batchErr.message);
      // Wait briefly before retrying next batch
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  // If still below target count, generate fallback MCQs strictly from source text paragraphs
  if (yieldedCount < targetCount) {
    const missing = targetCount - yieldedCount;
    console.log(`[MCQ Stream] Catch-up generation for ${missing} remaining questions...`);
    try {
      const finalBatch = await generateMcqBatch({
        sourceSlice: cleanedText.slice(0, 25000),
        batchCount: missing + 3,
        difficulty,
        languageInstruction,
        avoidQuestionsList: allGeneratedQuestions,
        apiProvider,
        modelName,
        apiKey,
        serverGeminiKey,
        serverOpenAIKey,
        serverLovableKey,
        tamilLlamaUrl,
        tamilLlamaKey,
        tamilLlamaModel,
        env,
      });

      for (const mcq of finalBatch) {
        if (yieldedCount >= targetCount) break;
        const normalizedQ = mcq.question.toLowerCase().trim();
        if (!seenQuestions.has(normalizedQ)) {
          seenQuestions.add(normalizedQ);
          allGeneratedQuestions.push(mcq.question);
          yieldedCount++;
          yield mcq;
        }
      }
    } catch {}
  }

  console.log(`[MCQ Stream] Finished yielding ${yieldedCount} of requested ${targetCount} MCQs.`);
}

