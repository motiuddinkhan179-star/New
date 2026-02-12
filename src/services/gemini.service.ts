
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentParameters, Type } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables.
    // Do not hardcode or expose the API key in the client-side code.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateWebsite(prompt: string, highQuality: boolean): Promise<string> {
    const systemInstruction = `You are an expert web developer specializing in modern and beautiful user interfaces.
    Your task is to generate a complete, single HTML file based on the user's prompt.
    The HTML MUST use Tailwind CSS for styling, loaded from the official CDN via a <script> tag.
    The output should be ONLY the HTML code, starting with <!DOCTYPE html> and ending with </html>.
    Do not include any explanations, comments, or markdown formatting like \`\`\`html.
    The design should be clean, responsive, and aesthetically pleasing.
    Ensure all necessary tags like <html>, <head> with a <title>, and <body> are present.
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: {
          type: Type.STRING,
          description: "The complete HTML content for the website, including DOCTYPE, head, body, and Tailwind CSS script tag.",
        },
      },
      required: ['htmlContent'],
    };

    const modelConfig: GenerateContentParameters = {
      model: highQuality ? 'gemini-3-pro-preview' : 'gemini-2.5-flash',
      contents: `Generate a website based on this description: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    if (modelConfig.config) {
      if (highQuality) {
        // As per instructions, for the most complex queries
        modelConfig.config.thinkingConfig = { thinkingBudget: 32768 };
      } else {
        // For standard, faster generation
        modelConfig.config.thinkingConfig = { thinkingBudget: 0 };
      }
    }
    
    try {
      const response = await this.ai.models.generateContent(modelConfig);
      
      if (!response.text) {
          throw new Error('Received an empty response from the API.');
      }
      
      const parsedResponse = JSON.parse(response.text);
      if (parsedResponse && parsedResponse.htmlContent) {
        return parsedResponse.htmlContent;
      } else {
        throw new Error('Invalid JSON response structure from the API.');
      }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the API.");
    }
  }
}
