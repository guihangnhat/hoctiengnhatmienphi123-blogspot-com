
The code above combines Blogspot, Email.js, Vercel, and MongoDB to create authentication for the Blogspot website. This includes registration, login, account activation via email, and password recovery.

1/ The Blogspot HTML code example is:
-----------------------------------------------------------------------------------------------------

<!--Nội dung bảo mật (chỉ hiện khi đã đăng nhập)-->
<div class="protected-content" style="display: none;">
   <h3> 
        Chúc mừng bạn <span id="user-name"></span> đã đăng ký thành công<br>
        bạn vui lòng nhấn đường link dưới trở về trang tổng quan<br>
      
  </h3>

</div>

<!--Thông báo yêu cầu đăng nhập-->
<div class="auth-lock-notice" style="display: block;">
  <!--<p><em>Vui lòng đăng ký hoặc đăng nhập để xem tiếp nội dung này.</em></p>-->
</div>

<!--SDK EmailJS-->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js" type="text/javascript"></script>

<div id="auth-panel" style="border: 1px solid rgb(204, 204, 204); margin-bottom: 20px; padding: 15px;">
  <!--FORM ĐĂNG KÝ-->
  <div id="register-section">
   
    <div id="register-form" style="width: 100%; border: 2px solid red; border-radius: 10px">
      <h3>Đăng Ký Tài Khoản</h3>
      <label for="reg-name">Họ và tên:</label><br />
      <input id="reg-name" type="text" /><br />
      <label for="reg-email">Email:</label><br />
      <input id="reg-email" type="email" /><br />
      <label for="reg-password">Mật khẩu:</label><br />
      <input id="reg-password" type="password" /><br /><br />
      <button onclick="handleRegister()">Đăng ký</button>
    </div>
  </div>

  <!--FORM ĐĂNG NHẬP-->
  <div id="login-section" >

    <div id="login-form" style="margin-top: 15px; width: 100%;border: 2px solid red; border-radius: 10px">
      <h3>Đăng Nhập</h3>
      <label for="reg-email">Email:</label><br />
      <input id="login-email" type="email"/><br />
      <label for="reg-password">Mật khẩu:</label><br />
      <input id="login-password" type="password" /><br /><br />
      <button onclick="handleLogin()">Đăng nhập</button>
      <br /><br />
      <a href="javascript:void(0)" onclick="toggleForgotPassword(true)" style="color: #007bff; font-size: 14px;">Quên mật khẩu?</a>
    </div>
  </div>

  <!--FORM QUÊN MẬT KHẨU-->
  <div id="forgot-form" style="display: none; margin-top: 15px; width: 100%;">
    <h3>Quên Mật Khẩu</h3>
    <p style="color: #555555; font-size: 13px;">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
   
    <input id="forgot-email" placeholder="Email đăng ký" type="email" /><br /><br />
    <button onclick="handleForgotPassword()">Gửi link khôi phục</button>
    <br /><br />
    <a href="javascript:void(0)" onclick="toggleForgotPassword(false)" style="font-size: 14px;">Quay lại Đăng nhập</a>
  </div>

  <!--FORM ĐẶT LẠI MẬT KHẨU (Hiện khi truy cập từ Link Email)-->
  <div id="reset-password-form" style="display: none; margin-top: 15px; width:100%;">
    <h3>Đặt Lai Mật Khẩu Mới</h3>
    <input id="reset-new-password" placeholder="Nhập mật khẩu mới" type="password" /><br /><br />
    <button onclick="handleResetPassword()">Cập nhật mật khẩu</button>
  </div>

  <!--TRẠNG THÁI ĐÃ ĐĂNG NHẬP-->
  <div id="user-profile" style="display: none;">
    <h3>Xin chào, <span id="user-name"></span>!</h3>
    <button onclick="handleLogout()">Đăng xuất</button>
  </div>
</div>

<script>
// Cấu hình các Endpoint & EmailJS Keys
const API_URL = 'https://your api vercel  address/api';
const EMAILJS_PUBLIC_KEY = ' your EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'your EMAILJS_SERVICE_ID';
<!-- const EMAILJS_TEMPLATE_ID = 'template_sugrvvi'; // Dùng Template gửi mail hoặc tạo thêm 1 template mới chuyên dùng gửi Link Reset Pass -->

emailjs.init(EMAILJS_PUBLIC_KEY);

// Kiểm tra trạng thái khi tải trang
window.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

