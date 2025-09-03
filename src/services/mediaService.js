const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Media Service for YouTube transcription, summarization, and image processing
 * Provides comprehensive media processing capabilities
 */
class MediaService {
    constructor() {
        this.youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    }

    /**
     * Transcribe YouTube video
     * @param {string} videoUrl - YouTube video URL
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeYouTubeVideo(videoUrl) {
        try {
            // Validate YouTube URL
            if (!this.isValidYouTubeUrl(videoUrl)) {
                throw new Error('Invalid YouTube URL provided');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('youtubeTranscribe', 'transcribe'),
                method: 'GET',
                params: {
                    url: videoUrl
                },
                serviceName: 'YouTube Transcribe',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for transcriptions
            });

            if (response.success && response.data) {
                return this.formatTranscriptionResult(response.data, videoUrl);
            }

            throw new Error('Invalid response from YouTube transcription service');

        } catch (error) {
            logger.error('YouTube transcription error:', error);
            return {
                success: false,
                error: error.message,
                videoUrl: videoUrl,
                service: 'YouTube Transcribe'
            };
        }
    }

    /**
     * Summarize YouTube video
     * @param {string} videoUrl - YouTube video URL
     * @param {number} wordCount - Word limit for summary (15-1000)
     * @returns {Promise<Object>} Summary result
     */
    async summarizeYouTubeVideo(videoUrl, wordCount = 200) {
        try {
            // Validate YouTube URL
            if (!this.isValidYouTubeUrl(videoUrl)) {
                throw new Error('Invalid YouTube URL provided');
            }

            // Validate word count
            wordCount = Math.max(15, Math.min(1000, wordCount));

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('youtubeSummarizer', 'summarize'),
                method: 'GET',
                params: {
                    url: videoUrl,
                    wordCount: wordCount
                },
                serviceName: 'YouTube Summarizer',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for summaries
            });

            if (response.success && response.data) {
                return this.formatSummaryResult(response.data, videoUrl, wordCount);
            }

