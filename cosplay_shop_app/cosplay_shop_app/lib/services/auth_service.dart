import 'dart:convert';
// ignore: unused_import
import 'package:http/http.dart' as http;
import 'api_service.dart';
import '../utils/token_storage.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<bool> login(String email, String password) async {
    final response = await _api.post('/auth/login', { 'email': email, 'password': password });
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final token = data['token'] as String?;
      if (token != null) {
        await TokenStorage.saveToken(token);
        return true;
      }
    }
    return false;
  }

  Future<void> logout() async {
    await TokenStorage.clear();
  }
}
