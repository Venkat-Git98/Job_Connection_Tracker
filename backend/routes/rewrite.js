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