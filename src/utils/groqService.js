import axios from 'axios';

export const generateGroqResponse = async (prompt) => {
  try {
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_GROQ_API_KEY is not defined in environment variables');
    }
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Groq API Error:', errorDetails);
    throw new Error(`Groq API Error: ${errorDetails}`);
  }
};
