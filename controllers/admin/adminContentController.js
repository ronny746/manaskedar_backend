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

// Media CRUD
exports.createMedia = async (req, res) => {
    try {
        const media = await Media.create(req.body);
        res.status(201).json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMedia = async (req, res) => {
    try {
        const media = await Media.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.status(200).json(media);
    } catch (err) {
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
        await Media.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted' });
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

const { s3Client, bucketName } = require('../../config/s3');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
const { getCdnUrl } = require('../../utils/cdnHelper');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const isVideo = req.file.mimetype.startsWith('video/');
        const isAudio = req.file.mimetype.startsWith('audio/');
        const isImage = req.file.mimetype.startsWith('image/');

        let subfolder = 'others';
        if (isVideo) subfolder = 'videos';
        else if (isAudio) subfolder = 'audios';
        else if (isImage) subfolder = 'images';

        const localPath = req.file.path;
        let fileStream;
        let contentType = req.file.mimetype;
        let finalFileName = req.file.originalname.replace(/\s+/g, '_');

        // 🖼️ AUTO-COMPRESS IMAGES WITH SHARP (WebP Conversion, 80-90% Size Reduction)
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

        // 🎥 VIDEO / AUDIO UPLOAD PIPELINE
        const fileName = `${Date.now()}_${finalFileName}`;
        const folder = `manaskedar_universe/${subfolder}`;
        const key = `${folder}/${fileName}`;

        console.log(`[S3] Uploading ${req.file.mimetype} to S3: ${key}`);

        fileStream = fs.createReadStream(localPath);

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: fileStream,
                ContentType: contentType
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
        console.error('[S3 ERROR] Upload failed:', err.message);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: `Upload Error: ${err.message}` });
    }
};

