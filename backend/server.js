const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));


const sessions = new Map();
const conversationHistory = new Map();

const faqData = [
  {
    category: 'Account',
    questions: [
      { q: 'how to reset password', a: 'To reset your password, go to Settings > Security > Reset Password. You\'ll receive a verification code via email.' },
      { q: 'change email address', a: 'You can update your email in Settings > Profile > Contact Information. Verify your new email to complete the change.' },
      { q: 'delete account', a: 'To delete your account, go to Settings > Privacy > Delete Account. Note: This action is permanent and cannot be undone.' }
    ]
  },
  {
    category: 'Billing',
    questions: [
      { q: 'payment methods', a: 'We accept credit cards (Visa, Mastercard, AmEx), PayPal, and bank transfers. You can manage payment methods in Billing > Payment Options.' },
      { q: 'refund policy', a: 'Refunds are available within 30 days of purchase. Go to Billing > Order History > Request Refund. Processing takes 5-7 business days.' },
      { q: 'invoice download', a: 'Download invoices from Billing > Invoices. Select the period and click Download PDF.' }
    ]
  },
  {
    category: 'Technical',
    questions: [
      { q: 'app not working', a: 'Try these steps: 1) Clear browser cache, 2) Update to latest version, 3) Disable browser extensions, 4) Try incognito mode.' },
      { q: 'slow performance', a: 'Performance issues can be caused by: network connectivity, outdated browser, too many open tabs. Try closing unused tabs and restarting your browser.' },
      { q: 'login error', a: 'If you see a login error: 1) Check your credentials, 2) Clear cookies, 3) Reset password if needed, 4) Contact support if issue persists.' }
    ]
  },
  {
    category: 'Features',
    questions: [
      { q: 'export data', a: 'Export your data from Settings > Data Management > Export. Choose format (CSV, JSON, PDF) and select date range.' },
      { q: 'integrate api', a: 'API integration: Get your API key from Developer > API Keys. View documentation at docs.example.com/api for implementation guide.' },
      { q: 'mobile app', a: 'Our mobile app is available on iOS App Store and Google Play Store. Download and login with your existing credentials.' }
    ]
  }
];
const sentimentKeywords = {
  frustrated: ['frustrated', 'angry', 'upset', 'annoyed', 'terrible', 'worst', 'hate', 'sick of', 'ridiculous'],
  urgent: ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now', 'quickly'],
  confused: ['confused', 'don\'t understand', 'unclear', 'not sure', 'help', 'lost'],
  satisfied: ['thanks', 'thank you', 'great', 'perfect', 'excellent', 'wonderful', 'solved']
};

function analyzeSentiment(message) {
  const lowerMsg = message.toLowerCase();
  const sentiment = {
    score: 0,
    emotions: [],
    escalationRisk: 'low'
  };

  for (const [emotion, keywords] of Object.entries(sentimentKeywords)) {
    const matchCount = keywords.filter(kw => lowerMsg.includes(kw)).length;
    if (matchCount > 0) {
      sentiment.emotions.push(emotion);
      if (emotion === 'frustrated') sentiment.score -= matchCount * 2;
      if (emotion === 'urgent') sentiment.score -= matchCount;
      if (emotion === 'confused') sentiment.score -= matchCount * 0.5;
      if (emotion === 'satisfied') sentiment.score += matchCount * 2;
    }
  }

  
  if (sentiment.score <= -3) sentiment.escalationRisk = 'high';
  else if (sentiment.score <= -1) sentiment.escalationRisk = 'medium';

  return sentiment;
}


function findFAQMatch(query) {
  const lowerQuery = query.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  faqData.forEach(category => {
    category.questions.forEach(faq => {
      const keywords = faq.q.split(' ');
      const matchScore = keywords.filter(kw => lowerQuery.includes(kw)).length;

      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestMatch = { ...faq, category: category.category, confidence: matchScore };
      }
    });
  });

  return highestScore >= 2 ? bestMatch : null;
}


