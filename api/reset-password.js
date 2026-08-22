// api/reset-password.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'test';

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
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin token hoặc mật khẩu mới' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Tìm người dùng có resetToken trùng khớp
        const user = await usersCollection.findOne({ resetToken: resetToken });

        if (!user) {
            return res.status(400).json({ message: 'Mã khôi phục không hợp lệ hoặc đã được sử dụng!' });
        }

        // Kiểm tra xem Token đã hết hạn chưa
        if (Date.now() > user.resetTokenExpiry) {
            return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại!' });
        }

        // Mã hóa mật khẩu mới trước khi lưu vào DB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu mới và xóa các trường token khôi phục
        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });

    } catch (error) {
        console.error('Lỗi reset-password:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ: ' + error.message });
    }
};