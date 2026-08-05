import OpenAI from 'openai';

export interface QualitySignals {
  starsCount?: number;
  lastCommitDate?: Date | null;
  hasLicense?: boolean;
  hasDescription?: boolean;
}

export interface QualityVerdict {
  useful: boolean;
  confidence: number;   // 0-1, distance from the decision boundary
  signalScore: number;  // 0-1, hard-metric score
  llmScore: number;     // 0-1, LLM judgment score
  reasoning: string;
  status: 'approved' | 'flagged';
}

function scoreSignals(signals: QualitySignals): number {
  let score = 0;
  let weight = 0;

  if (typeof signals.starsCount === 'number') {
    // log scale so 10 vs 15 stars isn't treated like 10 vs 15k
    score += Math.min(Math.log10(signals.starsCount + 1) / 3, 1) * 0.5;
    weight += 0.5;
  }
  if (signals.lastCommitDate) {
    const monthsSince = (Date.now() - signals.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    score += Math.max(1 - monthsSince / 24, 0) * 0.3; // decays to 0 over ~2 years of inactivity
    weight += 0.3;
  }
  if (typeof signals.hasLicense === 'boolean') {
    score += (signals.hasLicense ? 1 : 0) * 0.1;
    weight += 0.1;
  }
  if (typeof signals.hasDescription === 'boolean') {
    score += (signals.hasDescription ? 1 : 0) * 0.1;
    weight += 0.1;
  }
  return weight > 0 ? score / weight : 0.5; // neutral if nothing to go on
}

async function scoreWithLLM(
  client: OpenAI,
  context: { title: string; description: string; url: string }
): Promise<{ score: number; reasoning: string }> {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You judge whether an open-source project belongs in a developer discovery catalog. ' +
          'Reject trivial forks, empty scaffolds, dotfiles, one-commit abandonware, and tutorial/homework repos. ' +
          'Accept anything that solves a real, non-trivial problem, even if small or niche. ' +
          'Return JSON only: {"score": 0-1, "reasoning": "one sentence"}.',
      },
      { role: 'user', content: `Title: ${context.title}\nDescription: ${context.description}\nURL: ${context.url}` },
    ],
  });
  const content = completion.choices[0]?.message.content;
  if (!content) return { score: 0.5, reasoning: 'LLM judgment unavailable.' };
  const parsed = JSON.parse(content) as { score: number; reasoning: string };
  return { score: Math.max(0, Math.min(1, parsed.score)), reasoning: parsed.reasoning };
}

export async function evaluateUsefulness(
  client: OpenAI | null,
  signals: QualitySignals,
  context: { title: string; description: string; url: string }
): Promise<QualityVerdict> {
  const signalScore = scoreSignals(signals);
  let llmScore = signalScore;
  let reasoning = 'Evaluated on metadata signals only (no LLM judge available).';

  if (client) {
    const llmResult = await scoreWithLLM(client, context);
    llmScore = llmResult.score;
    reasoning = llmResult.reasoning;
  }

  // LLM carries more weight — it catches junk that stars/recency miss (e.g. a
  // well-starred tutorial repo), and signals catch abandonware LLM might not flag.
  const combined = signalScore * 0.4 + llmScore * 0.6;
  const useful = combined >= 0.5;

  return {
    useful,
    confidence: Math.abs(combined - 0.5) * 2,
    signalScore,
    llmScore,
    reasoning,
    status: useful ? 'approved' : 'flagged',
  };
}