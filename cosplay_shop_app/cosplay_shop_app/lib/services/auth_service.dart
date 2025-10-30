import 'dart:convert';
import '../models/user.dart';
import 'api_service.dart';
import '../utils/token_storage.dart';

class AuthService {
  final ApiService _api = ApiService();

  // Đăng ký
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _api.post('/auth/register', {
      'name': name,
      'email': email,
      'password': password,
      if (phone != null) 'phone': phone,
    });

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body);
      final token = data['token'] as String?;
      
      if (token != null) {
        await TokenStorage.saveToken(token);
      }
      
      return {
        'user': User.fromJson(data['user']),
        'token': token,
      };
    } else {
      final body = json.decode(response.body);
      throw Exception(body['error'] ?? 'Đăng ký thất bại');
    }
  }

  // Đăng nhập
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final token = data['token'] as String?;
      
      if (token != null) {
        await TokenStorage.saveToken(token);
      }
      
      return {
        'user': User.fromJson(data['user']),
        'token': token,
      };
    } else {
      final body = json.decode(response.body);
      throw Exception(body['error'] ?? 'Đăng nhập thất bại');
    }
  }

  // Lấy thông tin user hiện tại
  Future<User> getCurrentUser() async {
    final response = await _api.get('/auth/me');

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return User.fromJson(data);
    } else {
      throw Exception('Không thể lấy thông tin người dùng');
    }
  }

  // Cập nhật profile
  Future<User> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (address != null) body['address'] = address;
    if (avatarUrl != null) body['avatar_url'] = avatarUrl;

    final response = await _api.put('/auth/profile', body);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return User.fromJson(data);
    } else {
      final responseBody = json.decode(response.body);
      throw Exception(responseBody['error'] ?? 'Không thể cập nhật profile');
    }
  }

  // Đăng xuất
  Future<void> logout() async {
    await TokenStorage.clear();
  }
  // Đổi mật khẩu
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _api.put('/auth/change-password', {
      'current_password': currentPassword,
      'new_password': newPassword,
    });

    if (response.statusCode == 200) {
      return; // Success
    } else {
      final body = json.decode(response.body);
      throw Exception(body['error'] ?? 'Không thể đổi mật khẩu');
    }
  }

}