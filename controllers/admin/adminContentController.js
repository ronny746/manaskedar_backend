const User = require('../../models/User'); // For stats
const Media = require('../../models/Media');
const Banner = require('../../models/Banner');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Admin Analytics
exports.getDashboardStats = async (req, res) => {
    try {
        const [totalMedia, totalUsers, totalMovies, totalShorts, totalAudio, totalShows, recentUsers] = await Promise.all([
            Media.countDocuments(),
            User.countDocuments(),
            Media.countDocuments({ type: 'movie' }),
            Media.countDocuments({ type: { $in: ['shorts', 'short'] } }),
            Media.countDocuments({ type: 'audio' }),
            Media.countDocuments({ type: 'show' }),
            User.find().select('name createdAt').sort('-createdAt').limit(5)
        ]);

        res.status(200).json({
            media: totalMedia,
            users: totalUsers,
            movies: totalMovies,
            shorts: totalShorts,
            audio: totalAudio,
            shows: totalShows,
            recentUsers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Media Library Overview
exports.getMedia = async (req, res) => {
    try {
        const media = await Media.find().sort('-createdAt');
        res.status(200).json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMediaById = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ error: 'Media not found' });
        res.status(200).json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const { sendNotification } = require('../../utils/notificationHelper');

// Media CRUD
exports.createMedia = async (req, res) => {
    try {
        const media = await Media.create(req.body);

        // Check if Admin requested Push Notification to users
        if (req.body.notifyUsers === true || req.body.notifyUsers === 'true') {
            const mediaType = media.type || 'movie';
            let route = '/details';
            if (mediaType === 'short' || mediaType === 'shorts') route = '/shorts';
            else if (mediaType === 'audio') route = '/audio';

            const typeLabel = mediaType.toUpperCase();
            await sendNotification({
                title: `✨ New ${typeLabel}: ${media.title}`,
                body: media.description ? media.description.substring(0, 100) + '...' : `Watch ${media.title} now on Manas Kedar.`,
                imageUrl: media.thumbnail || '',
                mediaId: media._id,
                mediaType: mediaType,
                route: route
            });
        }

        res.status(201).json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMedia = async (req, res) => {
    try {
        const media = await Media.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });

        if (req.body.notifyUsers === true || req.body.notifyUsers === 'true') {
            const mediaType = media?.type || 'movie';
            let route = '/details';
            if (mediaType === 'short' || mediaType === 'shorts') route = '/shorts';
            else if (mediaType === 'audio') route = '/audio';

            await sendNotification({
                title: `🔥 Updated: ${media.title}`,
                body: `Check out the latest updates for ${media.title}!`,
                imageUrl: media.thumbnail || '',
                mediaId: media._id,
                mediaType: mediaType,
                route: route
            });
        }

        res.status(200).json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Broadcast Custom Notification
exports.sendBroadcastNotification = async (req, res) => {
    try {
        const { title, body, imageUrl, route, mediaId, mediaType, targetUrl } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const notification = await sendNotification({
            title,
            body,
            imageUrl: imageUrl || '',
            route: route || '/details',
            mediaId: mediaId || null,
            mediaType: mediaType || 'movie',
            targetUrl: targetUrl || ''
        });

        res.status(200).json({
            message: 'Broadcast notification sent successfully',
            notification
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json(banner);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const { uploadVideoToBunnyStream, createBunnyVideoEntry, deleteVideoFromBunnyStream } = require('../../utils/bunnyStreamHelper');

exports.getBunnyUploadAuth = async (req, res) => {
    try {
        const title = req.body?.title || req.query?.title || 'video.mp4';
        const authData = await createBunnyVideoEntry(title);
        res.status(200).json(authData);
    } catch (err) {
        console.error('[BUNNY AUTH ERROR]', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getUploadAuth = async (req, res) => {
    try {
        res.status(200).json({
            cloud: 's3',
            endpoint: '/api/admin/upload',
            message: 'AWS S3 tunnel established'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (media) {
            // If media was hosted on Bunny Stream, delete from library
            if (media.bunnyVideoId) {
                await deleteVideoFromBunnyStream(media.bunnyVideoId);
            } else if (media.url && media.url.includes('b-cdn.net')) {
                const parts = media.url.split('/');
                const guidIndex = parts.findIndex(p => p.includes('b-cdn.net')) + 1;
                if (guidIndex > 0 && parts[guidIndex]) {
                    await deleteVideoFromBunnyStream(parts[guidIndex]);
                }
            }
            await Media.findByIdAndDelete(req.params.id);
        }
        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const isVideo = req.file.mimetype.startsWith('video/');
        const isAudio = req.file.mimetype.startsWith('audio/');
        const isImage = req.file.mimetype.startsWith('image/');

        const localPath = req.file.path;
        let finalFileName = req.file.originalname.replace(/\s+/g, '_');

        // 🚀 PIPELINE 1: BUNNY STREAM FOR VIDEOS (Zero Buffering, Adaptive Bitrate HLS, No Quality Loss)
        if (isVideo && process.env.BUNNY_STREAM_API_KEY) {
            try {
                console.log(`[BUNNY STREAM] Ingesting video without quality degradation: ${req.file.originalname}`);
                const bunnyResult = await uploadVideoToBunnyStream(localPath, finalFileName);

                // Clean up local file after upload
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }

                return res.status(200).json({
                    message: 'Video uploaded and processed for high-speed streaming',
                    url: bunnyResult.hlsUrl,                    // Adaptive HLS playlist (.m3u8)
                    hlsUrl: bunnyResult.hlsUrl,                // Adaptive Bitrate Stream
                    originalUrl: bunnyResult.originalUrl,      // 100% Untouched RAW Master Video File
                    directUrl: bunnyResult.hlsUrl,
                    fallbackUrl: bunnyResult.mp4_1080p || bunnyResult.mp4Url,
                    mp4_1080p: bunnyResult.mp4_1080p,
                    mp4Url: bunnyResult.mp4Url,
                    thumbnail: bunnyResult.thumbnailUrl,
                    previewUrl: bunnyResult.previewUrl,
                    fileId: bunnyResult.guid,
                    bunnyVideoId: bunnyResult.guid,
                    fileType: 'video',
                    fileSize: bunnyResult.fileSize || req.file.size || 0,
                    provider: 'bunny_stream'
                });
            } catch (bunnyErr) {
                console.error('[BUNNY STREAM ERROR] Video upload failed, attempting S3 fallback:', bunnyErr.message);
                // If Bunny upload fails, continue down to S3 fallback
            }
        }

        // 🖼️ PIPELINE 2: AUTO-COMPRESS IMAGES WITH SHARP (WebP Conversion, 80-90% Size Reduction)
        if (isImage) {
            console.log(`[SHARP] Optimizing image: ${req.file.originalname}`);
            const outputFileName = `${Date.now()}_${path.parse(finalFileName).name}.webp`;
            const key = `manaskedar_universe/images/${outputFileName}`;

            const compressedBuffer = await sharp(localPath)
                .resize({ width: 1920, withoutEnlargement: true }) // Max 1080p width
                .webp({ quality: 82 })                             // High clarity WebP
                .toBuffer();

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucketName,
                    Key: key,
                    Body: compressedBuffer,
                    ContentType: 'image/webp'
                },
            });

            await upload.done();

            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

            const rawS3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            const cdnUrl = getCdnUrl(rawS3Url);

            console.log(`[S3/CDN] Image uploaded successfully (WebP): ${cdnUrl}`);

            return res.status(200).json({
                message: 'Image optimized and uploaded successfully',
                url: cdnUrl,
                rawUrl: rawS3Url,
                fileId: key,
                fileType: 'image',
                fileSize: compressedBuffer.length
            });
        }

        // ☁️ PIPELINE 3: AWS S3 FOR AUDIO / FALLBACK STORAGE
        let subfolder = 'others';
        if (isVideo) subfolder = 'videos';
        else if (isAudio) subfolder = 'audios';

        const fileName = `${Date.now()}_${finalFileName}`;
        const folder = `manaskedar_universe/${subfolder}`;
        const key = `${folder}/${fileName}`;

        console.log(`[S3] Uploading ${req.file.mimetype} to S3: ${key}`);

        const fileStream = fs.createReadStream(localPath);

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: fileStream,
                ContentType: req.file.mimetype
            },
        });

        await upload.done();

        // Cleanup local file after upload
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`[S3] Cleaned up local file: ${localPath}`);
        }

        const rawS3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        const cdnUrl = getCdnUrl(rawS3Url);

        res.status(200).json({
            message: 'Media uploaded successfully',
            url: cdnUrl,
            rawUrl: rawS3Url,
            fileId: key,
            fileType: isVideo ? 'video' : (isAudio ? 'audio' : 'other'),
            duration: 0,
            fileSize: req.file.size || 0
        });

    } catch (err) {
        console.error('[UPLOAD ERROR] Upload failed:', err.message);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: `Upload Error: ${err.message}` });
    }
};

