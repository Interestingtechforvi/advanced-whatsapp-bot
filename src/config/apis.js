require('dotenv').config();

module.exports = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        fileApiKey: process.env.GEMINI_FILE_API_KEY,
        uploadUrl: process.env.GEMINI_UPLOAD_URL,
        summaryUrl: process.env.GEMINI_SUMMARY_URL
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    deepseek: {
        apiUrl: process.env.DEEPSEEK_API_URL
    },
    tts: {
        apiUrl: process.env.TTS_API_URL,
        voices: [
            'Salli', 'Matthew', 'Joanna', 'Ivy', 'Justin', 'Kendra', 'Kimberly',
            'Amy', 'Brian', 'Emma', 'Russell', 'Nicole', 'Joey', 'Raveena',
            'Aditi', 'Geraint', 'Conchita', 'Enrique', 'Miguel', 'Penelope',
            'Chantal', 'Celine', 'Mathieu', 'Dora', 'Karl', 'Carla', 'Giorgio',
            'Mizuki', 'Takumi', 'Seoyeon', 'Liv', 'Lotte', 'Ruben', 'Ewa',
            'Jacek', 'Jan', 'Maja', 'Ricardo', 'Vitoria', 'Cristiano', 'Ines',
            'Carmen', 'Maxim', 'Tatyana', 'Astrid', 'Filiz'
        ]
    },
    truecaller: {
        apiUrl: process.env.TRUECALLER_API_URL
    }
};

