import 'dart:convert';
import '../models/product.dart';
import 'api_service.dart';

class ProductService {
  final ApiService _api = ApiService();

  Future<List<Product>> fetchProducts({int page = 1, int limit = 20, String? search, String? categoryId}) async {
    final query = <String, String>{ 'page': '$page', 'limit': '$limit' };
    if (search != null) query['search'] = search;
    if (categoryId != null) query['category_id'] = categoryId;

    final qs = query.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final res = await _api.get('/products?$qs');
    if (res.statusCode == 200) {
      final body = json.decode(res.body);
      // body expected { data: [...], total:..., page:..., limit:... }
      final list = body['data'] as List<dynamic>;
      return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load products: ${res.statusCode}');
    }
  }

  Future<Product> fetchProductById(String id) async {
    final res = await _api.get('/products/$id');
    if (res.statusCode == 200) {
      return Product.fromJson(json.decode(res.body) as Map<String, dynamic>);
    } else {
      throw Exception('Failed to load product');
    }
  }
}
