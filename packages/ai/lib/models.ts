import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel } from "ai";
import { keys } from "../keys";

interface AiModels {
  chat: LanguageModel;
  embeddings: EmbeddingModel;
}

let cachedModels: AiModels | undefined;

export const getModels = (): AiModels => {
  if (cachedModels) {
    return cachedModels;
  }

  const openai = createOpenAI({
    apiKey: keys().OPENAI_API_KEY,
  });
  cachedModels = {
    chat: openai("gpt-4o-mini"),
    embeddings: openai.embedding("text-embedding-3-small"),
  };
  return cachedModels;
};

export const models: AiModels = {
  get chat() {
    return getModels().chat;
  },
  get embeddings() {
    return getModels().embeddings;
  },
};
