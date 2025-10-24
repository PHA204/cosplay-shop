// lib/providers/wishlist_provider.dart
import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/wishlist_service.dart';

class WishlistProvider with ChangeNotifier {
  final WishlistService _service = WishlistService();
  
  List<Product> _items = [];
  bool _loading = false;
  String? _error;

  List<Product> get items => _items;
  bool get loading => _loading;
  String? get error => _error;
  
  int get itemCount => _items.length;

  // Lấy danh sách yêu thích từ server
  Future<void> loadWishlist() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _service.getWishlist();
      print('✅ Loaded ${_items.length} wishlist items');
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ Load wishlist error: $_error');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Thêm sản phẩm vào wishlist
  Future<bool> addToWishlist(String productId) async {
    try {
      print('➕ Adding product $productId to wishlist');
      await _service.addToWishlist(productId);
      await loadWishlist(); // Reload wishlist
      print('✅ Added to wishlist successfully');
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ Add to wishlist error: $_error');
      notifyListeners();
      return false;
    }
  }

  // Xóa sản phẩm khỏi wishlist
  Future<bool> removeFromWishlist(String productId) async {
    try {
      print('➖ Removing product $productId from wishlist');
      await _service.removeFromWishlist(productId);
      _items.removeWhere((item) => item.id == productId);
      print('✅ Removed from wishlist successfully');
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ Remove from wishlist error: $_error');
      notifyListeners();
      return false;
    }
  }

  // Toggle wishlist (thêm/xóa)
  Future<bool> toggleWishlist(String productId) async {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }

  // Kiểm tra sản phẩm đã có trong wishlist chưa
  bool isInWishlist(String productId) {
    final result = _items.any((item) => item.id == productId);
    print('🔍 Product $productId in wishlist: $result');
    return result;
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}