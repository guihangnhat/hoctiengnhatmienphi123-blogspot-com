import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
throw new Error('Vui lòng định nghĩa biến môi trường MONGODB_URI trong file .env hoặc Vercel dashboard');
}

/**
* Trong môi trường Serverless, các hàm lambda sẽ tạo mới kết nối mỗi khi được thực thi.
* Đoạn mã bên dưới giúp lưu lại (cache) kết nối MongoDB để tránh tạo quá nhiều connection gây treo database.
*/
let cached = global.mongoose;

if (!cached) {
cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
if (cached.conn) {
return cached.conn;
}

if (!cached.promise) {
const opts = {
bufferCommands: false,
};

cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
return mongoose;
});
}

try {
cached.conn = await cached.promise;
} catch (e) {
cached.promise = null;
throw e;
}

return cached.conn;
}

export default dbConnect;