import OpenAI from 'openai';

export function projectEmbeddingText(project: { title: string; shortDescription: string; tags: string[] }): string {
  return [project.title, project.shortDescription, project.tags.join(' ')].join(' ');
}

export async function createEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({ model: 'text-embedding-3-small', input: text, dimensions: 1536 });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error('OpenAI returned no embedding.');
  return embedding;
}
