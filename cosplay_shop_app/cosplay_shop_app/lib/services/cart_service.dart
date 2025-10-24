// lib/services/cart_service.dart - COMPLETE WITH DEBUGGING
import 'dart:convert';
import '../models/cart_item.dart';
import 'api_service.dart';

class CartService {
  final ApiService _api = ApiService();

  // Lấy danh sách giỏ hàng
  Future<List<CartItem>> getCartItems() async {
    try {
      print('🛒 Fetching cart items...');
      
      final res = await _api.get('/cart');
      
      print('📡 Cart response status: ${res.statusCode}');
      print('📄 Cart response body: ${res.body}');
      
      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        print('✅ Loaded ${data.length} cart items');
        return data.map((item) => CartItem.fromJson(item as Map<String, dynamic>)).toList();
      } else if (res.statusCode == 401) {
        throw Exception('Vui lòng đăng nhập để xem giỏ hàng');
      } else {
        print('❌ Failed to load cart: ${res.statusCode}');
        throw Exception('Không thể tải giỏ hàng: ${res.statusCode}');
      }
    } catch (e) {
      print('❌ Exception in getCartItems: $e');
      rethrow;
    }
  }

  // Thêm sản phẩm vào giỏ
  Future<void> addToCart(String productId, int quantity) async {
    try {
      print('➕ Adding to cart: $productId x $quantity');
      
      final res = await _api.post('/cart/add', {
        'product_id': productId,
        'quantity': quantity,
      });

      print('📡 Add to cart response: ${res.statusCode}');
      print('📄 Response body: ${res.body}');

      if (res.statusCode != 201 && res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể thêm vào giỏ hàng');
      }
      
      print('✅ Added to cart successfully');
    } catch (e) {
      print('❌ Exception in addToCart: $e');
      rethrow;
    }
  }

  // Cập nhật số lượng
  Future<void> updateCartItem(String cartItemId, int quantity) async {
    try {
      print('✏️ Updating cart item: $cartItemId to quantity $quantity');
      
      final res = await _api.put('/cart/$cartItemId', {
        'quantity': quantity,
      });

      print('📡 Update response: ${res.statusCode}');

      if (res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể cập nhật giỏ hàng');
      }
      
      print('✅ Updated cart item successfully');
    } catch (e) {
      print('❌ Exception in updateCartItem: $e');
      rethrow;
    }
  }

  // Xóa sản phẩm
  Future<void> removeCartItem(String cartItemId) async {
    try {
      print('🗑️ Removing cart item: $cartItemId');
      
      final res = await _api.delete('/cart/$cartItemId');

      print('📡 Remove response: ${res.statusCode}');

      if (res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể xóa sản phẩm');
      }
      
      print('✅ Removed cart item successfully');
    } catch (e) {
      print('❌ Exception in removeCartItem: $e');
      rethrow;
    }
  }

  // Xóa toàn bộ giỏ hàng
  Future<void> clearCart() async {
    try {
      print('🧹 Clearing cart...');
      
      final res = await _api.delete('/cart');

      print('📡 Clear cart response: ${res.statusCode}');

      if (res.statusCode != 200) {
        final body = json.decode(res.body);
        throw Exception(body['error'] ?? 'Không thể xóa giỏ hàng');
      }
      
      print('✅ Cart cleared successfully');
    } catch (e) {
      print('❌ Exception in clearCart: $e');
      rethrow;
    }
  }
}