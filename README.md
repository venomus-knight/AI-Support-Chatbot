# AI Customer Support Bot

An intelligent customer support chatbot with sentiment analysis, contextual memory, and smart escalation capabilities. Built with Node.js, Express, and vanilla JavaScript.

![AI Support Bot](https://img.shields.io/badge/Node.js-20.x-green) ![Express](https://img.shields.io/badge/Express-4.21-blue) ![License](https://img.shields.io/badge/License-ISC-yellow)

## Features

- **Sentiment Analysis** - Automatically detects customer emotions (frustrated, urgent, confused, satisfied)
- **Smart Escalation** - Escalates high-risk conversations to human agents automatically
- **FAQ Matching** - Keyword-based matching against a comprehensive FAQ database
- **Session Management** - Tracks conversation history per session using UUID
- **Contextual Memory** - Maintains conversation context across multiple messages
- **Real-time Chat Interface** - Beautiful, responsive chat UI with typing indicators
- **Risk Assessment** - Evaluates escalation risk (low, medium, high) based on sentiment

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-support-bot.git
cd ai-support-bot
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
cd js/ai_support_bot/backend
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
.
├── js/
│   └── ai_support_bot/
│       ├── backend/
│       │   ├── server.js          # Express server with API endpoints
│       │   └── package.json       # Backend dependencies
│       └── frontend/
│           └── index.html         # Chat interface (HTML/CSS/JS)
├── package.json                   # Root package configuration
└── README.md                      # This file
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Initialize Session
Create a new chat session.

**Endpoint:** `POST /api/session/init`

**Response:**
```json
{
  "sessionId": "uuid-v4-string",
  "message": "Welcome! I'm your AI support assistant. How can I help you today?"
}
```

#### 2. Send Message
Send a user message and receive an AI response.

**Endpoint:** `POST /api/chat/message`

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "message": "How do I reset my password?"
}
```

**Response:**
```json
{
  "response": "To reset your password, go to Settings > Security > Reset Password...",
  "metadata": {
    "faqMatched": true,
    "category": "Account",
    "confidence": 3,
    "sentiment": {
      "score": 0,
      "emotions": [],
      "escalationRisk": "low"
    },
    "escalationRisk": "low",
    "suggestedActions": []
  }
}
```

#### 3. Get Conversation History
Retrieve the full conversation history for a session.

**Endpoint:** `GET /api/session/:sessionId/history`

**Response:**
```json
{
  "history": [
    {
      "role": "user",
      "message": "How do I reset my password?",
      "timestamp": 1697389200000,
      "sentiment": { "score": 0, "emotions": [], "escalationRisk": "low" }
    },
    {
      "role": "assistant",
      "message": "To reset your password...",
      "timestamp": 1697389201000
    }
  ],
  "session": {
    "id": "uuid-v4-string",
    "startTime": 1697389100000,
    "messageCount": 2,
    "escalated": false
  }
}
```

#### 4. Escalate to Human
Escalate the conversation to a human agent.

**Endpoint:** `POST /api/escalate`

**Request Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "reason": "priority_escalation"
}
```

**Response:**
```json
{
  "escalated": true,
  "ticketId": "TICKET-ABC123XYZ",
  "message": "Your case has been escalated to a human agent. Ticket ID: TICKET-ABC123XYZ",
  "estimatedWaitTime": "5-10 minutes"
}
```

#### 5. Get All FAQs
Retrieve all available FAQs.

**Endpoint:** `GET /api/faqs`

**Response:**
```json
{
  "faqs": [
    {
      "category": "Account",
      "questions": [
        { "q": "how to reset password", "a": "To reset your password..." }
      ]
    }
  ]
}
```

#### 6. Generate Conversation Summary
Get an AI-generated summary of the conversation.

**Endpoint:** `POST /api/session/:sessionId/summary`

**Response:**
```json
{
  "sessionId": "uuid-v4-string",
  "duration": 300000,
  "messageCount": 5,
  "topicsDiscussed": ["Account", "Billing"],
  "escalated": false,
  "overallSentiment": -0.5,
  "summary": "Customer inquired about Account, Billing. Issue resolved via FAQ."
}
```