            throw new Error('Invalid response from YouTube summarization service');

        } catch (error) {
            logger.error('YouTube summarization error:', error);
            return {
                success: false,
                error: error.message,
                videoUrl: videoUrl,
                wordCount: wordCount,
                service: 'YouTube Summarizer'
            };
        }
    }

    /**
     * Convert images to PDF
     * @param {Array<string>} imageUrls - Array of image URLs
     * @returns {Promise<Object>} PDF conversion result
     */
    async convertImagesToPdf(imageUrls) {
        try {
            // Validate input
            if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
                throw new Error('At least one image URL is required');
            }

            // Validate image URLs
            const validUrls = imageUrls.filter(url => this.isValidImageUrl(url));
            if (validUrls.length === 0) {
                throw new Error('No valid image URLs provided');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('imageToPdf', 'convert'),
                method: 'GET',
                params: {
                    url: validUrls.join(',')
                },
                serviceName: 'Image to PDF',
                cache: false // Don't cache PDF conversions
            });

            if (response.success) {
                return {
                    success: true,
                    pdfData: response.data.buffer || response.data,
                    imageUrls: validUrls,
                    totalImages: validUrls.length,
                    service: 'Image to PDF',
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('Invalid response from image to PDF service');

        } catch (error) {
            logger.error('Image to PDF conversion error:', error);
            return {
                success: false,
                error: error.message,
                imageUrls: imageUrls,
                service: 'Image to PDF'
            };
        }
    }

    /**
     * Validate YouTube URL
     */
    isValidYouTubeUrl(url) {
        return this.youtubeUrlPattern.test(url);
    }

    /**
     * Validate image URL
     */
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            
            return validExtensions.some(ext => pathname.endsWith(ext)) ||
                   urlObj.hostname.includes('imgur.com') ||
                   urlObj.hostname.includes('i.redd.it') ||
                   urlObj.hostname.includes('media.giphy.com');
        } catch (error) {
            return false;
        }
    }

    /**
     * Extract YouTube video ID from URL
     */
    extractYouTubeVideoId(url) {
        const match = url.match(this.youtubeUrlPattern);
        return match ? match[4] : null;
    }

    /**
     * Format transcription result
     */
    formatTranscriptionResult(data, videoUrl) {
        try {
            let transcription = '';
            let speakers = [];
            let timestamps = [];

            // Handle different response formats
            if (data.transcription) {
                transcription = data.transcription;
            } else if (data.transcript) {
                transcription = data.transcript;
            } else if (data.text) {
                transcription = data.text;
            } else if (typeof data === 'string') {
                transcription = data;
            }

            // Extract speakers if available
            if (data.speakers && Array.isArray(data.speakers)) {
                speakers = data.speakers;
            }

            // Extract timestamps if available
            if (data.timestamps && Array.isArray(data.timestamps)) {
                timestamps = data.timestamps;
            }

            return {
                success: true,
                transcription: transcription,
                speakers: speakers,
                timestamps: timestamps,
                videoUrl: videoUrl,
                videoId: this.extractYouTubeVideoId(videoUrl),
                service: 'YouTube Transcribe',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting transcription result:', error);
            return {
                success: false,
                error: 'Failed to format transcription result',
                videoUrl: videoUrl
            };
        }
    }

    /**
     * Format summary result
     */
    formatSummaryResult(data, videoUrl, wordCount) {
        try {
            let summary = '';
            let keyPoints = [];

            // Handle different response formats
            if (data.summary) {
                summary = data.summary;
            } else if (data.text) {
                summary = data.text;
            } else if (typeof data === 'string') {
                summary = data;
            }

            // Extract key points if available
            if (data.keyPoints && Array.isArray(data.keyPoints)) {
                keyPoints = data.keyPoints;
            } else if (data.key_points && Array.isArray(data.key_points)) {
                keyPoints = data.key_points;
            }

            return {
                success: true,
                summary: summary,
                keyPoints: keyPoints,
                wordCount: wordCount,
                actualWordCount: summary.split(' ').length,
                videoUrl: videoUrl,
                videoId: this.extractYouTubeVideoId(videoUrl),
                service: 'YouTube Summarizer',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting summary result:', error);
            return {
                success: false,
                error: 'Failed to format summary result',
                videoUrl: videoUrl,
                wordCount: wordCount
            };
        }
    }

    /**
     * Get video information from URL
     */
    getVideoInfo(videoUrl) {
        try {
            const videoId = this.extractYouTubeVideoId(videoUrl);
            if (!videoId) {
                return null;
            }

            return {
                videoId: videoId,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}`
            };

        } catch (error) {
            logger.error('Error getting video info:', error);
            return null;
        }
    }

    /**
     * Format transcription for display
     */
    formatTranscriptionForDisplay(transcriptionResult) {
        if (!transcriptionResult.success) {
            return `❌ Transcription failed: ${transcriptionResult.error}`;
        }

        let response = `🎥 *YouTube Video Transcription*\n\n`;
        
        const videoInfo = this.getVideoInfo(transcriptionResult.videoUrl);
        if (videoInfo) {
            response += `📺 *Video ID:* ${videoInfo.videoId}\n`;
        }
        
        response += `📝 *Transcription:*\n${transcriptionResult.transcription}\n\n`;
        
        if (transcriptionResult.speakers && transcriptionResult.speakers.length > 0) {
            response += `👥 *Speakers:* ${transcriptionResult.speakers.join(', ')}\n\n`;
        }
        
        response += `🔧 *Service:* ${transcriptionResult.service}\n`;
        response += `⏰ *Processed at:* ${new Date(transcriptionResult.timestamp).toLocaleString()}`;
        
        return response;
    }

    /**
     * Format summary for display
     */
    formatSummaryForDisplay(summaryResult) {
        if (!summaryResult.success) {
            return `❌ Summary failed: ${summaryResult.error}`;
        }

        let response = `🎥 *YouTube Video Summary*\n\n`;
        
        const videoInfo = this.getVideoInfo(summaryResult.videoUrl);
        if (videoInfo) {
            response += `📺 *Video ID:* ${videoInfo.videoId}\n`;
        }
        
        response += `📄 *Summary:*\n${summaryResult.summary}\n\n`;
        
        if (summaryResult.keyPoints && summaryResult.keyPoints.length > 0) {
            response += `🔑 *Key Points:*\n`;
            summaryResult.keyPoints.forEach((point, index) => {
                response += `${index + 1}. ${point}\n`;
            });
            response += '\n';
        }
        
        response += `📊 *Word Count:* ${summaryResult.actualWordCount}/${summaryResult.wordCount}\n`;
        response += `🔧 *Service:* ${summaryResult.service}\n`;
        response += `⏰ *Processed at:* ${new Date(summaryResult.timestamp).toLocaleString()}`;
        
        return response;
    }

    /**
     * Get service status
     */
    async getServiceStatus() {
        const status = {
            youtubeTranscribe: { available: false, responseTime: null },
            youtubeSummarizer: { available: false, responseTime: null },
            imageToPdf: { available: false, responseTime: null }
        };

        // Test YouTube transcription service
        try {
            const startTime = Date.now();
            const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll for testing
            const result = await this.transcribeYouTubeVideo(testUrl);
            status.youtubeTranscribe.available = result.success;
            status.youtubeTranscribe.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.youtubeTranscribe.error = result.error;
            }
        } catch (error) {
            status.youtubeTranscribe.error = error.message;
        }

        // Test YouTube summarization service
        try {
            const startTime = Date.now();
            const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            const result = await this.summarizeYouTubeVideo(testUrl, 50);
            status.youtubeSummarizer.available = result.success;
            status.youtubeSummarizer.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.youtubeSummarizer.error = result.error;
            }
        } catch (error) {
            status.youtubeSummarizer.error = error.message;
        }

        // Test image to PDF service
        try {
            const startTime = Date.now();
            const testImages = ['https://via.placeholder.com/150'];
            const result = await this.convertImagesToPdf(testImages);
            status.imageToPdf.available = result.success;
            status.imageToPdf.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.imageToPdf.error = result.error;
            }
        } catch (error) {
            status.imageToPdf.error = error.message;
        }

        return status;
    }
}

module.exports = new MediaService();

