import 'dart:convert';
import '../models/cart_item.dart';
import 'api_service.dart';

class CartService {
  final ApiService _api = ApiService();

  // Lấy danh sách giỏ hàng
  Future<List<CartItem>> getCartItems() async {
    final res = await _api.get('/cart');
    
    if (res.statusCode == 200) {
      final List<dynamic> data = json.decode(res.body);
      return data.map((item) => CartItem.fromJson(item as Map<String, dynamic>)).toList();
    } else if (res.statusCode == 401) {
      throw Exception('Vui lòng đăng nhập để xem giỏ hàng');
    } else {
      throw Exception('Không thể tải giỏ hàng: ${res.statusCode}');
    }
  }

  // Thêm sản phẩm vào giỏ
  Future<void> addToCart(String productId, int quantity) async {
    final res = await _api.post('/cart/add', {
      'product_id': productId,
      'quantity': quantity,
    });

    if (res.statusCode != 201 && res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể thêm vào giỏ hàng');
    }
  }

  // Cập nhật số lượng
  Future<void> updateCartItem(String cartItemId, int quantity) async {
    final res = await _api.put('/cart/$cartItemId', {
      'quantity': quantity,
    });

    if (res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể cập nhật giỏ hàng');
    }
  }

  // Xóa sản phẩm
  Future<void> removeCartItem(String cartItemId) async {
    final res = await _api.delete('/cart/$cartItemId');

    if (res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể xóa sản phẩm');
    }
  }

  // Xóa toàn bộ giỏ hàng
  Future<void> clearCart() async {
    final res = await _api.delete('/cart');

    if (res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể xóa giỏ hàng');
    }
  }
}