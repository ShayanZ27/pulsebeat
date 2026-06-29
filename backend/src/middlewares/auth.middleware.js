const jwt = require("jsonwebtoken");

function authenticateArtist(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedToken.role != 'artist') {
            return res.status(403).json({ success: false, message: "User not an 'artist' role" });
        }
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function authenticateUser(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedToken.role !== 'user' && decodedToken.role !== 'artist') {
            return res.status(403).json({ success: false, message: "Unauthorized role" });
        }
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

function authenticateAdmin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedToken.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized role" });
        }
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    authenticateArtist,
    authenticateUser,
    authenticateAdmin
};
