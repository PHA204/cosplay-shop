// lib/services/upload_service.dart
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import '../utils/token_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
// import 'dart:io' if (dart.library.html) 'dart:html' as html;
import 'package:http_parser/http_parser.dart' as http_parser;

class UploadService {
  final ImagePicker _picker = ImagePicker();

  /// Hàm chính: Chọn ảnh và upload
  Future<String?> pickAndUploadImage() async {
    try {
      print('📸 Opening image picker...');
      
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (pickedFile == null) {
        print('❌ User cancelled image selection');
        return null;
      }

      print('✅ Image selected: ${pickedFile.path}');

      // Upload khác nhau giữa Web và Mobile
      final url = kIsWeb 
          ? await _uploadImageWeb(pickedFile)
          : await _uploadImageMobile(pickedFile);
      
      print('✅ Upload success: $url');
      return url;

    } catch (e) {
      print('❌ Error in pickAndUploadImage: $e');
      throw Exception('Lỗi khi chọn ảnh: $e');
    }
  }

  /// Upload cho Web
  /// Upload cho Web
Future<String> _uploadImageWeb(XFile imageFile) async {
  try {
    print('📤 Uploading image (WEB MODE)...');

    final token = await TokenStorage.getToken();
    if (token == null) {
      throw Exception('Vui lòng đăng nhập để upload ảnh');
    }

    // Đọc bytes từ XFile
    final bytes = await imageFile.readAsBytes();
    
    // ← THÊM: Lấy MIME type từ tên file
    String contentType = 'image/jpeg'; // Default
    final fileName = imageFile.name.toLowerCase();
    
    if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileName.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (fileName.endsWith('.gif')) {
      contentType = 'image/gif';
    }
    
    print('🖼️ File: ${imageFile.name}, Type: $contentType');
    
    // Tạo multipart request
    final uri = Uri.parse('${ApiConfig.baseUrl}/upload/user/avatar');
    final request = http.MultipartRequest('POST', uri);

    request.headers['Authorization'] = 'Bearer $token';

    // Thêm file từ bytes với MIME type
    request.files.add(
      http.MultipartFile.fromBytes(
        'image',
        bytes,
        filename: imageFile.name,
        contentType: http_parser.MediaType.parse(contentType), // ← THÊM DÒNG NÀY
      ),
    );

    print('📡 Sending request to: $uri');

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    print('📡 Response status: ${response.statusCode}');
    print('📄 Response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final url = data['url'] as String;
      return url;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Upload failed');
    }

  } catch (e) {
    print('❌ Error in _uploadImageWeb: $e');
    throw Exception('Không thể upload ảnh: $e');
  }
}

  /// Upload cho Mobile (iOS/Android)
  Future<String> _uploadImageMobile(XFile imageFile) async {
    try {
      print('📤 Uploading image (MOBILE MODE)...');

      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('Vui lòng đăng nhập để upload ảnh');
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/upload/user/avatar');
      final request = http.MultipartRequest('POST', uri);

      request.headers['Authorization'] = 'Bearer $token';

      // Thêm file từ path (Mobile only)
      final multipartFile = await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
      );
      request.files.add(multipartFile);

      print('📡 Sending request to: $uri');

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('📡 Response status: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final url = data['url'] as String;
        return url;
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Upload failed');
      }

    } catch (e) {
      print('❌ Error in _uploadImageMobile: $e');
      throw Exception('Không thể upload ảnh: $e');
    }
  }

  /// Optional: Chọn từ camera
  Future<String?> pickFromCamera() async {
    try {
      print('📸 Opening camera...');
      
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (pickedFile == null) {
        print('❌ User cancelled camera');
        return null;
      }

      print('✅ Photo taken: ${pickedFile.path}');

      final url = kIsWeb 
          ? await _uploadImageWeb(pickedFile)
          : await _uploadImageMobile(pickedFile);
      
      return url;

    } catch (e) {
      print('❌ Error in pickFromCamera: $e');
      throw Exception('Lỗi khi chụp ảnh: $e');
    }
  }

  /// Helper: Show dialog chọn nguồn ảnh
  static Future<ImageSource?> showImageSourceDialog(BuildContext context) async {
    // Trên Web không có camera
    if (kIsWeb) {
      return ImageSource.gallery;
    }

    return await showDialog<ImageSource>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ảnh từ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Thư viện'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );
  }
}