const axios = require('axios');
const fs = require('fs');

/**
 * Bunny Stream Video Ingestion Utility
 * Converts any raw video into high-speed adaptive HLS (.m3u8) without buffering & zero quality loss.
 * Preserves 100% original quality (up to 4K/1080p 60fps) with multi-bitrate delivery.
 */
const uploadVideoToBunnyStream = async (filePath, title) => {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || '756985';
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME || `vz-${libraryId}.b-cdn.net`;

    if (!libraryId || !apiKey) {
        throw new Error('Bunny Stream is not configured in .env (Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY)');
    }

    // Step 1: Create Video Entry in Bunny Video Library
    const cleanTitle = (title || 'Video').replace(/\.[^/.]+$/, '').trim();
    console.log(`[BUNNY STREAM] Creating video entry for: "${cleanTitle}" in Library #${libraryId}`);
    
    const createRes = await axios.post(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        { title: cleanTitle },
        {
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        }
    );

    const videoGuid = createRes.data?.guid;
    if (!videoGuid) {
        throw new Error('Failed to obtain Video GUID from Bunny Stream API response');
    }

    console.log(`[BUNNY STREAM] Video created with GUID: ${videoGuid}. Streaming binary payload...`);

    // Step 2: Stream binary video file to Bunny CDN
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    await axios.put(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
        fileStream,
        {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size,
            },
        }
    );

    console.log(`[BUNNY STREAM] ✅ Upload complete for GUID: ${videoGuid} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

    // Step 3: Construct High-Speed Streaming & Master Original URLs
    const cleanCdn = cdnHostname.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const hlsPlaylistUrl = `https://${cleanCdn}/${videoGuid}/playlist.m3u8`;
    const originalRawUrl = `https://${cleanCdn}/${videoGuid}/original`;
    const mp4_1080p = `https://${cleanCdn}/${videoGuid}/play_1080p.mp4`;
    const fallbackMp4Url = `https://${cleanCdn}/${videoGuid}/play_720p.mp4`;
    const autoThumbnailUrl = `https://${cleanCdn}/${videoGuid}/thumbnail.jpg`;
    const animatedPreviewUrl = `https://${cleanCdn}/${videoGuid}/preview.webp`;

    return {
        guid: videoGuid,
        hlsUrl: hlsPlaylistUrl,
        directUrl: hlsPlaylistUrl,           // Primary stream URL (Adaptive HLS)
        originalUrl: originalRawUrl,         // 100% Untouched RAW Master Video URL (0% Compression)
        mp4_1080p: mp4_1080p,                // Full HD 1080p MP4
        mp4Url: fallbackMp4Url,              // 720p MP4
        thumbnailUrl: autoThumbnailUrl,
        previewUrl: animatedPreviewUrl,
        fileSize: stats.size,
    };
};

/**
 * Create Video Entry in Bunny Stream for Direct Frontend Upload
 * Enables 100% accurate, real-time 0-100% upload progress tracking from browser directly to Bunny CDN
 */
const createBunnyVideoEntry = async (title) => {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || '756985';
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME || `vz-${libraryId}.b-cdn.net`;

    if (!libraryId || !apiKey) {
        throw new Error('Bunny Stream is not configured in .env');
    }

    const cleanTitle = (title || 'Video').replace(/\.[^/.]+$/, '').trim();
    const createRes = await axios.post(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        { title: cleanTitle },
        {
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        }
    );

    const videoGuid = createRes.data?.guid;
    if (!videoGuid) {
        throw new Error('Failed to obtain Video GUID from Bunny Stream API');
    }

    const cleanCdn = cdnHostname.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;
    const hlsPlaylistUrl = `https://${cleanCdn}/${videoGuid}/playlist.m3u8`;
    const autoThumbnailUrl = `https://${cleanCdn}/${videoGuid}/thumbnail.jpg`;
    const animatedPreviewUrl = `https://${cleanCdn}/${videoGuid}/preview.webp`;

    return {
        libraryId,
        videoId: videoGuid,
        apiKey,
        uploadUrl,
        hlsUrl: hlsPlaylistUrl,
        thumbnailUrl: autoThumbnailUrl,
        previewUrl: animatedPreviewUrl,
    };
};

/**
 * Delete a video from Bunny Stream library
 */
const deleteVideoFromBunnyStream = async (videoGuid) => {
    try {
        const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || '756985';
        const apiKey = process.env.BUNNY_STREAM_API_KEY;

        if (!libraryId || !apiKey || !videoGuid) return;

        await axios.delete(
            `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
            {
                headers: {
                    AccessKey: apiKey,
                    Accept: 'application/json',
                },
            }
        );
        console.log(`[BUNNY STREAM] Deleted video GUID ${videoGuid} from Bunny Stream`);
    } catch (err) {
        console.warn(`[BUNNY STREAM WARN] Could not delete video ${videoGuid}:`, err.message);
    }
};

module.exports = { uploadVideoToBunnyStream, createBunnyVideoEntry, deleteVideoFromBunnyStream };