#### 7. Health Check
Check server status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "activeSessions": 3,
  "timestamp": 1697389200000
}
```

## Sentiment Analysis System

### Sentiment Keywords

The bot analyzes messages using predefined keyword categories:

| Emotion | Keywords | Impact |
|---------|----------|--------|
| **Frustrated** | frustrated, angry, upset, annoyed, terrible, worst, hate, sick of, ridiculous | -2 per keyword |
| **Urgent** | urgent, asap, immediately, emergency, critical, now, quickly | -1 per keyword |
| **Confused** | confused, don't understand, unclear, not sure, help, lost | -0.5 per keyword |
| **Satisfied** | thanks, thank you, great, perfect, excellent, wonderful, solved | +2 per keyword |

### Escalation Risk Levels

- **Low Risk** (score > -1): Standard support flow
- **Medium Risk** (score -3 to -1): Offer additional assistance
- **High Risk** (score ≤ -3): Auto-escalate to human agent

### Example Prompts & Responses

#### Example 1: Password Reset (Low Risk)
**User Prompt:** "How do I reset my password?"

**Bot Response:**
```
To reset your password, go to Settings > Security > Reset Password. 
You'll receive a verification code via email.
```
- Category: Account
- Sentiment: Low Risk
- FAQ Matched: Yes

#### Example 2: Frustrated User (High Risk)
**User Prompt:** "This is ridiculous! I'm so frustrated, I need help immediately!"

**Bot Response:**
```
⚠️ I understand you're frustrated, and I sincerely apologize for the inconvenience. 
[FAQ Answer]

🎯 Priority Support: I'm escalating your case to our senior support team. 
Expected response time: 5-10 minutes.
```
- Sentiment: High Risk (frustrated + urgent keywords)
- Suggested Action: Priority Escalation

#### Example 3: Confused User (Medium Risk)
**User Prompt:** "I'm confused about the billing process, I don't understand"

**Bot Response:**
```
[FAQ Answer about billing]

Would you like me to break this down into simpler steps?
```
- Sentiment: Medium Risk (confused keywords)
- Suggested Action: Detailed Guide

## FAQ Database

### Categories

1. **Account**
   - Password reset
   - Email address change
   - Account deletion

2. **Billing**
   - Payment methods
   - Refund policy
   - Invoice download

3. **Technical**
   - App not working
   - Slow performance
   - Login errors

4. **Features**
   - Data export
   - API integration
   - Mobile app

## Frontend Features

### Quick Actions
Pre-configured buttons for common queries:
- Reset Password
- Billing Help
- Technical Issue
- Export Data

### Visual Indicators
- **Typing Indicator**: Shows when bot is processing
- **Sentiment Badges**: Display risk level on user messages
- **Suggested Actions**: Interactive buttons for next steps
- **Status Indicator**: Shows bot online status

### Auto-Escalation Flow
1. Bot detects high-risk sentiment
2. Displays priority escalation message
3. Generates unique ticket ID
4. Provides estimated wait time

## Technologies Used

### Backend
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **UUID** - Session ID generation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Fetch API** - HTTP requests
- **CSS3** - Animations and styling

## Development

### Run in Development Mode
```bash
cd js/ai_support_bot/backend
npm run dev  # Uses nodemon for auto-reload
```

### Testing
```bash
npm test
```

### Environment Variables
```bash
PORT=5000  # Server port (default: 5000)
```

## Configuration

### Server Settings
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### CORS Configuration
```javascript
app.use(cors());  // Allows all origins
```

## Deployment

### Replit Deployment
The app is configured to run on Replit with:
- Port: 5000 (required)
- Host: 0.0.0.0 (external access)
- Static files served from backend

### Production Considerations
1. **Database**: Replace in-memory storage with PostgreSQL/Redis
2. **Authentication**: Add user authentication for escalation system
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Logging**: Add structured logging (Winston, Pino)
5. **Monitoring**: Set up health checks and uptime monitoring
6. **Caching**: Implement response caching for FAQs

## Limitations

- **In-Memory Storage**: Sessions and history are lost on server restart
- **No Persistence**: Conversation history is not saved to a database
- **Single Server**: Not suitable for horizontal scaling
- **Basic FAQ Matching**: Uses keyword matching (no NLP/ML)

## Future Enhancements

- [ ] Integration with OpenAI for natural language understanding
- [ ] Persistent storage (PostgreSQL/MongoDB)
- [ ] User authentication system
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with ticketing systems (Zendesk, Freshdesk)
- [ ] Advanced sentiment analysis with ML models

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License - See LICENSE file for details

## Author

Vedansh Kapoor

## Acknowledgments

- Built with Express.js
- Inspired by modern customer support systems
- Designed for learning and demonstration purposes

---

**Note**: This is a demonstration project. For production use, implement proper authentication, database persistence, and security measures.
