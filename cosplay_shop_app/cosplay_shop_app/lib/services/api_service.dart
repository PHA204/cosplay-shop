import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../utils/token_storage.dart';

class ApiService {
  final Duration timeout = const Duration(seconds: 10);

  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    final token = await TokenStorage.getToken();
    final h = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    return http.get(uri, headers: h).timeout(timeout);
  }

  Future<http.Response> post(String path, Object body, {Map<String, String>? headers}) async {
    final token = await TokenStorage.getToken();
    final h = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    return http.post(uri, body: json.encode(body), headers: h).timeout(timeout);
  }

  Future<http.Response> put(String path, Object body, {Map<String, String>? headers}) async {
    final token = await TokenStorage.getToken();
    final h = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    return http.put(uri, body: json.encode(body), headers: h).timeout(timeout);
  }

  Future<http.Response> delete(String path, {Map<String, String>? headers}) async {
    final token = await TokenStorage.getToken();
    final h = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (headers != null) ...headers,
    };
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    return http.delete(uri, headers: h).timeout(timeout);
  }
}