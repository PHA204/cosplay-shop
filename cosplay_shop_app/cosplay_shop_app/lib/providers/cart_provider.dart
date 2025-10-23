import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../services/cart_service.dart';

class CartProvider with ChangeNotifier {
  final CartService _service = CartService();
  
  List<CartItem> _items = [];
  bool _loading = false;
  String? _error;

  List<CartItem> get items => _items;
  bool get loading => _loading;
  String? get error => _error;
  
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  
  double get totalAmount => _items.fold(
    0.0, 
    (sum, item) => sum + (item.price * item.quantity)
  );

  // Lấy giỏ hàng từ server
  Future<void> loadCart() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _service.getCartItems();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Thêm sản phẩm vào giỏ
  Future<bool> addToCart(String productId, {int quantity = 1}) async {
    try {
      await _service.addToCart(productId, quantity);
      await loadCart(); // Reload cart
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Cập nhật số lượng
  Future<bool> updateQuantity(String cartItemId, int quantity) async {
    if (quantity < 1) return false;

    try {
      await _service.updateCartItem(cartItemId, quantity);
      
      // Update local state
      final index = _items.indexWhere((item) => item.id == cartItemId);
      if (index != -1) {
        _items[index] = _items[index].copyWith(quantity: quantity);
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Tăng số lượng
  Future<void> incrementQuantity(String cartItemId) async {
    final item = _items.firstWhere((item) => item.id == cartItemId);
    await updateQuantity(cartItemId, item.quantity + 1);
  }

  // Giảm số lượng
  Future<void> decrementQuantity(String cartItemId) async {
    final item = _items.firstWhere((item) => item.id == cartItemId);
    if (item.quantity > 1) {
      await updateQuantity(cartItemId, item.quantity - 1);
    }
  }

  // Xóa sản phẩm
  Future<bool> removeItem(String cartItemId) async {
    try {
      await _service.removeCartItem(cartItemId);
      _items.removeWhere((item) => item.id == cartItemId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Xóa toàn bộ giỏ hàng
  Future<bool> clearCart() async {
    try {
      await _service.clearCart();
      _items.clear();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Kiểm tra sản phẩm đã có trong giỏ chưa
  bool isInCart(String productId) {
    return _items.any((item) => item.productId == productId);
  }

  // Lấy số lượng của sản phẩm trong giỏ
  int getProductQuantity(String productId) {
    final item = _items.firstWhere(
      (item) => item.productId == productId,
      orElse: () => CartItem(
        id: '',
        productId: '',
        name: '',
        price: 0,
        quantity: 0,
        images: [],
      ),
    );
    return item.quantity;
  }
}