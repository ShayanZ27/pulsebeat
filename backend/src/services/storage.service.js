const ImageKit = require("imagekit");
const sharp = require("sharp");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

async function uploadFile(file) {
    const result = await imagekit.upload({
        file,
        fileName: `music_${Date.now()}`,
        folder: "spotify-clone/music",
    })
    return result;
}

async function uploadImage(image){
    // Compress the image down to 800x800 and convert to high-efficiency JPEG (500KB - 1MB usually)
    const compressedBuffer = await sharp(image)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

    const result = await imagekit.upload({
        file: compressedBuffer,
        fileName: `image_${Date.now()}.jpg`, // Safely use .jpg since we converted it
        folder: "spotify-clone/images",
    })
    return result;
}

async function deleteImageByURL(url) {
    if (!url) return;
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        const fileName = parts[parts.length - 1];

        const files = await imagekit.listFiles({
            searchQuery: `name="${fileName}"`
        });

        if (files && files.length > 0) {
            await imagekit.deleteFile(files[0].fileId);
        }
    } catch (err) {
        console.error("Error deleting image from imagekit:", err);
    }
}

module.exports = {
    uploadFile,
    uploadImage,
    deleteImageByURL
}