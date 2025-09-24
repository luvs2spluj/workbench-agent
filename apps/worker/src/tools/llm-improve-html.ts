import OpenAI from 'openai'
import { config } from '../config'
import { createRunLogger } from '../logger'
import { createCostTracker } from '../cost-tracker'

export interface LLMImproveHTMLResult {
  originalHtml: string
  improvedHtml: string
  suggestions: string[]
  tokensUsed: {
    input: number
    output: number
  }
}

export const llmImproveHTMLTool = async (runId: string, htmlContent?: string): Promise<LLMImproveHTMLResult> => {
  const logger = createRunLogger(runId)
  const costTracker = createCostTracker(runId)
  
  await logger.info('Starting HTML improvement with LLM')

  const defaultHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Sample Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This is a sample HTML page that needs improvement.</p>
    <div>
        <button>Click me</button>
    </div>
</body>
</html>
  `.trim()

  const inputHtml = htmlContent || defaultHtml

  if (!config.OPENAI_API_KEY) {
    await logger.warn('OpenAI API key not provided, returning mock improvements')
    return {
      originalHtml: inputHtml,
      improvedHtml: inputHtml.replace('<title>Sample Page</title>', '<title>Improved Sample Page</title>'),
      suggestions: [
        'Add semantic HTML elements',
        'Include meta viewport tag',
        'Add CSS for better styling',
        'Improve accessibility with ARIA labels'
      ],
      tokensUsed: { input: 0, output: 0 }
    }
  }

  try {
    const openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    })

    const prompt = `
You are an expert web developer. Please analyze the following HTML and provide an improved version.

Focus on:
1. Semantic HTML structure
2. Accessibility improvements
3. Modern HTML5 features
4. Basic responsive design considerations
5. SEO improvements

Original HTML:
${inputHtml}

Please respond with:
1. The improved HTML code
2. A list of specific improvements made

Format your response as JSON:
{
  "improvedHtml": "...",
  "improvements": ["improvement 1", "improvement 2", ...]
}
    `.trim()

    await logger.info('Calling OpenAI API for HTML improvements')

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const usage = response.usage
    if (usage) {
      await costTracker.recordUsage({
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        provider: 'openai-gpt-3.5-turbo'
      })
    }

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      await logger.warn('Failed to parse OpenAI response as JSON, using raw content')
      parsedResponse = {
        improvedHtml: content,
        improvements: ['AI provided improvements (parsing failed)']
      }
    }

    const result = {
      originalHtml: inputHtml,
      improvedHtml: parsedResponse.improvedHtml || content,
      suggestions: parsedResponse.improvements || ['AI analysis completed'],
      tokensUsed: {
        input: usage?.prompt_tokens || 0,
        output: usage?.completion_tokens || 0
      }
    }

    await logger.info('HTML improvement completed', {
      tokensUsed: result.tokensUsed,
      suggestionsCount: result.suggestions.length
    })

    return result

  } catch (error) {
    await logger.error('Failed to improve HTML with LLM', { error: error.message })
    
    return {
      originalHtml: inputHtml,
      improvedHtml: inputHtml,
      suggestions: [`Error: ${error.message}`],
      tokensUsed: { input: 0, output: 0 }
    }
  }
}