function generateContextualResponse(sessionId, query, faqMatch, sentiment) {
  const history = conversationHistory.get(sessionId) || [];

  let response = {
    message: '',
    faqMatch: faqMatch ? true : false,
    category: faqMatch?.category || 'general',
    confidence: faqMatch?.confidence || 0,
    sentiment: sentiment,
    suggestedActions: []
  };

  if (faqMatch) {
    response.message = faqMatch.a;

    
    if (history.length > 2 && sentiment.escalationRisk !== 'low') {
      response.message += '\n\nI notice you\'ve been experiencing some difficulties. Would you like me to connect you with a human agent for personalized assistance?';
      response.suggestedActions.push('escalate_to_human');
    }
  } else {
    response.message = 'I apologize, but I couldn\'t find a specific answer to your question in our FAQ database.';
    response.suggestedActions.push('escalate_to_human', 'browse_faqs');
  }

  
  if (sentiment.emotions.includes('frustrated') && sentiment.escalationRisk === 'high') {
    response.message = '⚠️ I understand you\'re frustrated, and I sincerely apologize for the inconvenience. ' + response.message;
    response.message += '\n\n🎯 Priority Support: I\'m escalating your case to our senior support team. Expected response time: 5-10 minutes.';
    response.suggestedActions.unshift('priority_escalation');
  } else if (sentiment.emotions.includes('urgent')) {
    response.message = '⏰ I see this is urgent. ' + response.message;
  } else if (sentiment.emotions.includes('confused')) {
    response.message += '\n\nWould you like me to break this down into simpler steps?';
    response.suggestedActions.push('detailed_guide');
  }

  return response;
}




app.post('/api/session/init', (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    id: sessionId,
    startTime: Date.now(),
    messageCount: 0,
    escalated: false
  });
  conversationHistory.set(sessionId, []);

  res.json({
    sessionId,
    message: 'Welcome! I\'m your AI support assistant. How can I help you today?'
  });
});


app.post('/api/chat/message', (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found. Please initialize a new session.' });
  }

  const session = sessions.get(sessionId);
  const history = conversationHistory.get(sessionId);


  const sentiment = analyzeSentiment(message);

  
  const faqMatch = findFAQMatch(message);

  
  const response = generateContextualResponse(sessionId, message, faqMatch, sentiment);

  
  history.push({
    role: 'user',
    message,
    timestamp: Date.now(),
    sentiment
  });
  history.push({
    role: 'assistant',
    message: response.message,
    timestamp: Date.now()
  });

  
  session.messageCount++;
  if (response.suggestedActions.includes('priority_escalation')) {
    session.escalated = true;
  }

  res.json({
    response: response.message,
    metadata: {
      faqMatched: response.faqMatch,
      category: response.category,
      confidence: response.confidence,
      sentiment: sentiment,
      escalationRisk: sentiment.escalationRisk,
      suggestedActions: response.suggestedActions
    }
  });
});


app.get('/api/session/:sessionId/history', (req, res) => {
  const { sessionId } = req.params;

  if (!conversationHistory.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    history: conversationHistory.get(sessionId),
    session: sessions.get(sessionId)
  });
});


app.post('/api/escalate', (req, res) => {
  const { sessionId, reason } = req.body;

  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions.get(sessionId);
  session.escalated = true;
  session.escalationReason = reason;
  session.escalationTime = Date.now();


  const ticketId = `TICKET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  res.json({
    escalated: true,
    ticketId,
    message: 'Your case has been escalated to a human agent. Ticket ID: ' + ticketId,
    estimatedWaitTime: '5-10 minutes'
  });
});


app.get('/api/faqs', (req, res) => {
  res.json({ faqs: faqData });
});


app.post('/api/session/:sessionId/summary', (req, res) => {
  const { sessionId } = req.params;

  if (!conversationHistory.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const history = conversationHistory.get(sessionId);
  const session = sessions.get(sessionId);

  
  const userMessages = history.filter(h => h.role === 'user');
  const categories = [...new Set(userMessages.map(m => findFAQMatch(m.message)?.category).filter(Boolean))];

  const summary = {
    sessionId,
    duration: Date.now() - session.startTime,
    messageCount: session.messageCount,
    topicsDiscussed: categories,
    escalated: session.escalated,
    overallSentiment: userMessages.reduce((acc, m) => acc + (m.sentiment?.score || 0), 0) / userMessages.length,
    summary: `Customer inquired about ${categories.join(', ') || 'general support'}. ${session.escalated ? 'Case was escalated to human support.' : 'Issue resolved via FAQ.'}`
  };

  res.json(summary);
});


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    activeSessions: sessions.size,
    timestamp: Date.now()
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 AI Customer Support Bot running on port ${PORT}`);
//   console.log(`📊 Features: Sentiment Analysis, Contextual Memory, Smart Escalation`);
// });

module.exports = app; // Add this line for Vercel