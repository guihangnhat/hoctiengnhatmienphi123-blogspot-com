import dbConnect from '../utils/dbConnect';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

if (req.method === 'OPTIONS') return res.status(200).end();

await dbConnect();
const { email, password } = req.body;

const user = await User.findOne({ email });
if (!user) return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác' });

if (!user.isVerified) {
return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.' });
}

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(400).json({ message: 'Thông tin đăng nhập không chính xác' });

const token = jwt.sign(
{ userId: user._id, name: user.name, email: user.email },
process.env.JWT_SECRET,
{ expiresIn: '7d' }
);

return res.status(200).json({ message: 'Đăng nhập thành công', token, name: user.name });
}