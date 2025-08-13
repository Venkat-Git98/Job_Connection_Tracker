const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    });
    
    // Personal profile - customize this based on user
    this.personalProfile = {
      name: 'Venkat',
      currentRole: 'Machine Learning Engineer',
      experience: '4+ years in ML/AI',
      skills: ['Deep Learning', 'Computer Vision', 'MLOps', 'Python', 'TensorFlow', 'PyTorch'],
      motivation: 'Building real-world ML systems that create meaningful impact',
      background: 'ML Engineer with strong experience in deep learning and computer vision; comfortable shipping production ML/AI'
    };
  }

  async generateConnectionRequest(targetProfile) {
    try {
      const prompt = this.buildConnectionPrompt(targetProfile);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const connectionRequest = response.text().trim();
      
      // Ensure the message is under 300 characters
      if (connectionRequest.length > 300) {
        const shortenPrompt = `Please shorten this LinkedIn connection request to under 300 characters while keeping it personal and engaging:\n\n"${connectionRequest}"`;
        
        const shortenResult = await this.model.generateContent(shortenPrompt);
        const shortenResponse = await shortenResult.response;
        return shortenResponse.text().trim();
      }
      
      return connectionRequest;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate connection request: ${error.message}`);
    }
  }

  async rewriteMessage(draftMessage, conversationContext = null, targetProfile = null) {
    try {
      const prompt = this.buildMessageRewritePrompt(draftMessage, conversationContext, targetProfile);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const rewrittenText = response.text().trim();
      
      // Parse the response to extract multiple options
      const options = this.parseMessageOptions(rewrittenText);
      
      return {
        original: draftMessage,
        options: options
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to rewrite message: ${error.message}`);
    }
  }

  buildConnectionPrompt(targetProfile) {
    const { personName, currentTitle, currentCompany, headline, about } = targetProfile;
    
    return `You are helping me write a personalized LinkedIn connection request. Here's the context:

MY PROFILE:
- Name: ${this.personalProfile.name} (always address me as Venkat in the message)
- Role: ${this.personalProfile.currentRole}
- Experience: ${this.personalProfile.experience}
- Background: ${this.personalProfile.background}
- Motivation: ${this.personalProfile.motivation}

TARGET PERSON:
- Name: ${personName || 'Unknown'}
- Title: ${currentTitle || 'Unknown'}
- Company: ${currentCompany || 'Unknown'}
- Headline: ${headline || 'N/A'}
- About: ${about ? about.substring(0, 200) : 'N/A'}

REQUIREMENTS:
- Write a warm, genuine connection request under 300 characters
- Be specific to their role/company, avoid generic buzzwords
- Include a genuine hook or shared interest
- Professional but personable tone
- No hard asks, just connecting
- Focus on mutual value or shared interests in ML/tech
- Use details from my profile to make it specific (deep learning/computer vision, MLOps)

Write only the connection request message, nothing else.`;
  }

  buildMessageRewritePrompt(draftMessage, conversationContext, targetProfile) {
    let prompt = `You are helping me rewrite a LinkedIn message to be more professional and engaging.

ORIGINAL MESSAGE:
"${draftMessage}"

`;

    if (conversationContext && conversationContext.length > 0) {
      prompt += `CONVERSATION CONTEXT (recent messages):
${conversationContext.map(msg => `${msg.speaker}: ${msg.content}`).join('\n')}

`;
    }

    if (targetProfile) {
      prompt += `TARGET PERSON CONTEXT:
- Name: ${targetProfile.personName || 'Unknown'}
- Title: ${targetProfile.currentTitle || 'Unknown'}
- Company: ${targetProfile.currentCompany || 'Unknown'}

`;
    }

    prompt += `Please provide 2 rewritten versions:

1. PROFESSIONAL VERSION: More formal, concise, and business-focused
2. WARM VERSION: Friendly, conversational, but still professional

Format your response as:
PROFESSIONAL:
[rewritten message]

WARM:
[rewritten message]

Keep each version under 200 words and maintain the original intent while improving clarity and professionalism.`;

    return prompt;
  }

  parseMessageOptions(rewrittenText) {
    try {
      const options = [];
      
      // Try to parse structured response
      const professionalMatch = rewrittenText.match(/PROFESSIONAL:\s*([\s\S]*?)(?=WARM:|$)/i);
      const warmMatch = rewrittenText.match(/WARM:\s*([\s\S]*?)$/i);
      
      if (professionalMatch) {
        options.push({
          type: 'Professional',
          message: professionalMatch[1].trim()
        });
      }
      
      if (warmMatch) {
        options.push({
          type: 'Warm',
          message: warmMatch[1].trim()
        });
      }
      
      // Fallback if parsing fails
      if (options.length === 0) {
        options.push({
          type: 'Rewritten',
          message: rewrittenText
        });
      }
      
      return options;
    } catch (error) {
      console.error('Error parsing message options:', error);
      return [{
        type: 'Rewritten',
        message: rewrittenText
      }];
    }
  }

  updatePersonalProfile(profileData) {
    this.personalProfile = { ...this.personalProfile, ...profileData };
  }

  getPersonalProfile() {
    return this.personalProfile;
  }
}

module.exports = new GeminiService();