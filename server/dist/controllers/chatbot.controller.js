"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.generateChatResponse = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Define a system prompt that gives context about the HealthBridge platform
const SYSTEM_PROMPT = `You are the HealthBridge Assistant, a guide for users navigating our healthcare platform.

About HealthBridge:
- HealthBridge is a platform where users can find information about healthcare providers
- The platform has sections for: Doctors, Specialties, Services, and User Profiles
- HealthBridge provides information but doesn't directly book appointments

Your primary role:
- Guide users to the correct sections of the website (e.g., "You can find orthopedists in the Doctors section")
- Provide general information about medical specialties (e.g., "For back pain, you might consider orthopedics or physical therapy")
- Explain how to use the platform features (e.g., "To view your medical history, click on the Profile section")
- Do NOT simulate appointment booking processes - instead direct users to "Click on the Book Appointment button on any doctor's profile page"
- Do NOT request personal information like phone numbers or emails

When someone mentions a medical issue:
- Briefly acknowledge their concern
- Suggest which medical specialty might be relevant
- Direct them to that section of the website
- Example: "For back pain, orthopedists or physical therapists are often helpful. You can find them in our Doctors section by selecting these specialties from the filter menu."

Keep responses brief, informative, and focused on helping users navigate the platform.`;
// Initialize the Google Generative AI with API key
const getGeminiModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    console.log(`API Key configured: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings: [
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ],
    });
};
// Endpoint to generate a response from Gemini
const generateChatResponse = async (req, res) => {
    try {
        console.log('Generating chat response: Request received');
        const { message, chat_history } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        console.log(`User message: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        // Prepare chat history in the format expected by Gemini
        const history = Array.isArray(chat_history) ? chat_history : [];
        console.log(`Chat history received with ${history.length} messages`);
        try {
            console.log('Initializing Gemini model...');
            const model = getGeminiModel();
            // Prepare the conversation with the system prompt integrated properly
            console.log('Starting chat with properly formatted history...');
            // Direct API call approach without chat history
            console.log('Sending message to Gemini with context...');
            // Prepare the prompt with system instructions and conversation history
            const contextualizedPrompt = `${SYSTEM_PROMPT}
      
${history.length > 0 ? 'Previous conversation:' : ''}
${history.map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n')}

User: ${message}

Remember to direct users to the appropriate sections of the website rather than simulating appointment booking.`;
            console.log('Sending contextualized prompt to Gemini');
            // Set generation config
            const generationConfig = {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 256,
            };
            // Generate content with the full context
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: contextualizedPrompt }] }],
                generationConfig,
            });
            console.log('Response received from Gemini');
            const response = result.response;
            const text = response.text();
            console.log(`AI response: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
            res.status(200).json({ response: text });
        }
        catch (apiError) {
            console.error('Gemini API error details:', {
                message: apiError.message,
                name: apiError.name,
                stack: apiError.stack,
                statusCode: apiError.statusCode || 'No status code',
            });
            res.status(500).json({
                error: 'Error generating response from AI',
                details: apiError.message
            });
        }
    }
    catch (error) {
        console.error('Generate chat response error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        res.status(500).json({ error: 'Server error' });
    }
};
exports.generateChatResponse = generateChatResponse;
// Simple health check for the chatbot service
const healthCheck = (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        // Basic check of API key format
        const isValidFormat = apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;
        res.status(200).json({
            status: 'operational',
            hasApiKey: !!apiKey,
            keyValid: isValidFormat ? 'Appears valid' : 'Invalid format',
            keyFormat: apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'Not configured'
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
exports.healthCheck = healthCheck;
