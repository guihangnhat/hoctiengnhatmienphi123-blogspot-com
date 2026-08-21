import dbConnect from '../utils/dbConnect';
import User from '../models/User';

export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

if (req.method === 'OPTIONS') return res.status(200).end();

await dbConnect();
const { token } = req.query;

if (!token) return res.status(400).send('Token không hợp lệ');

const user = await User.findOne({ verifyToken: token });
if (!user) return res.status(400).send('Token kích hoạt không tồn tại hoặc đã hết hạn');

user.isVerified = true;
user.verifyToken = undefined;
await user.save();

return res.send('<h2>Xác thực tài khoản thành công! Bạn có thể quay lại Blogspot để đăng nhập.</h2>');
}
