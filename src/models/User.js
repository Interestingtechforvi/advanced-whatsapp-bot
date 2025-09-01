const { pool } = require('../config/database');

class User {
    static async findByPhoneNumber(phoneNumber) {
        if (!pool) {
            // Return a mock user when database is not available
            return {
                id: 1,
                phone_number: phoneNumber,
                username: 'User',
                preferred_ai_model: 'gemini',
                is_first_time: false
            };
        }
        
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE phone_number = $1',
                [phoneNumber]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by phone number:', error);
            return null;
        }
    }

    static async create(phoneNumber, username = null) {
        if (!pool) {
            // Return a mock user when database is not available
            return {
                id: 1,
                phone_number: phoneNumber,
                username: username || 'User',
                preferred_ai_model: 'gemini',
                is_first_time: !username
            };
        }
        
        try {
            const result = await pool.query(
                'INSERT INTO users (phone_number, username) VALUES ($1, $2) RETURNING *',
                [phoneNumber, username]
            );
            
            // Create default preferences
            await pool.query(
                'INSERT INTO user_preferences (user_id) VALUES ($1)',
                [result.rows[0].id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }

    static async updateUsername(userId, username) {
        if (!pool) return { id: userId, username };
        
        try {
            const result = await pool.query(
                'UPDATE users SET username = $1, is_first_time = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [username, userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating username:', error);
            return null;
        }
    }

    static async updateAIModel(userId, aiModel) {
        if (!pool) return { id: userId, preferred_ai_model: aiModel };
        
        try {
            const result = await pool.query(
                'UPDATE users SET preferred_ai_model = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [aiModel, userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating AI model:', error);
            return null;
        }
    }

    static async setFirstTimeComplete(userId) {
        if (!pool) return { id: userId, is_first_time: false };
        
        try {
            const result = await pool.query(
                'UPDATE users SET is_first_time = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
                [userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error setting first time complete:', error);
            return null;
        }
    }

    static async getPreferences(userId) {
        if (!pool) return { tts_voice: 'Salli', language: 'en', research_depth: 'medium' };
        
        try {
            const result = await pool.query(
                'SELECT * FROM user_preferences WHERE user_id = $1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return null;
        }
    }

    static async updatePreferences(userId, preferences) {
        if (!pool) return preferences;
        
        try {
            const { tts_voice, language, research_depth } = preferences;
            const result = await pool.query(
                'UPDATE user_preferences SET tts_voice = $1, language = $2, research_depth = $3 WHERE user_id = $4 RETURNING *',
                [tts_voice, language, research_depth, userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating preferences:', error);
            return null;
        }
    }
}

module.exports = User;

