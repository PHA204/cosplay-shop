import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/product_service.dart';

class ProductProvider with ChangeNotifier {
  final ProductService _service = ProductService();
  List<Product> products = [];
  bool loading = false;
  String? error;

  Future<void> loadProducts({int page = 1}) async {
    loading = true; error = null; notifyListeners();
    try {
      products = await _service.fetchProducts(page: page);
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false; notifyListeners();
    }
  }
}
