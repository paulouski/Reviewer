// Constants - Centralized constants and embedded data

// Topic statuses
const TOPIC_STATUS = {
    NOT_STARTED: 'not_started',
    PROBING: 'probing',
    DONE: 'done'
};

// Agent response statuses
const AGENT_STATUS = {
    ASK: 'ask',
    FINAL: 'final'
};

// Role names
const ROLE_NAMES = {
    PLANNER: 'planner',
    TOPIC_AGENT: 'topicAgent',
    FINAL_SUMMARY: 'finalSummary'
};

// Model pricing information
const MODEL_PRICING = {
    "gpt-5": {
        input: "$1.25",
        output: "$0.125"
    },
    "gpt-5-mini": {
        input: "$0.25",
        output: "$0.025"
    },
    "gpt-5-nano": {
        input: "$0.05",
        output: "$0.005"
    },
    "gpt-5-chat-latest": {
        input: "$1.25",
        output: "$0.125"
    }
};

// Default available models (used as fallback)
const DEFAULT_AVAILABLE_MODELS = Object.keys(MODEL_PRICING);

// SVG icon for model pricing tooltip
const MODEL_PRICING_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400 hover:text-gray-600">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
</svg>`;

// Embedded schemas data as fallback for CORS errors when using file:// protocol
const EMBEDDED_SCHEMAS = {
  "planner": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "topics": {
        "type": "array",
        "minItems": 1,
        "maxItems": 10,
        "description": "Array of interview topics. Maximum 15 topics allowed.",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "name": { "type": "string", "minLength": 3, "maxLength": 100 },
            "importance": { "type": "integer", "minimum": 1, "maximum": 5 },
            "required_level": { "type": "string", "enum": ["basic", "solid", "deep"] },
            "merged_from": {
              "type": "array",
              "minItems": 0,
              "maxItems": 12,
              "items": { "type": "string", "minLength": 2, "maxLength": 60 }
            }
          },
          "required": ["name", "importance", "required_level", "merged_from"]
        }
      }
    },
    "required": ["topics"]
  },
  "topicAgent": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "status": { "type": "string", "enum": ["ask", "final"] },
      "question": {
        "type": ["object", "null"],
        "additionalProperties": false,
        "properties": {
          "text": { "type": "string", "minLength": 8, "maxLength": 400 }
        },
        "required": ["text"]
      },
      "verdict": {
        "type": ["object", "null"],
        "additionalProperties": false,
        "properties": {
          "name":           { "type": "string",  "minLength": 3, "maxLength": 100 },
          "assessed_level": { "type": "string",  "enum": ["basic", "solid", "deep"] },
          "score":          { "type": "integer", "minimum": 0, "maximum": 5 },
          "confidence":     { "type": "number",  "minimum": 0, "maximum": 1 },
          "strengths": {
            "type": "array",
            "minItems": 0,
            "maxItems": 6,
            "items": { "type": "string" }
          },
          "gaps": {
            "type": "array",
            "minItems": 0,
            "maxItems": 8,
            "items": { "type": "string" }
          }
        },
        "required": ["name", "assessed_level", "score", "confidence", "strengths", "gaps"]
      }
    },
    "required": ["status", "question", "verdict"]
  },
  "finalSummary": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "per_topic": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "name": { "type": "string", "minLength": 3, "maxLength": 100 },
            "score": { "type": "integer", "minimum": 0, "maximum": 5 },
            "assessed_level": { "type": "string", "enum": ["basic", "solid", "deep"] },
            "comment": { "type": "string", "minLength": 10, "maxLength": 300 }
          },
          "required": ["name", "score", "assessed_level", "comment"]
        }
      },
      "fit_overall_percent": { "type": "integer", "minimum": 0, "maximum": 100 },
      "fit_label": {
        "type": "string",
        "enum": ["Strong match", "Good / Partial fit", "Weak fit", "Poor fit"]
      }
    },
    "required": ["per_topic", "fit_overall_percent", "fit_label"]
  }  
};

// Embedded config data as fallback for CORS errors when using file:// protocol
const EMBEDDED_CONFIG = {
  "roles": {
    "planner": {
      "name": "Planner",
      "model": "gpt-5-nano",
      "availableModels": ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-chat-latest"],
      "max_output_tokens": 5000,
      "reasoning_effort": "low",
      "systemPrompt": "You read the JOB DESCRIPTION and the CANDIDATE CV.\nReturn a compact list of interview TOPICS tailored to THIS job:\n- name (concise),\n- importance: 1–5,\n- required_level: basic | solid | deep (how deep THIS job expects),\n- merged_from (optional): minor libs/tools merged into this topic.\n\nRules:\n- Purely conceptual focus. No code.\n- Prefer fewer, higher-signal topics.\n\nOutput ONLY JSON matching `plannerResponse`."
    },
    "topicAgent": {
      "name": "TopicAgent",
      "model": "gpt-5-nano",
      "availableModels": ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-chat-latest"],
      "max_output_tokens": 5000,
      "reasoning_effort": "low",
      "systemPrompt": "You conduct a short conceptual interview for ONE topic.\nInputs (from the client): topic name, required_level, max_questions (client-side), recent answer (if any).\n\nBehavior:\n- If more evidence is needed and the client has not exhausted the limit → ask ONE short conceptual question (no code). Output: status=\"ask\", question.text.\n- If you can judge the candidate's level OR the client reached the limit → output status=\"final\" with verdict (name, assessed_level, score 0–5, strengths, gaps, confidence?).\n\nConstraints:\n- Do NOT request or require code.\n- Keep each question focused and short.\n\nLanguage rules:\n- Always detect the candidate's language from their latest answer.\n- If their latest answer is primarily in Russian, you MUST ask the next question in Russian.\n- If their latest answer is primarily in English, you MUST ask the next question in English.\n- If the candidate mixes languages, try to use the language that dominates their technical explanation (usually English for technical interviews, Russian for more informal answers).\n- If you really cannot detect the language, default to English.\n- Do NOT mention that you are detecting languages. Just naturally continue in the appropriate language.\n\nOutput ONLY JSON matching `topicAgentResponse`."
    },
    "finalSummary": {
      "name": "FinalSummary",
      "model": "gpt-5-nano",
      "availableModels": ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-chat-latest"],
      "max_output_tokens": 5000,
      "reasoning_effort": "low",
      "systemPrompt": "Given the per-topic verdicts, produce a concise summary:\n\n- per_topic items (name, score, assessed_level, comment).\n- Optionally overall fit: fit_overall_percent and fit_label.\nOutput ONLY JSON matching `finalSummaryResponse`."
    }
  },
  "settings": {
    "maxQuestionsPerTopic": 5,
    "maxTopics": 10
  }
};

