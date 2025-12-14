const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Enhanced list of toxic words and patterns
const TOXIC_PATTERNS = {
  // Hate speech
  hateSpeech: [
    'hate', 'kill', 'die', 'attack', 'exterminate', 'destroy',
    'annihilate', 'eliminate', 'remove', 'purge', 'cleanse',
    'genocide', 'holocaust', 'ethnic cleansing', 'racial slur',
    'sexist slur', 'homophobic slur', 'transphobic slur', 'ableist slur'
  ],
  
  // Harassment and bullying
  harassment: [
    'stupid', 'idiot', 'moron', 'retard', 'dumb', 'ugly', 'fat', 'lazy',
    'worthless', 'useless', 'pathetic', 'loser', 'failure', 'disgusting',
    'trash', 'garbage', 'scum', 'pig', 'animal', 'monster', 'freak',
    'coward', 'liar', 'cheater', 'fraud', 'fake', 'phony', 'hypocrite'
  ],
  
  // Threats and violence
  threats: [
    'kill you', 'hurt you', 'beat you', 'punch you', 'hit you',
    'shoot you', 'stab you', 'cut you', 'harm you', 'destroy you',
    'ruin you', 'end you', 'finish you', 'take you out', 'get you',
    'come after you', 'hunt you', 'find you', 'track you', 'stalk you'
  ],
  
  // Sexual harassment
  sexualHarassment: [
    'sexy', 'hot', 'beautiful', 'gorgeous', 'attractive', 'cute', 'handsome'
  ]
};

// Mock moderation function for when API key is not provided
const mockModeration = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      isToxic: false,
      confidence: 0,
      reasons: [],
      moderationId: `mock-${uuidv4()}`,
      timestamp: new Date().toISOString()
    };
  }

  const lowerText = text.toLowerCase();
  const reasons = [];
  let confidence = 0;
  
  // Check each category of toxic content
  for (const [category, words] of Object.entries(TOXIC_PATTERNS)) {
    for (const word of words) {
      if (lowerText.includes(word.toLowerCase())) {
        reasons.push(`Contains ${category.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        confidence = Math.max(confidence, 0.7); // Increase confidence for each match
      }
    }
  }
  
  // Check for excessive caps and special characters (potential yelling or obfuscation)
  const capsRatio = (text.replace(/[^A-Z]/g, '').length / text.length) || 0;
  if (capsRatio > 0.5) {
    reasons.push('Excessive use of capital letters (perceived as yelling)');
    confidence = Math.max(confidence, 0.6);
  }
  
  // Check for excessive special characters
  const specialCharRatio = (text.replace(/[a-zA-Z0-9\s]/g, '').length / text.length) || 0;
  if (specialCharRatio > 0.3) {
    reasons.push('Excessive use of special characters');
    confidence = Math.max(confidence, 0.5);
  }
  
  return {
    isToxic: reasons.length > 0,
    confidence: Math.min(confidence, 0.95), // Cap confidence for mock
    reasons: [...new Set(reasons)], // Remove duplicates
    moderationId: `mock-${uuidv4()}`,
    timestamp: new Date().toISOString()
  };
};

// Real moderation using Perspective API
const realModeration = async (text) => {
  if (!process.env.MODERATION_API_KEY) {
    console.warn('MODERATION_API_KEY not set, falling back to mock moderation');
    return mockModeration(text);
  }

  try {
    const response = await axios.post(
      'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
      {
        comment: { 
          text,
          type: 'PLAIN_TEXT'
        },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
          SEXUALLY_EXPLICIT: {},
          FLIRTATION: {}
        },
        doNotStore: true, // Don't store the content on Google's servers
        languages: ['en'],
        clientToken: `client-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
        communityId: 'campus-connect',
        requestedLanguages: ['en']
      },
      {
        params: {
          key: process.env.MODERATION_API_KEY
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0'
        },
        timeout: 5000 // 5 second timeout
      }
    );

    const attributes = response.data.attributeScores || {};
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

/**
 * Enhanced moderation middleware that checks both text and image content
 */
const moderationMiddleware = async (req, res, next) => {
  // Skip moderation for admin users
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const { text, imageUrl } = req.body;
  const moderationResults = {
    text: { isToxic: false },
    image: { isToxic: false },
    timestamp: new Date().toISOString(),
    moderationId: `mod-${uuidv4()}`
  };

  try {
    // Check text content if it exists
    if (text && typeof text === 'string' && text.trim().length > 0) {
      const textResult = process.env.MODERATION_API_KEY 
        ? await realModeration(text)
        : mockModeration(text);
      
      moderationResults.text = {
        ...textResult,
        content: text.length > 100 ? text.substring(0, 100) + '...' : text
      };
    }

    // Check image content if it exists (basic check for now)
    if (req.file || imageUrl) {
      // In a real implementation, you would use an image moderation API here
      // For now, we'll just log that image moderation would happen
      moderationResults.image = {
        isToxic: false,
        confidence: 0,
        reasons: [],
        note: 'Image moderation would be implemented here',
        moderationId: `img-${uuidv4()}`
      };
    }

    // Check if any content was flagged
    const isContentFlagged = moderationResults.text.isToxic || moderationResults.image.isToxic;
    
    if (isContentFlagged) {
      // Log moderation event for review
      console.log('Content moderation flagged:', JSON.stringify({
        moderationId: moderationResults.moderationId,
        userId: req.user?._id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        results: moderationResults
      }, null, 2));

      // Prepare user-friendly error message
      const reasons = [
        ...(moderationResults.text.reasons || []),
        ...(moderationResults.image.reasons || [])
      ];

      return res.status(400).json({
        success: false,
        message: 'Content moderation alert',
        error: {
          code: 'CONTENT_MODERATION_FAILED',
          message: 'Your content was flagged by our moderation system',
          reasons: reasons.length > 0 ? reasons : ['Content does not meet community guidelines'],
          confidence: Math.max(
            moderationResults.text.confidence || 0,
            moderationResults.image.confidence || 0
          ),
          moderationId: moderationResults.moderationId,
          isAppealable: true,
          timestamp: moderationResults.timestamp,
          help: 'Please review our community guidelines and try again. If you believe this is a mistake, you can appeal this decision.'
        }
      });
    }

    // Attach moderation results to the request for logging
    req.moderationResults = moderationResults;
    next();
  } catch (error) {
    console.error('Moderation error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
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




