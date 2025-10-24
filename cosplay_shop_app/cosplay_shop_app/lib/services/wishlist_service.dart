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
          // Backend trả về nested product object trong wishlist
          final productData = item['product'] ?? item;
          
          return Product(
            id: (productData['id'] ?? productData['product_id'] ?? '').toString(),
            name: productData['name'] ?? '',
            characterName: productData['character_name'] ?? '',
            // Sử dụng daily_price cho rental system
            dailyPrice: _parsePrice(productData['daily_price'] ?? productData['price']),
            weeklyPrice: _parsePrice(productData['weekly_price']),
            depositAmount: _parsePrice(productData['deposit_amount']),
            description: productData['description'] ?? '',
            categoryId: productData['category_id']?.toString(),
            images: List<String>.from(productData['images'] ?? []),
            size: productData['size'] ?? '',
            condition: productData['condition'] ?? 'good',
            totalQuantity: productData['total_quantity'] ?? 1,
            availableQuantity: productData['available_quantity'] ?? 1,
          );
        }).toList();
      } else if (res.statusCode == 401) {
        throw Exception('Vui lòng đăng nhập để xem danh sách yêu thích');
      } else {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể tải danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.getWishlist error: $e');
      if (e is Exception) rethrow;
      throw Exception('Không thể tải danh sách yêu thích: ${e.toString()}');
    }
  }

  // Thêm sản phẩm vào wishlist
  Future<void> addToWishlist(String productId) async {
    try {
      print('🔥 Adding to wishlist: $productId');
      
      final res = await _api.post('/wishlist/add', {
        'product_id': productId,
      });

      print('🔥 Response status: ${res.statusCode}');
      print('📄 Response body: ${res.body}');

      if (res.statusCode != 201 && res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể thêm vào danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.addToWishlist error: $e');
      if (e is Exception) rethrow;
      throw Exception('Không thể thêm vào wishlist: ${e.toString()}');
    }
  }

  // Xóa sản phẩm khỏi wishlist
  Future<void> removeFromWishlist(String productId) async {
    try {
      print('🗑️ Removing from wishlist: $productId');
      
      final res = await _api.delete('/wishlist/$productId');

      print('🔥 Response status: ${res.statusCode}');

      if (res.statusCode != 200 && res.statusCode != 204) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể xóa khỏi danh sách yêu thích');
      }
    } catch (e) {
      print('❌ WishlistService.removeFromWishlist error: $e');
      if (e is Exception) rethrow;
      throw Exception('Không thể xóa khỏi wishlist: ${e.toString()}');
    }
  }

  // Kiểm tra sản phẩm có trong wishlist không
  Future<bool> isInWishlist(String productId) async {
    try {
      final wishlist = await getWishlist();
      return wishlist.any((product) => product.id == productId);
    } catch (e) {
      print('❌ WishlistService.isInWishlist error: $e');
      return false;
    }
  }

  // Toggle wishlist (thêm nếu chưa có, xóa nếu đã có)
  Future<bool> toggleWishlist(String productId) async {
    try {
      final isInList = await isInWishlist(productId);
      
      if (isInList) {
        await removeFromWishlist(productId);
        return false; // Đã xóa
      } else {
        await addToWishlist(productId);
        return true; // Đã thêm
      }
    } catch (e) {
      print('❌ WishlistService.toggleWishlist error: $e');
      rethrow;
    }
  }

  // Helper method để parse price an toàn
  double _parsePrice(dynamic value) {
    if (value == null) return 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }
}