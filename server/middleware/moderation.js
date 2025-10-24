const axios = require('axios');

// Mock moderation function for when API key is not provided
const mockModeration = (text) => {
  const toxicWords = ['hate', 'stupid', 'idiot', 'dumb', 'kill', 'die', 'hate you'];
  const lowerText = text.toLowerCase();
  
  for (const word of toxicWords) {
    if (lowerText.includes(word)) {
      return {
        isToxic: true,
        confidence: 0.8,
        reason: 'Contains potentially offensive language'
      };
    }
  }
  
  return {
    isToxic: false,
    confidence: 0.1,
    reason: null
  };
};

// Real moderation using Perspective API or similar service
const realModeration = async (text) => {
  try {
    const response = await axios.post(
      'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
      {
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        },
        languages: ['en']
      },
      {
        params: {
          key: process.env.MODERATION_API_KEY
        }
      }
    );

    const attributes = response.data.attributeScores;
    const toxicityScore = attributes.TOXICITY?.summaryScore?.value || 0;
    const severeToxicityScore = attributes.SEVERE_TOXICITY?.summaryScore?.value || 0;
    const identityAttackScore = attributes.IDENTITY_ATTACK?.summaryScore?.value || 0;
    const insultScore = attributes.INSULT?.summaryScore?.value || 0;
    const profanityScore = attributes.PROFANITY?.summaryScore?.value || 0;
    const threatScore = attributes.THREAT?.summaryScore?.value || 0;

    const maxScore = Math.max(
      toxicityScore,
      severeToxicityScore,
      identityAttackScore,
      insultScore,
      profanityScore,
      threatScore
    );

    const isToxic = maxScore > 0.7;
    let reason = null;

    if (isToxic) {
      if (severeToxicityScore > 0.7) reason = 'Severe toxicity detected';
      else if (identityAttackScore > 0.7) reason = 'Identity attack detected';
      else if (threatScore > 0.7) reason = 'Threat detected';
      else if (insultScore > 0.7) reason = 'Insult detected';
      else if (profanityScore > 0.7) reason = 'Profanity detected';
      else reason = 'Toxic content detected';
    }

    return {
      isToxic,
      confidence: maxScore,
      reason
    };
  } catch (error) {
    console.error('Moderation API error:', error.message);
    // Fallback to mock moderation if API fails
    return mockModeration(text);
  }
};

const moderationMiddleware = async (req, res, next) => {
  try {
    const text = req.body.text;
    
    if (!text || typeof text !== 'string') {
      return next();
    }

    // Use real moderation if API key is provided, otherwise use mock
    const moderationResult = process.env.MODERATION_API_KEY && 
                           process.env.MODERATION_API_KEY !== 'your_moderation_api_key_here'
      ? await realModeration(text)
      : mockModeration(text);

    if (moderationResult.isToxic) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Post blocked by AI moderation for violating community guidelines.',
        moderationReason: moderationResult.reason,
        confidence: moderationResult.confidence
      });
    }

    // Add moderation info to request for logging
    req.moderationInfo = {
      checked: true,
      isToxic: false,
      confidence: moderationResult.confidence
    };

    next();
  } catch (error) {
    console.error('Moderation middleware error:', error);
    // If moderation fails, allow the post but log the error
    req.moderationInfo = {
      checked: false,
      error: error.message
    };
    next();
  }
};

module.exports = moderationMiddleware;




