🎭 Cosplay Shop - Hướng Dẫn Setup Hoàn Chỉnh
📋 Mục lục

Backend Setup
Flutter App Setup
Database Setup
Chạy ứng dụng
Troubleshooting


🖥️ Backend Setup
1. Cài đặt dependencies
bashcd cosplay-shop-backend
npm install
2. Tạo file .env
env# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cosplay_shop

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development
3. Khởi động backend
bashnpm run dev
Backend sẽ chạy ở http://localhost:3000

📱 Flutter App Setup
1. Cài đặt dependencies
bashcd cosplay_shop_app
flutter pub get
2. Cấu hình API endpoint
File: lib/config/api_config.dart

Android Emulator: Dùng 10.0.2.2

dartstatic const String baseUrl = "http://10.0.2.2:3000/api";

iOS Simulator: Dùng localhost

dartstatic const String baseUrl = "http://localhost:3000/api";

Device thật: Dùng IP máy tính

dartstatic const String baseUrl = "http://192.168.1.XXX:3000/api";
Cách tìm IP:

Windows: ipconfig trong CMD
Mac/Linux: ifconfig hoặc ip addr

3. Cập nhật file lib/main.dart
Đổi home: thành:
darthome: const MainNavigation(),
4. Thêm các file mới
Tạo các file sau:

lib/screens/profile_screen.dart
lib/screens/main_navigation.dart
lib/screens/wishlist_screen.dart
Cập nhật lib/screens/cart_screen.dart
Cập nhật lib/screens/home_screen.dart
Sửa lib/services/image_service.dart


🗄️ Database Setup
1. Cài đặt PostgreSQL

Download từ postgresql.org
Cài đặt và tạo password cho user postgres

2. Tạo database
sqlCREATE DATABASE cosplay_shop;
3. Chạy migration
bashcd cosplay-shop-backend
npm run migrate
4. Seed dữ liệu mẫu
bashnode scripts/seed-products.js

🚀 Chạy Ứng Dụng
Backend
bashcd cosplay-shop-backend
npm run dev
Flutter App
Android:
bashcd cosplay_shop_app
flutter run
iOS:
bashflutter run -d ios
Chrome (Web):
bashflutter run -d chrome

🔧 Troubleshooting
❌ Ảnh không hiển thị
Giải pháp:

Kiểm tra AndroidManifest.xml có INTERNET permission:

xml<uses-permission android:name="android.permission.INTERNET"/>
<application android:usesCleartextTraffic="true">

Kiểm tra API config dùng đúng IP
Test URL ảnh trực tiếp trong browser
Check console log trong Flutter để xem error

❌ Lỗi kết nối API

Backend có đang chạy không?

bashcurl http://localhost:3000/api/products

Firewall block? Tắt firewall tạm để test
Emulator vs Device:

Emulator: 10.0.2.2
Device: IP máy tính



❌ Database error
bash# Reset database
npm run reset-db
npm run migrate
node scripts/seed-products.js
❌ Port đã được sử dụng
Backend:
bash# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill

📦 Các tính năng đã hoàn thành
✅ Backend

 API Authentication (Register/Login)
 Product CRUD
 Cart Management
 Order Processing
 Reviews
 Wishlist

✅ Frontend

 Home Screen với product grid
 Product Detail
 Shopping Cart
 User Profile
 Login/Register
 Bottom Navigation
 Wishlist (UI)
 Modern Material 3 Design


🎨 Screenshots Mô Tả
Home Screen

Grid hiển thị sản phẩm
Search bar
Category filters
Add to cart nhanh

Cart

Hiển thị items
Tăng/giảm số lượng
Swipe to delete
Tổng tiền

Profile

Thông tin user
Edit profile
Logout


🔑 Test Account
Sau khi chạy seed, đăng ký account mới hoặc test với:
Email: test@example.com
Password: 123456

📞 Support
Nếu gặp vấn đề:

Check logs trong console
Xem file TROUBLESHOOTING.md
Google error message
Check GitHub Issues


🎯 Next Steps
Các tính năng có thể mở rộng:

 Payment integration (VNPay, Momo)
 Order tracking
 Push notifications
 Product search with filters
 User reviews & ratings
 Wishlist sync with backend
 Image upload
 Admin dashboard


Happy Coding! 🎉