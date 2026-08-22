// api/forgot-password.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Đọc chuỗi kết nối MongoDB từ Environment Variables trên Vercel
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'test'; // Thay bằng tên database của bạn nếu khác

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = await MongoClient.connect(MONGODB_URI);
    cachedClient = client;
    return client;
}

module.exports = async (req, res) => {
    // Thiết lập CORS
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Tìm người dùng theo email
        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống!' });
        }

        // Tạo resetToken ngẫu nhiên bằng thư viện crypto
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Đặt thời hạn hết hạn cho Token (ví dụ: 15 phút tính từ hiện tại)
        const resetTokenExpiry = Date.now() + 15 * 60 * 1000;

        // Cập nhật Token và thời hạn hết hạn vào tài khoản User trong MongoDB
        await usersCollection.updateOne(
            { email: email.toLowerCase() },
            { 
                $set: { 
                    resetToken: resetToken, 
                    resetTokenExpiry: resetTokenExpiry 
                } 
            }
        );

        // Trả về thông tin cho Frontend để gửi EmailJS
        return res.status(200).json({
            message: 'Tạo token khôi phục thành công',
            resetToken: resetToken,
            name: user.name || 'Người dùng',
            email: user.email
        });

    } catch (error) {
        console.error('Lỗi forgot-password:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ: ' + error.message });
    }
};