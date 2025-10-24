// lib/services/review_service.dart
import 'dart:convert';
import '../models/review.dart';
import 'api_service.dart';

class ReviewService {
  final ApiService _api = ApiService();

  // Lấy reviews của sản phẩm
  Future<Map<String, dynamic>> getProductReviews(
    String productId, {
    int page = 1,
    int limit = 10,
  }) async {
    final res = await _api.get('/reviews/product/$productId?page=$page&limit=$limit');

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      final reviews = (data['data'] as List<dynamic>)
          .map((item) => Review.fromJson(item as Map<String, dynamic>))
          .toList();

      return {
        'reviews': reviews,
        'total': data['total'] ?? 0,
        'page': data['page'] ?? 1,
      };
    } else {
      throw Exception('Không thể tải đánh giá');
    }
  }

  // Tạo review mới
  Future<Review> createReview({
    required String productId,
    required int rating,
    String? comment,
    List<String>? images,
  }) async {
    final res = await _api.post('/reviews', {
      'product_id': productId,
      'rating': rating,
      'comment': comment,
      'images': images ?? [],
    });

    if (res.statusCode == 201 || res.statusCode == 200) {
      return Review.fromJson(json.decode(res.body));
    } else {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể gửi đánh giá');
    }
  }

  // Cập nhật review
  Future<Review> updateReview({
    required String reviewId,
    int? rating,
    String? comment,
    List<String>? images,
  }) async {
    final body = <String, dynamic>{};
    if (rating != null) body['rating'] = rating;
    if (comment != null) body['comment'] = comment;
    if (images != null) body['images'] = images;

    final res = await _api.put('/reviews/$reviewId', body);

    if (res.statusCode == 200) {
      return Review.fromJson(json.decode(res.body));
    } else {
      final resBody = json.decode(res.body);
      throw Exception(resBody['error'] ?? 'Không thể cập nhật đánh giá');
    }
  }

  // Xóa review
  Future<void> deleteReview(String reviewId) async {
    final res = await _api.delete('/reviews/$reviewId');

    if (res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể xóa đánh giá');
    }
  }
}