// lib/providers/wishlist_provider.dart - COMPLETE FIX
import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/wishlist_service.dart';

class WishlistProvider with ChangeNotifier {
  final WishlistService _service = WishlistService();
  
  List<Product> _items = [];
  bool _loading = false;
  String? _error;
  
  // Cache để kiểm tra nhanh
  Set<String> _wishlistIds = {};

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
      print('📋 WishlistProvider: Loading wishlist...');
      _items = await _service.getWishlist();
      
      // Cập nhật cache
      _wishlistIds = _items.map((item) => item.id).toSet();
      
      print('✅ WishlistProvider: Loaded ${_items.length} wishlist items');
      print('📝 WishlistProvider: IDs = $_wishlistIds');
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ WishlistProvider: Load wishlist error: $_error');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Thêm sản phẩm vào wishlist
  Future<bool> addToWishlist(String productId) async {
    try {
      print('➕ WishlistProvider: Adding product $productId to wishlist');
      await _service.addToWishlist(productId);
      
      // Thêm vào cache ngay lập tức
      _wishlistIds.add(productId);
      notifyListeners();
      
      // Reload để lấy thông tin đầy đủ
      await loadWishlist();
      
      print('✅ WishlistProvider: Added to wishlist successfully');
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ WishlistProvider: Add to wishlist error: $_error');
      notifyListeners();
      return false;
    }
  }

  // Xóa sản phẩm khỏi wishlist
  Future<bool> removeFromWishlist(String productId) async {
    try {
      print('➖ WishlistProvider: Removing product $productId from wishlist');
      await _service.removeFromWishlist(productId);
      
      // Xóa khỏi cache và list ngay
      _wishlistIds.remove(productId);
      _items.removeWhere((item) => item.id == productId);
      notifyListeners();
      
      print('✅ WishlistProvider: Removed from wishlist successfully');
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ WishlistProvider: Remove from wishlist error: $_error');
      notifyListeners();
      return false;
    }
  }

  // Toggle wishlist (thêm/xóa)
  Future<bool> toggleWishlist(String productId) async {
    final isInList = isInWishlist(productId);
    print('🔄 WishlistProvider: Toggle wishlist for $productId (currently: $isInList)');
    
    if (isInList) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }

  // Kiểm tra sản phẩm đã có trong wishlist chưa (dùng cache)
  bool isInWishlist(String productId) {
    final result = _wishlistIds.contains(productId);
    // print('🔍 WishlistProvider: Product $productId in wishlist: $result');
    return result;
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}