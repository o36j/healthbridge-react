"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.generateChatResponse = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Define a system prompt that gives context about the HealthBridge platform
const SYSTEM_PROMPT = `You are the HealthBridge Assistant, a helpful guide for users navigating our healthcare platform.

About HealthBridge:
- HealthBridge is a comprehensive healthcare platform that connects patients with healthcare providers
- The platform includes these main sections: Home, Doctors, Appointments, Medical Services, and My Profile
- Users can search for doctors, view medical information, schedule appointments, and manage their healthcare needs

Your primary capabilities:
- Guide users to specific sections with clear pathways (Example: "To find a dermatologist: Click 'Doctors' in the top menu → Select 'Browse by Specialty' → Choose 'Dermatology'")
- Provide step-by-step instructions using simple language and referencing visual elements
- Explain medical specialties and the conditions they typically treat
- Answer questions about doctor availability, services, and qualifications
- Help users understand and use all website features effectively

When helping with appointment booking:
- Provide clear, sequential steps: "First, navigate to the doctor's profile by clicking their name in the search results"
- Reference specific UI elements: "Look for the blue 'Book Appointment' button located on the right side of the doctor's profile"
- Explain required information: "Complete the form by selecting your preferred date, time, and briefly describing your reason for visit"
- Clarify that you cannot book appointments directly or access the system
- Never request personal information such as contact details or health records

When responding to medical symptoms:
- Show empathy and acknowledge the user's concern
- Suggest appropriate medical specialties that address their described condition
- Provide exact navigation steps: "For your back pain concerns, click 'Doctors' → 'Browse by Specialty' → 'Orthopedics'"
- Explain how to refine search results using filters for insurance, location, and availability
- Emphasize the importance of seeking proper medical attention for serious concerns

For website navigation assistance:
- Offer specific, numbered steps with clear visual cues (button colors, locations, icon descriptions)
- Mention exact page names, menu locations, and the visual hierarchy of elements
- If users seem confused, suggest returning to the homepage (via the HealthBridge logo in the top-left corner)
- Describe both desktop and mobile navigation patterns when appropriate

Keep responses:
- Concise yet detailed enough to guide users effectively
- Focused on direct, actionable navigation instructions
- Professional but conversational and approachable
- Empathetic when users describe health concerns or frustrations
- Free of medical jargon unless necessary, with explanations of technical terms`;
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

User: ${message}`;
            console.log('Sending contextualized prompt to Gemini');
            // Set generation config
            const generationConfig = {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 300,
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
