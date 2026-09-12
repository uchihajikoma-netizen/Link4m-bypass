/**
 * URL Parser Module
 * Handles extraction of direct download URLs from HTML content
 * and parses Link4M URL structures.
 */

const URLParser = (() => {

    // Known file extensions to look for
    const FILE_EXTENSIONS = [
        '.pdf', '.zip', '.rar', '.7z', '.tar.gz', '.tar.bz2',
        '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv',
        '.exe', '.msi', '.deb', '.rpm', '.apk', '.ipa',
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
        '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.iso', '.img', '.bin', '.dmg', '.pkg',
        '.csv', '.xml', '.json', '.txt', '.log',
        '.woff', '.woff2', '.ttf', '.eot', '.otf',
        '.svg', '.webm', '.ogg', '.ogv', '.opus'
    ];

    // Patterns for different extraction methods
    const PATTERNS = {
        metaRefresh: /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+;\s*url=([^"']+)/i,
        jsLocation: /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i,
        jsVarAssign: /(?:var|let|const)\s+(?:url|download|link|href|file)\s*=\s*["']([^"']+)["']/i,
        jsWindowLocation: /window\.location\s*=\s*["']([^"']+)["']/i,
        jsReplace: /\.replace\(["'][^"']*["']\s*,\s*["']([^"']+)["']\)/i,
        directAnchor: /<a[^>]+href=["']([^"']+)["'][^>]*>(?:Download|Télécharger|Get|Cliquez|Click)/i,
        jsonData: /window\.__INITIAL_STATE__\s*=\s*({[^;]+})/,
        dataUrl: /data-url\s*[:=]\s*["']([^"']+)["']/i,
        downloadBtn: /<button[^>]+(?:data-url|data-href|onclick)["']?[^>]*>/gi,
        iframeSrc: /<iframe[^>]+src=["']([^"']+)["']/i,
        sourceTag: /<source[^>]+src=["']([^"']+)["']/i,
        videoSrc: /<video[^>]+src=["']([^"']+)["']/i,
        objectData: /<object[^>]+data=["']([^"']+)["']/i,
        embedSrc: /<embed[^>]+src=["']([^"']+)["']/i
    };

    /**
     * Normalize a URL to absolute form
     */
    function normalizeUrl(url, baseUrl) {
        if (!url) return null;
        url = url.trim().replace(/^["']|["']$/g, '');
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        if (url.startsWith('/')) {
            const baseHost = baseUrl.match(/https?:\/\/[^/]+/);
            return baseHost ? baseHost[0] + url : url;
        }
        if (!url.startsWith('http')) {
            const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
            url = basePath
