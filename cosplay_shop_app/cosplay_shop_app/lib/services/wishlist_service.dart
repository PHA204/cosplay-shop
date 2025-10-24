// lib/services/wishlist_service.dart
import 'dart:convert';
import '../models/product.dart';
import 'api_service.dart';

class WishlistService {
  final ApiService _api = ApiService();

  // Lấy danh sách wishlist
  Future<List<Product>> getWishlist() async {
    try {
      final res = await _api.get('/wishlist');
      
      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        return data.map((item) {
          // Backend trả về nested product object
          return Product(
            id: item['product_id'].toString(),
            name: item['name'] ?? '',
            characterName: item['character_name'] ?? '',
            price: (item['price'] is int) 
                ? (item['price'] as int).toDouble() 
                : (item['price'] ?? 0.0),
            images: item['images'] ?? [],
          );
        }).toList();
      } else if (res.statusCode == 401) {
        throw Exception('Vui lòng đăng nhập để xem danh sách yêu thích');
      } else {
        throw Exception('Không thể tải danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.getWishlist error: $e');
      throw Exception('Không thể tải danh sách yêu thích');
    }
  }

  // Thêm sản phẩm vào wishlist
  Future<void> addToWishlist(String productId) async {
    try {
      print('🔥 Adding to wishlist: $productId');
      
      final res = await _api.post('/wishlist/add', {
        'product_id': productId,
      });

      print('📥 Response status: ${res.statusCode}');
      print('📄 Response body: ${res.body}');

      if (res.statusCode != 201 && res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể thêm vào danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.addToWishlist error: $e');
      rethrow;
    }
  }

  // Xóa sản phẩm khỏi wishlist
  Future<void> removeFromWishlist(String productId) async {
    try {
      print('🗑️ Removing from wishlist: $productId');
      
      final res = await _api.delete('/wishlist/$productId');

      print('📥 Response status: ${res.statusCode}');

      if (res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể xóa khỏi danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.removeFromWishlist error: $e');
      rethrow;
    }
  }
}