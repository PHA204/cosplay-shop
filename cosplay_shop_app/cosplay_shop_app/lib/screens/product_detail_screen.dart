import 'package:flutter/material.dart';
import '../services/product_service.dart';
import '../models/product.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({required this.productId, super.key});
  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ProductService _service = ProductService();
  Product? product;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      product = await _service.fetchProductById(widget.productId);
    } catch (e) {
      error = e.toString();
    } finally {
      setState(() { loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (error != null) return Scaffold(body: Center(child: Text('Lỗi: $error')));
    return Scaffold(
      appBar: AppBar(title: Text(product!.name)),
      body: SingleChildScrollView(
        child: Column(
          children: [
            if (product!.images.isNotEmpty) Image.network(product!.images[0], height: 300, fit: BoxFit.cover),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(product!.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('${product!.price.toStringAsFixed(0)} VNĐ', style: const TextStyle(fontSize: 18)),
            ),
            // thêm nút Thêm vào giỏ, Wishlist, mô tả...
          ],
        ),
      ),
    );
  }
}
