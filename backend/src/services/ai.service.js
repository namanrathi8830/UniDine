const OpenAI = require('openai');

/**
 * AI Service for generating responses and analyzing content
 */
class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze message sentiment and intent
   * @param {String} message - User message
   * @returns {Promise<Object>} - Sentiment and intent analysis
   */
  async analyzeMessage(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an analysis assistant that determines sentiment and intent of messages sent to restaurants on social media. Analyze the text and respond with JSON."
          },
          {
            role: "user",
            content: `Analyze the following message for sentiment (positive, neutral, negative) and intent (question, complaint, praise, inquiry, reservation, menu, hours, location, other). Message: "${message}"`
          }
        ],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        sentiment: analysis.sentiment || 'neutral',
        intent: analysis.intent || 'other'
      };
    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        sentiment: 'neutral',
        intent: 'other'
      };
    }
  }

  /**
   * Generate an AI response to a message
   * @param {Object} params - Parameters
   * @param {String} params.message - User message
   * @param {String} params.businessName - Business name
   * @param {String} params.prompt - Custom prompt instructions
   * @param {Array} params.conversationHistory - Previous messages for context
   * @returns {Promise<String>} - Generated response
   */
  async generateResponse({ message, businessName, prompt, conversationHistory = [] }) {
    try {
      const systemPrompt = prompt || 
        `You are a friendly customer service representative for ${businessName}, a restaurant. 
        Be helpful, professional, and concise. Keep responses under 200 characters when possible. 
        Offer solutions to problems, answer questions accurately, and maintain a positive tone.`;
      
      // Format conversation history
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.fromUser ? "user" : "assistant",
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages,
        max_tokens: 150,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our team directly.";
    }
  }
}

module.exports = new AIService(); 