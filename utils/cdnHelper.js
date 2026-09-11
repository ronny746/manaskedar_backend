/**
 * CDN Helper Utility
 * Automatically transforms raw S3/storage URLs into fast CDN URLs
 * (CloudFront, Cloudflare R2, or Bunny CDN)
 */

const getCdnUrl = (originalUrl) => {
    if (!originalUrl) return originalUrl;

    const cdnBase = process.env.CDN_BASE_URL; // e.g. https://cdn.manaskedar.com or https://d11111111.cloudfront.net
    if (!cdnBase) return originalUrl;

    // If it's already a full CDN URL, return as is
    if (originalUrl.startsWith(cdnBase)) return originalUrl;

    // Extract path from S3 URL or relative key
    try {
        if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
            const parsed = new URL(originalUrl);
            return `${cdnBase.replace(/\/$/, '')}${parsed.pathname}`;
        }
        // If it's just a key (e.g. "videos/movie1.m3u8")
        return `${cdnBase.replace(/\/$/, '')}/${originalUrl.replace(/^\//, '')}`;
    } catch (err) {
        return originalUrl;
    }
};

module.exports = { getCdnUrl };
