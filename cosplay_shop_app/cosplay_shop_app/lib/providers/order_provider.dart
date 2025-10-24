import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/order_service.dart';

class OrderProvider with ChangeNotifier {
  final OrderService _service = OrderService();
  
  List<Order> _orders = [];
  bool _loading = false;
  String? _error;

  List<Order> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;

  // Lấy danh sách đơn hàng
  Future<void> loadOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _service.getUserOrders();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Tạo đơn hàng mới
  Future<Order?> createOrder({
    required String payMethod,
    required String shippingAddress,
    required List<dynamic> items,
    required double totalAmount,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final order = await _service.createOrder(
        payMethod: payMethod,
        shippingAddress: shippingAddress,
        items: items,
        totalAmount: totalAmount,
      );
      
      // Reload orders
      await loadOrders();
      
      return order;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future cancelOrder(String orderId) async {}

}
