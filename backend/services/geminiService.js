const { GoogleGenerativeAI } = require('@google/generative-ai');
const profileService = require('./profileService');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' 
    });
    
    // Get user profile from profile service
    this.userProfile = profileService.getProfile();
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

  async generateContextualMessage(personName, conversationHistory = [], context = 'professional_networking') {
    try {
      const prompt = this.buildContextualMessagePrompt(personName, conversationHistory, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text().trim();
      
      // Parse the response to extract message and metadata
      const parsedResult = this.parseContextualMessage(generatedText);
      
      return {
        message: parsedResult.message,
        context: parsedResult.context || context,
        tone: parsedResult.tone || 'professional',
        reasoning: parsedResult.reasoning || 'Generated based on conversation context'
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate contextual message: ${error.message}`);
    }
  }

  buildConnectionPrompt(targetProfile) {
    const { personName, currentTitle, currentCompany, headline, about, location } = targetProfile;
    const profile = this.userProfile;
    
    // Get contextually relevant information
    const targetContext = `${currentTitle} ${currentCompany} ${headline} ${about}`.toLowerCase();
    const connectionStrategy = profileService.getConnectionStrategy(currentCompany, currentTitle, null);
    const relevantSkills = profileService.getRelevantSkills(targetContext);
    const relevantAchievements = profileService.getRelevantAchievements(targetContext);
    
    return `You are helping Venkat write a highly personalized LinkedIn connection request. Analyze the target person's profile deeply and create a connection that shows genuine interest and relevant expertise.

VENKAT'S PROFILE:
- Name: Venkat (${profile.personalInfo.fullName}) - always use "Venkat" in messages
- Role: ${profile.professional.currentRole}
- Experience: ${profile.professional.experience}
- Core Expertise: ${profile.professional.specializations.slice(0, 3).join(', ')}
- Most Relevant Skills for this connection: ${relevantSkills.join(', ')}
- Background: ${profile.personal.motivation}
- Key Achievements: ${relevantAchievements.join('; ')}
- Industry Focus: ${profile.professional.industries.join(', ')}
- Connection Strategy: ${connectionStrategy}

TARGET PERSON ANALYSIS:
- Name: ${personName || 'Unknown'}
- Title: ${currentTitle || 'Unknown'}
- Company: ${currentCompany || 'Unknown'}
- Location: ${location || 'N/A'}
- Headline: ${headline || 'N/A'}
- About: ${about ? about.substring(0, 300) : 'N/A'}

DEEP PERSONALIZATION REQUIREMENTS:
1. Research their company's mission/work and connect it to Venkat's ML/CV expertise
2. Find specific overlaps between their role and Venkat's specializations
3. Reference something concrete from their profile (company's tech stack, recent initiatives, industry challenges)
4. Show genuine curiosity about their work and how Venkat's experience might be relevant
5. Use the connection strategy to tailor the approach appropriately
6. Keep under 300 characters but make every word meaningful
7. Professional yet warm tone - peer-to-peer, not pitching or job seeking
8. Include a subtle hook that invites conversation

AVOID:
- Generic networking language ("expand my network", "like-minded professionals")
- Sales-y or promotional tone
- Job searching implications
- Vague compliments without substance
- Overuse of buzzwords

Write a connection request that demonstrates Venkat has researched their work and has genuinely relevant expertise to share. Focus on mutual professional value and authentic interest.

Write only the connection request message, nothing else.`;
  }

  buildMessageRewritePrompt(draftMessage, conversationContext, targetProfile) {
    const profile = this.userProfile;
    const targetContext = targetProfile ? 
      `${targetProfile.currentTitle} ${targetProfile.currentCompany} ${targetProfile.headline}`.toLowerCase() : '';
    const relevantSkills = profileService.getRelevantSkills(targetContext);
    
    let prompt = `You are helping Venkat rewrite a LinkedIn message to be more professional and engaging, incorporating his ML engineering expertise naturally.

VENKAT'S CONTEXT:
- Name: Venkat (${profile.personalInfo.fullName}) - always use "Venkat"
- Role: ${profile.professional.currentRole}
- Experience: ${profile.professional.experience}
- Core Expertise: ${profile.professional.specializations.slice(0, 2).join(', ')}
- Relevant Skills: ${relevantSkills.join(', ')}
- Communication Style: ${profile.communication.tone}
- Values: ${profile.personal.values.slice(0, 3).join(', ')}

ORIGINAL MESSAGE:
"${draftMessage}"

`;

    if (conversationContext && conversationContext.length > 0) {
      prompt += `CONVERSATION CONTEXT (recent messages):
${conversationContext.map(msg => `${msg.speaker}: ${msg.content}`).join('\n')}

`;
    }

    if (targetProfile) {
      const connectionStrategy = profileService.getConnectionStrategy(
        targetProfile.currentCompany, 
        targetProfile.currentTitle, 
        null
      );
      
      prompt += `TARGET PERSON CONTEXT:
- Name: ${targetProfile.personName || 'Unknown'}
- Title: ${targetProfile.currentTitle || 'Unknown'}
- Company: ${targetProfile.currentCompany || 'Unknown'}
- Background: ${targetProfile.headline || 'N/A'}
- Connection Strategy: ${connectionStrategy}

`;
    }

    prompt += `Please provide 2 rewritten versions that naturally incorporate Venkat's expertise:

1. PROFESSIONAL VERSION: Formal, concise, business-focused with subtle technical credibility
2. WARM VERSION: Friendly, conversational but professional, showing genuine interest and relevant experience

REQUIREMENTS:
- Always use "Venkat" as the name (never "I" or other names)
- Naturally weave in relevant ML/AI expertise where it adds value
- Show authentic interest in their work/company based on Venkat's background
- Maintain the original intent while dramatically improving clarity and impact
- Make it feel personal, researched, and thoughtful - not templated
- Keep each version under 200 words
- Use Venkat's communication style: professional yet approachable
- If appropriate, reference how Venkat's experience relates to their work

Format your response as:
PROFESSIONAL:
[rewritten message]

WARM:
[rewritten message]`;

    return prompt;
  }

  buildContextualMessagePrompt(personName, conversationHistory, context) {
    const profile = this.userProfile;
    
    // Analyze conversation history for context
    const conversationAnalysis = this.analyzeConversationHistory(conversationHistory);
    
    let prompt = `You are helping Venkat craft a thoughtful LinkedIn message based on conversation history and context.

VENKAT'S PROFILE:
- Name: Venkat (${profile.personalInfo.fullName}) - always use "Venkat"
- Role: ${profile.professional.currentRole}
- Experience: ${profile.professional.experience}
- Core Expertise: ${profile.professional.specializations.slice(0, 3).join(', ')}
- Communication Style: ${profile.communication.tone}
- Values: ${profile.personal.values.slice(0, 3).join(', ')}
- Background: ${profile.personal.motivation}

CONVERSATION CONTEXT:
- Person: ${personName}
- Context Type: ${context}
- Conversation Analysis: ${conversationAnalysis.summary}
- Last Message Tone: ${conversationAnalysis.lastTone}
- Conversation Stage: ${conversationAnalysis.stage}
- Key Topics Discussed: ${conversationAnalysis.topics.join(', ')}

`;

    if (conversationHistory.length > 0) {
      prompt += `RECENT CONVERSATION HISTORY:
${conversationHistory.slice(-8).map(msg => 
  `${msg.isSent ? 'Venkat' : personName}: ${msg.content}`
).join('\n')}

`;
    }

    prompt += `TASK: Generate a contextually appropriate message that:

1. ACKNOWLEDGES the conversation flow naturally
2. SHOWS Venkat has been engaged and listening
3. ADDS VALUE through relevant insights or questions
4. MAINTAINS appropriate professional relationship tone
5. INCORPORATES Venkat's expertise where naturally relevant
6. MOVES the conversation forward meaningfully

CONTEXT-SPECIFIC GUIDELINES:
${this.getContextGuidelines(context, conversationAnalysis)}

REQUIREMENTS:
- Use "Venkat" as the name (never "I" or other names)
- Keep under 150 words for LinkedIn messaging
- Match the established conversation tone
- Be authentic and conversational, not robotic
- Reference specific points from recent messages when appropriate
- Show genuine interest and professional curiosity
- End with a natural conversation starter or question when appropriate

Generate only the message text, nothing else.`;

    return prompt;
  }

  analyzeConversationHistory(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return {
        summary: 'No previous conversation',
        lastTone: 'neutral',
        stage: 'initial',
        topics: []
      };
    }

    const recentMessages = conversationHistory.slice(-5);
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    
    // Extract topics (simple keyword extraction)
    const allText = conversationHistory.map(msg => msg.content).join(' ').toLowerCase();
    const topics = [];
    
    // Common professional topics
    const topicKeywords = {
      'technology': ['tech', 'software', 'ai', 'ml', 'data', 'engineering', 'development'],
      'career': ['job', 'career', 'role', 'position', 'opportunity', 'experience'],
      'business': ['company', 'business', 'startup', 'growth', 'strategy', 'market'],
      'collaboration': ['project', 'team', 'collaboration', 'partnership', 'work together'],
      'learning': ['learn', 'course', 'skill', 'knowledge', 'education', 'training']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.push(topic);
      }
    }

    // Determine conversation stage
    let stage = 'initial';
    if (conversationHistory.length > 10) stage = 'ongoing';
    if (conversationHistory.length > 20) stage = 'established';

    // Analyze last message tone
    const lastContent = lastMessage.content.toLowerCase();
    let lastTone = 'neutral';
    
    if (lastContent.includes('?')) lastTone = 'inquisitive';
    if (lastContent.includes('thank') || lastContent.includes('appreciate')) lastTone = 'grateful';
    if (lastContent.includes('excited') || lastContent.includes('great') || lastContent.includes('awesome')) lastTone = 'enthusiastic';
    if (lastContent.includes('sorry') || lastContent.includes('apologize')) lastTone = 'apologetic';

    return {
      summary: `${conversationHistory.length} message conversation, ${stage} stage`,
      lastTone,
      stage,
      topics: topics.slice(0, 3) // Limit to top 3 topics
    };
  }

  getContextGuidelines(context, conversationAnalysis) {
    const guidelines = {
      'professional_networking': `
- Focus on building professional relationship
- Share relevant industry insights or experiences
- Ask thoughtful questions about their work
- Offer value through Venkat's ML/AI expertise when relevant`,
      
      'follow_up': `
- Reference previous conversation points specifically
- Provide updates or answers to previous questions
- Show continued interest in their work or projects
- Suggest next steps or concrete actions`,
      
      'collaboration': `
- Discuss potential synergies between your expertise
- Propose specific ways to work together
- Share relevant project experiences
- Ask about their current challenges where Venkat might help`,
      
      'casual_check_in': `
- Keep tone warm but professional
- Ask about recent developments in their work
- Share brief updates about Venkat's projects
- Maintain relationship without being overly formal`
    };

    return guidelines[context] || guidelines['professional_networking'];
  }

  parseContextualMessage(generatedText) {
    try {
      // For now, return the generated text as the message
      // In the future, we could parse structured responses with metadata
      return {
        message: generatedText.trim(),
        context: 'professional',
        tone: 'conversational',
        reasoning: 'Generated based on conversation context and Venkat\'s profile'
      };
    } catch (error) {
      console.error('Error parsing contextual message:', error);
      return {
        message: generatedText.trim(),
        context: 'professional',
        tone: 'neutral',
        reasoning: 'Fallback parsing'
      };
    }
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
    profileService.updateProfile(profileData);
    this.userProfile = profileService.getProfile();
  }

  getPersonalProfile() {
    return this.userProfile;
  }
}

module.exports = new GeminiService();