function checkAuthState() {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('userName');

  // Kiểm tra xem trang web có đang mở từ link Đặt lại mật khẩu chứa Token hay không (?resetToken=...)
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');

  if (resetToken) {
    // Ẩn tất cả các form và chỉ mở Form Đặt lại Mật Khẩu
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'none';
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'block';
    
    document.querySelectorAll('.protected-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-lock-notice').forEach(el => el.style.display = 'block');
    return;
  }

  if (token && name) {
    // 1. Cập nhật giao diện Form khi ĐÃ đăng nhập
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'none';
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('user-name').innerText = name;

    // 2. Mở khóa nội dung bảo mật
    document.querySelectorAll('.protected-content').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.auth-lock-notice').forEach(el => el.style.display = 'none');
  } else {
    // Khi CHƯA đăng nhập
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('forgot-form').style.display = 'none';
    document.getElementById('reset-password-form').style.display = 'none';
    document.getElementById('user-profile').style.display = 'none';

    document.querySelectorAll('.protected-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-lock-notice').forEach(el => el.style.display = 'block');
  }
}

// Bật / Tắt giao diện Form Quên Mật Khẩu
function toggleForgotPassword(showForgot) {
  if (showForgot) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'block';
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('forgot-form').style.display = 'none';
  }
}

// 1. ĐĂNG KÝ
async function handleRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch(`${API_URL}/register.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Gửi link kích hoạt qua EmailJS
    const activationUrl = `${API_URL}/verify.js?token=${data.verifyToken}`;

    await emailjs.send(EMAILJS_SERVICE_ID, 'template_sugrvvi', {
      to_name: data.name,
      to_email: data.email,
      action_url: activationUrl
    });

    alert('Đăng ký thành công! Vui lòng kiểm tra hộp thư Email để kích hoạt tài khoản.');
  } catch (err) {
    alert(err.message || 'Lỗi đăng ký');
  }
}

// 2. ĐĂNG NHẬP
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_URL}/login.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Lưu Token vào LocalStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);

    checkAuthState();
    alert('Đăng nhập thành công!');
  } catch (err) {
    alert(err.message);
  }
}

// 3. YÊU CẦU QUÊN MẬT KHẨU
async function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value;
  if (!email) {
    alert('Vui lòng nhập Email!');
    return;
  }

  try {
    // Gọi API trên Vercel để tạo Reset Token lưu vào DB
    const res = await fetch(`${API_URL}/forgot-password.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Tạo liên kết reset mật khẩu dẫn về chính URL hiện tại kèm parameter ?resetToken=...
    const currentUrl = window.location.href.split('?')[0];
    const resetUrl = `${currentUrl}?resetToken=${data.resetToken}`;

    // Gửi Mail chứa liên kết reset qua EmailJS
    await emailjs.send(EMAILJS_SERVICE_ID,'template_v408zlb', {
      to_name: data.name || email,
      to_email: email,
      action_url: resetUrl // Biến {{action_url}} trong template EmailJS
    });

    alert('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!');
    toggleForgotPassword(false);
  } catch (err) {
    alert(err.message || 'Có lỗi xảy ra khi xử lý yêu cầu.');
  }
}

// 4. XÁC NHẬN VÀ ĐẶT LAI MẬT KHẨU MỚI
async function handleResetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');
  const newPassword = document.getElementById('reset-new-password').value;

  if (!newPassword) {
    alert('Vui lòng nhập mật khẩu mới!');
    return;
  }

  try {
    // Gọi API cập nhật mật khẩu trên Vercel
    const res = await fetch(`${API_URL}/reset-password.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');

    // Xoá parameter token khỏi thanh địa chỉ browser và chuyển về giao diện Đăng nhập
    window.history.replaceState({}, document.title, window.location.pathname);
    checkAuthState();
  } catch (err) {
    alert(err.message || 'Lỗi đặt lại mật khẩu.');
  }
}

// 5. ĐĂNG XUẤT
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  checkAuthState();
  alert('Đã đăng xuất!');
}
</script>


------------------------------------------------------------------------------------
2/
You need to register an account on the website https://www.emailjs.com/ to get the EMAILJS_PUBLIC_KEY and EMAILJS_SERVICE_ID, you need make template email to send customer; then fill them in the blogspot html above.

-------------------------------------------------------------------------------------
3/You need to register an account on the website https://vercel.com/

On GitHub, create an API using Vercel, then connect the Vercel address to Blogspot HTML as shown above.



-------------------------------------------------------------------------------------
4/

Connecting to the database on MongoDB:

Go to the dbConnect.js file located at hoctiengnhatmienphi123-blogspot-com\utils\dbConnect.js

You need to register an account on the website https://www.mongodb.com/

Then, get your MONGODB_URI = "value x" and fill it into the environment variable in Vercel.

Key: MONGODB_URI
value: "value x"

-------------------------------------------------------------------------------------
