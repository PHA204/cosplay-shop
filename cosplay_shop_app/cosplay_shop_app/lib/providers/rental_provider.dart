// lib/providers/rental_provider.dart
import 'package:flutter/material.dart';
import '../models/rental_order.dart';
import '../services/rental_service.dart';

class RentalProvider with ChangeNotifier {
  final RentalService _service = RentalService();
  
  List<RentalOrder> _orders = [];
  bool _loading = false;
  String? _error;

  List<RentalOrder> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;

  // Lấy danh sách đơn thuê
  Future<void> loadRentalOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _service.getUserRentalOrders();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // Tạo đơn thuê mới
  Future<RentalOrder?> createRentalOrder({
    required String paymentMethod,
    required String shippingAddress,
    required String rentalStartDate,
    required String rentalEndDate,
    String deliveryMethod = 'delivery',
    String? notes,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final order = await _service.createRentalOrder(
        paymentMethod: paymentMethod,
        shippingAddress: shippingAddress,
        rentalStartDate: rentalStartDate,
        rentalEndDate: rentalEndDate,
        deliveryMethod: deliveryMethod,
        notes: notes,
      );
      
      // Reload orders
      await loadRentalOrders();
      
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

  // Hủy đơn thuê
  Future<bool> cancelRentalOrder(String orderId) async {
    try {
      await _service.cancelRentalOrder(orderId);
      await loadRentalOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // Kiểm tra tính khả dụng
  Future<bool> checkAvailability({
    required String productId,
    required int quantity,
    required String startDate,
    required String endDate,
  }) async {
    try {
      return await _service.checkProductAvailability(
        productId: productId,
        quantity: quantity,
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      return false;
    }
  }

  // Tính toán chi phí
  Future<Map<String, double>?> calculateCost({
    required String productId,
    required int quantity,
    required String startDate,
    required String endDate,
  }) async {
    try {
      return await _service.calculateRentalCost(
        productId: productId,
        quantity: quantity,
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  // Lọc đơn hàng theo trạng thái
  List<RentalOrder> getOrdersByStatus(String status) {
    return _orders.where((order) => order.status == status).toList();
  }

  // Lấy đơn đang hoạt động
  List<RentalOrder> get activeOrders {
    return _orders.where((order) => order.isActive).toList();
  }

  // Lấy đơn quá hạn
  List<RentalOrder> get overdueOrders {
    return _orders.where((order) => order.isOverdue).toList();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}