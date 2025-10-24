import 'dart:convert';
import '../models/order.dart';
import 'api_service.dart';

class OrderService {
  final ApiService _api = ApiService();

  // Tạo đơn hàng
  Future<Order> createOrder({
    required String payMethod,
    required String shippingAddress,
    required List<dynamic> items,
    required double totalAmount,
  }) async {
    final res = await _api.post('/orders/create', {
      'pay_method': payMethod,
      'shipping_address': shippingAddress,
      'items': items,
      'total_amount': totalAmount,
    });

    if (res.statusCode == 201 || res.statusCode == 200) {
      final data = json.decode(res.body);
      return Order.fromJson(data['order']);
    } else {
      final body = json.decode(res.body);
      throw Exception(body['error'] ?? 'Không thể tạo đơn hàng');
    }
  }

 Future<List<Order>> getUserOrders() async {
  final res = await _api.get('/orders');

  if (res.statusCode == 200) {
    final List<dynamic> data = json.decode(res.body);
    return data.map((item) => Order.fromJson(item as Map<String, dynamic>)).toList();
  } else if (res.statusCode == 401) {
    throw Exception('Vui lòng đăng nhập để xem đơn hàng');
  } else {
    throw Exception('Không thể tải danh sách đơn hàng');
  }
}

  Future<Order> getOrderById(String orderId) async {
  final res = await _api.get('/orders/$orderId');

  if (res.statusCode == 200) {
    return Order.fromJson(json.decode(res.body));
  } else {
    final body = json.decode(res.body);
    throw Exception(body['error'] ?? 'Không thể tải thông tin đơn hàng');
  }
}

 Future<void> cancelOrder(String orderId) async {
  final res = await _api.put('/orders/$orderId/cancel', {});

  if (res.statusCode != 200) {
    final body = json.decode(res.body);
    throw Exception(body['error'] ?? 'Không thể hủy đơn hàng');
  }
}
}
