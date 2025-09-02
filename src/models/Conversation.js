const { pool } = require('../config/database');

class Conversation {
    static async create(userId, message, response, aiModelUsed) {
        if (!pool) {
            console.log('📊 Database not available. Conversation not saved.');
            return null;
        }
        
        try {
            const result = await pool.query(
                'INSERT INTO conversations (user_id, message, response, ai_model_used) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, message, response, aiModelUsed]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    }

    static async getRecentConversations(userId, limit = 10) {
        if (!pool) return [];
        
        try {
            const result = await pool.query(
                'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
                [userId, limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting recent conversations:', error);
            return [];
        }
    }

    static async getConversationHistory(userId, days = 7) {
        if (!pool) return [];
        
        try {
            const result = await pool.query(
                'SELECT * FROM conversations WHERE user_id = $1 AND created_at >= NOW() - INTERVAL \'$2 days\' ORDER BY created_at DESC',
                [userId, days]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting conversation history:', error);
            return [];
        }
    }
}

module.exports = Conversation;

