import { StateGraph, Annotation, END, START } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { AIResponse } from '@/types'

const CHAT_MODEL = 'gpt-4o-mini'

// ── State ────────────────────────────────────────────────────────────────────

const AgentState = Annotation.Root({
  userId: Annotation<string>(),
  goal: Annotation<string>(),
  userProfile: Annotation<Record<string, any>>({
    reducer: (_, b) => b,
    default: () => ({}),
  }),
  searchKeywords: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  scrapedInternships: Annotation<any[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  matchedInternships: Annotation<any[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  coverLetters: Annotation<Record<string, string>>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),
  analysis: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  strategy: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  errors: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  completed: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
})

type AgentStateType = typeof AgentState.State

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildModel(temperature = 0.3): ChatOpenAI {
  return new ChatOpenAI({
    model: CHAT_MODEL,
    temperature,
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

/**
 * Analyzes the user profile and goal to produce a structured summary.
 */
async function analyzeProfileNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const model = buildModel(0.2)
    const parser = new StringOutputParser()

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are a career analyst specializing in tech internships. ' +
        'Produce a concise profile analysis and extract the most relevant skills.'
      ),
      HumanMessagePromptTemplate.fromTemplate(
        'User goal: {goal}\n\nUser profile:\n{profile}\n\n' +
        'Provide a brief analysis (3-4 sentences) of the candidate\'s strengths ' +
        'and the types of internships they should target.'
      ),
    ])

    const chain = prompt.pipe(model).pipe(parser)

    const analysis = await chain.invoke({
      goal: state.goal,
      profile: JSON.stringify(state.userProfile, null, 2),
    })

    return { analysis }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { errors: [`analyzeProfile: ${msg}`] }
  }
}

/**
 * Derives a concrete search strategy and keyword list from the analysis.
 */
async function planStrategyNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const model = buildModel(0.3)
    const parser = new StringOutputParser()

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are a job-search strategist. Return ONLY a JSON object with keys ' +
        '"strategy" (string) and "keywords" (string[]).'
      ),
      HumanMessagePromptTemplate.fromTemplate(
        'Profile analysis: {analysis}\n\nUser goal: {goal}\n\n' +
        'Generate a search strategy and a list of 5-8 relevant keywords for internship searches.'
      ),
    ])

    const chain = prompt.pipe(model).pipe(parser)

    const raw = await chain.invoke({
      analysis: state.analysis,
      goal: state.goal,
    })

    let parsed: { strategy: string; keywords: string[] }
    try {
      // Extract JSON from possible markdown code block
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      parsed = {
        strategy: raw,
        keywords: ['software engineering', 'internship', 'entry level'],
      }
    }

    return {
      strategy: parsed.strategy,
      searchKeywords: parsed.keywords,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { errors: [`planStrategy: ${msg}`] }
  }
}

/**
 * Simulates retrieving internship listings.
 * In production this would call the ScraperAgent.
 */
async function searchInternshipsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    // Stub – returns representative placeholder data so the graph can run
    // without Playwright / external sites in serverless environments.
    const internships = state.searchKeywords.slice(0, 3).map((kw, i) => ({
      id: `scraped-${i + 1}`,
      title: `${kw.charAt(0).toUpperCase() + kw.slice(1)} Intern`,
      company: ['Google', 'Microsoft', 'Meta', 'Amazon', 'Apple'][i % 5],
      location: 'Remote',
      description: `Work on ${kw} projects with a talented engineering team.`,
      requirements: `Experience with ${kw}, strong problem-solving skills.`,
      source: 'orchestrator',
    }))

    return { scrapedInternships: internships }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { errors: [`searchInternships: ${msg}`] }
  }
}

/**
 * Scores each scraped internship against the user profile using GPT.
 */
async function matchInternshipsNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    if (state.scrapedInternships.length === 0) {
      return { matchedInternships: [] }
    }

    const model = buildModel(0.1)
    const parser = new StringOutputParser()

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are a technical recruiter. Return ONLY a JSON array of objects with ' +
        'keys "id", "matchScore" (0-1), and "reason" (one sentence).'
      ),
      HumanMessagePromptTemplate.fromTemplate(
        'Profile analysis: {analysis}\n\n' +
        'Score each of the following internships:\n{internships}'
      ),
    ])

    const chain = prompt.pipe(model).pipe(parser)

    const raw = await chain.invoke({
      analysis: state.analysis,
      internships: JSON.stringify(
        state.scrapedInternships.map(({ id, title, company, description, requirements }) => ({
          id, title, company, description, requirements,
        })),
        null,
        2
      ),
    })

    let scores: Array<{ id: string; matchScore: number; reason: string }> = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      scores = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      // Fall back: assign equal scores
      scores = state.scrapedInternships.map(i => ({
        id: i.id,
        matchScore: 0.7,
        reason: 'Good general fit',
      }))
    }

    const matched = state.scrapedInternships
      .map(internship => {
        const score = scores.find(s => s.id === internship.id)
        return { ...internship, matchScore: score?.matchScore ?? 0, matchReason: score?.reason ?? '' }
      })
      .filter(i => i.matchScore >= 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)

    return { matchedInternships: matched }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { errors: [`matchInternships: ${msg}`] }
  }
}

