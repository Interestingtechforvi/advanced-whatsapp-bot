require("dotenv").config();

module.exports = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        fileApiKey: process.env.GEMINI_FILE_API_KEY,
        uploadUrl: process.env.GEMINI_UPLOAD_URL,
        summaryUrl: process.env.GEMINI_SUMMARY_URL
    },
    deepseek: {
        apiUrl: process.env.DEEPSEEK_API_URL
    },
    claudeai: {
        apiUrl: "https://claudeai.anshppt19.workers.dev/api/chat"
    },
    laama: {
        apiUrl: "https://laama.revangeapi.workers.dev/chat"
    },
    moonshotai: {
        apiUrl: "https://allmodels.revangeapi.workers.dev/revangeapi/moonshotai-Kimi-K2-Instruct/chat"
    },
    qwen3coder: {
        apiUrl: "https://allmodels.revangeapi.workers.dev/revangeapi/qwen3-coder/chat"
    },
    imageGen: {
        apiUrl: "https://sheikhhridoy.nagad.my.id/api/ai-art-generator.php"
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

