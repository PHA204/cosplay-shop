// lib/services/rental_service.dart
import 'dart:convert';
import '../models/rental_order.dart';
import 'api_service.dart';

class RentalService {
  final ApiService _api = ApiService();

  // Tạo đơn thuê
  Future<RentalOrder> createRentalOrder({
    required String paymentMethod,
    required String shippingAddress,
    required String rentalStartDate,
    required String rentalEndDate,
    String deliveryMethod = 'delivery',
    String? notes,
  }) async {
    final res = await _api.post('/rentals/create', {
      'payment_method': paymentMethod,
      'shipping_address': shippingAddress,
      'rental_start_date': rentalStartDate,
      'rental_end_date': rentalEndDate,
      'delivery_method': deliveryMethod,
      if (notes != null) 'notes': notes,
    });

    if (res.statusCode == 201 || res.statusCode == 200) {
      final data = json.decode(res.body);
      return RentalOrder.fromJson(data['order']);
    } else {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể tạo đơn thuê');
    }
  }

  // Lấy danh sách đơn thuê
  Future<List<RentalOrder>> getUserRentalOrders() async {
    final res = await _api.get('/rentals');

    if (res.statusCode == 200) {
      final List<dynamic> data = json.decode(res.body);
      return data.map((item) => RentalOrder.fromJson(item as Map<String, dynamic>)).toList();
    } else if (res.statusCode == 401) {
      throw Exception('Vui lòng đăng nhập để xem đơn thuê');
    } else {
      throw Exception('Không thể tải danh sách đơn thuê');
    }
  }

  // Lấy chi tiết đơn thuê
  Future<RentalOrder> getRentalOrderById(String orderId) async {
    final res = await _api.get('/rentals/$orderId');

    if (res.statusCode == 200) {
      return RentalOrder.fromJson(json.decode(res.body));
    } else {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể tải thông tin đơn thuê');
    }
  }

  // Hủy đơn thuê
  Future<void> cancelRentalOrder(String orderId) async {
    final res = await _api.put('/rentals/$orderId/cancel', {});

    if (res.statusCode != 200) {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể hủy đơn thuê');
    }
  }

  // Kiểm tra tính khả dụng
  Future<bool> checkProductAvailability({
    required String productId,
    required int quantity,
    required String startDate,
    required String endDate,
  }) async {
    final res = await _api.get(
      '/rentals/check-availability?product_id=$productId&quantity=$quantity&start_date=$startDate&end_date=$endDate'
    );

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      return data['available'] ?? false;
    } else {
      return false;
    }
  }

  // Tính toán chi phí thuê
  Future<Map<String, double>> calculateRentalCost({
    required String productId,
    required int quantity,
    required String startDate,
    required String endDate,
  }) async {
    final start = DateTime.parse(startDate);
    final end = DateTime.parse(endDate);
    final days = end.difference(start).inDays + 1;

    final productRes = await _api.get('/products/$productId');
    if (productRes.statusCode != 200) {
      throw Exception('Không thể tải thông tin sản phẩm');
    }

    final product = json.decode(productRes.body);
    final dailyPrice = (product['daily_price'] is int)
        ? (product['daily_price'] as int).toDouble()
        : (product['daily_price'] ?? 0.0);
    final depositAmount = (product['deposit_amount'] is int)
        ? (product['deposit_amount'] as int).toDouble()
        : (product['deposit_amount'] ?? 0.0);

    final subtotal = dailyPrice * days * quantity;
    final deposit = depositAmount * quantity;
    final total = subtotal + deposit;

    return {
      'daily_price': dailyPrice,
      'rental_days': days.toDouble(),
      'subtotal': subtotal,
      'deposit': deposit,
      'total': total,
    };
  }
}