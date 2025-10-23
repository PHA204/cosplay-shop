import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../utils/token_storage.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _service = AuthService();
  
  User? _user;
  bool _isAuthenticated = false;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get loading => _loading;
  String? get error => _error;

  // Kiểm tra đã đăng nhập chưa khi mở app
  Future<void> checkAuthStatus() async {
    final token = await TokenStorage.getToken();
    if (token != null) {
      try {
        _user = await _service.getCurrentUser();
        _isAuthenticated = true;
        notifyListeners();
      } catch (e) {
        // Token hết hạn hoặc không hợp lệ
        await logout();
      }
    }
  }

  // Đăng ký
  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _service.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      
      _user = result['user'];
      _isAuthenticated = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Đăng nhập
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _service.login(email: email, password: password);
      _user = result['user'];
      _isAuthenticated = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Đăng xuất
  Future<void> logout() async {
    await _service.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  // Cập nhật thông tin user
  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? avatarUrl,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _service.updateProfile(
        name: name,
        phone: phone,
        address: address,
        avatarUrl: avatarUrl,
      );
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}