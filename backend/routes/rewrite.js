const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

router.post('/message', async (req, res) => {
  try {
    const { draftMessage, conversationContext, targetProfile } = req.body;

    if (!draftMessage || typeof draftMessage !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: draftMessage'
      });
    }

    if (draftMessage.trim().length === 0) {
      return res.status(400).json({
        error: 'Draft message cannot be empty'
      });
    }

    if (draftMessage.length > 2000) {
      return res.status(400).json({
        error: 'Draft message is too long (max 2000 characters)'
      });
    }

    // Validate conversation context if provided
    let validatedContext = null;
    if (conversationContext && Array.isArray(conversationContext)) {
      validatedContext = conversationContext
        .filter(msg => msg && msg.speaker && msg.content)
        .slice(-10) // Limit to last 10 messages
        .map(msg => ({
          speaker: String(msg.speaker).trim(),
          content: String(msg.content).trim().substring(0, 500), // Limit message length
          timestamp: msg.timestamp || new Date().toISOString()
        }));
    }

    // Generate rewritten message using Gemini
    const result = await geminiService.rewriteMessage(
      draftMessage.trim(),
      validatedContext,
      targetProfile
    );

    res.json({
      success: true,
      original: result.original,
      options: result.options,
      contextUsed: validatedContext ? validatedContext.length : 0,
      message: 'Message rewritten successfully'
    });

  } catch (error) {
    console.error('Message rewrite error:', error);
    res.status(500).json({
      error: 'Failed to rewrite message',
      message: error.message
    });
  }
});

// Generate contextual message
router.post('/contextual-message', async (req, res) => {
  try {
    const { personName, conversationHistory, context } = req.body;

    if (!personName || typeof personName !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: personName'
      });
    }

    // Validate conversation history if provided
    let validatedHistory = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      validatedHistory = conversationHistory
        .filter(msg => msg && msg.content)
        .slice(-15) // Limit to last 15 messages for context
        .map(msg => ({
          content: String(msg.content).trim().substring(0, 500),
          isSent: Boolean(msg.isSent),
          sender: msg.sender || (msg.isSent ? 'You' : personName),
          timestamp: msg.timestamp || new Date().toISOString()
        }));
    }

    // Generate contextual message using Gemini
    const result = await geminiService.generateContextualMessage(
      personName.trim(),
      validatedHistory,
      context || 'professional_networking'
    );

    res.json({
      success: true,
      message: result.message,
      context: result.context,
      tone: result.tone,
      conversationLength: validatedHistory.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Contextual message generation error:', error);
    res.status(500).json({
      error: 'Failed to generate contextual message',
      message: error.message
    });
  }
});

// Health check for rewrite service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'message-rewrite',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;