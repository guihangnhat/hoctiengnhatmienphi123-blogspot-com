import dbConnect from '../utils/dbConnect';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

await dbConnect();
const { name, email, password } = req.body;

if (!name || !email || !password) {
return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
}

const existingUser = await User.findOne({ email });
if (existingUser) {
return res.status(400).json({ message: 'Email đã được sử dụng' });
}

const hashedPassword = await bcrypt.hash(password, 10);
const verifyToken = crypto.randomBytes(32).toString('hex');

await User.create({
name,
email,
password: hashedPassword,
isVerified: false,
verifyToken
});

// Trả verifyToken về client để gửi email qua EmailJS
return res.status(201).json({
message: 'Đăng ký thành công! Đang gửi email kích hoạt...',
verifyToken,
email,
name
});
}
