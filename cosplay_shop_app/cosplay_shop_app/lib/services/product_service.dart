// lib/services/product_service.dart - WITH DEBUGGING
import 'dart:convert';
import '../models/product.dart';
import 'api_service.dart';

class ProductService {
  final ApiService _api = ApiService();

  Future<List<Product>> fetchProducts({
    int page = 1, 
    int limit = 20, 
    String? search, 
    String? categoryId
  }) async {
    try {
      final query = <String, String>{
        'page': '$page', 
        'limit': '$limit'
      };
      
      if (search != null) query['search'] = search;
      if (categoryId != null) query['category_id'] = categoryId;

      final qs = query.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      print('🔍 Fetching products: /products?$qs');
      
      final res = await _api.get('/products?$qs');
      
      print('📡 Response status: ${res.statusCode}');
      print('📄 Response body preview: ${res.body.substring(0, res.body.length > 200 ? 200 : res.body.length)}');
      
      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final list = body['data'] as List<dynamic>;
        
        print('✅ Loaded ${list.length} products');
        
        return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        print('❌ Failed to load products: ${res.statusCode}');
        print('❌ Error body: ${res.body}');
        throw Exception('Failed to load products: ${res.statusCode}');
      }
    } catch (e) {
      print('❌ Exception in fetchProducts: $e');
      rethrow;
    }
  }

  Future<Product> fetchProductById(String id) async {
    try {
      print('🔍 Fetching product by ID: $id');
      
      final res = await _api.get('/products/$id');
      
      print('📡 Response status: ${res.statusCode}');
      print('📄 Response body: ${res.body}');
      
      if (res.statusCode == 200) {
        final data = json.decode(res.body) as Map<String, dynamic>;
        print('✅ Product loaded successfully');
        return Product.fromJson(data);
      } else {
        print('❌ Failed to load product: ${res.statusCode}');
        print('❌ Error body: ${res.body}');
        throw Exception('Failed to load product: ${res.statusCode}');
      }
    } catch (e) {
      print('❌ Exception in fetchProductById: $e');
      rethrow;
    }
  }
}