/**
 * Generates a tailored cover letter for the top-scoring internship.
 */
async function generateCoverLetterNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const topInternship = state.matchedInternships[0]
    if (!topInternship) {
      return { coverLetters: {} }
    }

    const model = buildModel(0.7)
    const parser = new StringOutputParser()

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are an expert cover-letter writer. Write a professional, ' +
        'compelling cover letter of 300-400 words. Output only the letter text.'
      ),
      HumanMessagePromptTemplate.fromTemplate(
        'Candidate goal: {goal}\nProfile summary: {analysis}\n\n' +
        'Position: {title} at {company}\n' +
        'Description: {description}\n' +
        'Requirements: {requirements}\n\n' +
        'Write a tailored cover letter for this role.'
      ),
    ])

    const chain = prompt.pipe(model).pipe(parser)

    const letter = await chain.invoke({
      goal: state.goal,
      analysis: state.analysis,
      title: topInternship.title,
      company: topInternship.company,
      description: topInternship.description ?? '',
      requirements: topInternship.requirements ?? '',
    })

    return { coverLetters: { [topInternship.id]: letter } }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { errors: [`generateCoverLetter: ${msg}`] }
  }
}

/**
 * Marks the workflow as finished.
 */
async function finalizeNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  return { completed: true }
}

// ── Conditional routing ───────────────────────────────────────────────────────

function shouldGenerateCoverLetter(state: AgentStateType): 'generateCoverLetter' | 'finalize' {
  return state.matchedInternships.length > 0 ? 'generateCoverLetter' : 'finalize'
}

// ── Graph assembly ────────────────────────────────────────────────────────────

function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode('analyzeProfile', analyzeProfileNode)
    .addNode('planStrategy', planStrategyNode)
    .addNode('searchInternships', searchInternshipsNode)
    .addNode('matchInternships', matchInternshipsNode)
    .addNode('generateCoverLetter', generateCoverLetterNode)
    .addNode('finalize', finalizeNode)

    .addEdge(START, 'analyzeProfile')
    .addEdge('analyzeProfile', 'planStrategy')
    .addEdge('planStrategy', 'searchInternships')
    .addEdge('searchInternships', 'matchInternships')
    .addConditionalEdges('matchInternships', shouldGenerateCoverLetter, {
      generateCoverLetter: 'generateCoverLetter',
      finalize: 'finalize',
    })
    .addEdge('generateCoverLetter', 'finalize')
    .addEdge('finalize', END)

  return graph.compile()
}

// ── Public API ────────────────────────────────────────────────────────────────

export class OrchestratorAgent {
  private graph = buildGraph()

  /**
   * Runs the full internship-hunting workflow for a user.
   *
   * @param userId   - the user's ID
   * @param goal     - free-text description of what the user wants
   *                   (e.g. "Find remote ML internships at top tech companies")
   * @param profile  - partial user profile object
   */
  async run(
    userId: string,
    goal: string,
    profile: Record<string, any> = {}
  ): Promise<AIResponse> {
    try {
      const initialState: AgentStateType = {
        userId,
        goal,
        userProfile: profile,
        searchKeywords: [],
        scrapedInternships: [],
        matchedInternships: [],
        coverLetters: {},
        analysis: '',
        strategy: '',
        errors: [],
        completed: false,
      }

      const finalState = await this.graph.invoke(initialState)

      return {
        success: true,
        data: {
          analysis: finalState.analysis,
          strategy: finalState.strategy,
          searchKeywords: finalState.searchKeywords,
          matchedInternships: finalState.matchedInternships,
          coverLetters: finalState.coverLetters,
          topMatch: finalState.matchedInternships[0] ?? null,
        },
        metadata: {
          userId,
          goal,
          internshipsFound: finalState.scrapedInternships.length,
          internshipsMatched: finalState.matchedInternships.length,
          coverLettersGenerated: Object.keys(finalState.coverLetters).length,
          errors: finalState.errors,
          completed: finalState.completed,
        },
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error('OrchestratorAgent error:', error)
      return {
        success: false,
        error: `Orchestration failed: ${msg}`,
      }
    }
  }
}
