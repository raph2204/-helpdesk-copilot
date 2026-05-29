
import { ROLE_PROMPTS } from "./prompts.js";
import { callOpenAI, callClaude, callGrok, fallbackConsensus } from "./providers.js";
import { mergeVotes } from "./voting.js";

export async function buildConsensus(ticket) {
  const fallback = fallbackConsensus(ticket);
  const votes = [];

  try {
    const openai = await callOpenAI({ rolePrompt: ROLE_PROMPTS.remediation, ticket });
    if (openai) votes.push({ provider: "openai", ...openai });
  } catch (error) {
    console.warn("OpenAI consensus failed:", error.message);
  }

  try {
    const claude = await callClaude({ rolePrompt: ROLE_PROMPTS.remediation, ticket });
    if (claude) votes.push({ provider: "claude", ...claude });
  } catch {}

  try {
    const grok = await callGrok({ rolePrompt: ROLE_PROMPTS.remediation, ticket });
    if (grok) votes.push({ provider: "grok", ...grok });
  } catch {}

  return mergeVotes(votes, fallback);
}
