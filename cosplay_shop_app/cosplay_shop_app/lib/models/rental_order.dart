// lib/models/rental_order.dart
class RentalOrderItem {
  final String productId;
  final String name;
  final double dailyPrice;
  final int quantity;
  final int rentalDays;
  final double subtotal;
  final double deposit;
  final List<dynamic> images;

  RentalOrderItem({
    required this.productId,
    required this.name,
    required this.dailyPrice,
    required this.quantity,
    required this.rentalDays,
    required this.subtotal,
    required this.deposit,
    required this.images,
  });

  factory RentalOrderItem.fromJson(Map<String, dynamic> json) {
    return RentalOrderItem(
      productId: json['product_id'].toString(),
      name: json['name'] ?? '',
      dailyPrice: (json['daily_price'] is int) 
          ? (json['daily_price'] as int).toDouble() 
          : (json['daily_price'] ?? 0.0),
      quantity: json['quantity'] ?? 1,
      rentalDays: json['rental_days'] ?? 1,
      subtotal: (json['subtotal'] is int)
          ? (json['subtotal'] as int).toDouble()
          : (json['subtotal'] ?? 0.0),
      deposit: (json['deposit'] is int)
          ? (json['deposit'] as int).toDouble()
          : (json['deposit'] ?? 0.0),
      images: json['images'] ?? [],
    );
  }

  double get totalPrice => subtotal + deposit;
}

class RentalOrder {
  final String id;
  final String orderNumber;
  final DateTime rentalStartDate;
  final DateTime rentalEndDate;
  final int rentalDays;
  final double subtotal;
  final double depositTotal;
  final double totalAmount;
  final String status;
  final String paymentStatus;
  final String shippingAddress;
  final String paymentMethod;
  final DateTime createdAt;
  final List<RentalOrderItem> items;
  
  // Optional fields
  final DateTime? actualReturnDate;
  final double? lateFee;
  final double? damageFee;
  final double? refundAmount;

  RentalOrder({
    required this.id,
    required this.orderNumber,
    required this.rentalStartDate,
    required this.rentalEndDate,
    required this.rentalDays,
    required this.subtotal,
    required this.depositTotal,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.createdAt,
    required this.items,
    this.actualReturnDate,
    this.lateFee,
    this.damageFee,
    this.refundAmount,
  });

  factory RentalOrder.fromJson(Map<String, dynamic> json) {
    return RentalOrder(
      id: json['id'].toString(),
      orderNumber: json['order_number'] ?? '',
      rentalStartDate: DateTime.parse(json['rental_start_date']),
      rentalEndDate: DateTime.parse(json['rental_end_date']),
      rentalDays: json['rental_days'] ?? 1,
      subtotal: (json['subtotal'] is int)
          ? (json['subtotal'] as int).toDouble()
          : (json['subtotal'] ?? 0.0),
      depositTotal: (json['deposit_total'] is int)
          ? (json['deposit_total'] as int).toDouble()
          : (json['deposit_total'] ?? 0.0),
      totalAmount: (json['total_amount'] is int)
          ? (json['total_amount'] as int).toDouble()
          : (json['total_amount'] ?? 0.0),
      status: json['status'] ?? 'pending',
      paymentStatus: json['payment_status'] ?? 'unpaid',
      shippingAddress: json['shipping_address'] ?? '',
      paymentMethod: json['payment_method'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => RentalOrderItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      actualReturnDate: json['actual_return_date'] != null 
          ? DateTime.parse(json['actual_return_date'])
          : null,
      lateFee: json['late_fee'] != null
          ? ((json['late_fee'] is int)
              ? (json['late_fee'] as int).toDouble()
              : json['late_fee'])
          : null,
      damageFee: json['damage_fee'] != null
          ? ((json['damage_fee'] is int)
              ? (json['damage_fee'] as int).toDouble()
              : json['damage_fee'])
          : null,
      refundAmount: json['refund_amount'] != null
          ? ((json['refund_amount'] is int)
              ? (json['refund_amount'] as int).toDouble()
              : json['refund_amount'])
          : null,
    );
  }

  String get statusText {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'preparing':
        return 'Đang chuẩn bị';
      case 'delivering':
        return 'Đang giao hàng';
      case 'rented':
        return 'Đang cho thuê';
      case 'returning':
        return 'Đang trả lại';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'overdue':
        return 'Quá hạn';
      default:
        return 'Không xác định';
    }
  }

  String get paymentStatusText {
    switch (paymentStatus) {
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'deposit_paid':
        return 'Đã cọc';
      case 'fully_paid':
        return 'Đã thanh toán';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return 'Không xác định';
    }
  }

  bool get canCancel => status == 'pending';
  
  bool get isActive => ['confirmed', 'preparing', 'delivering', 'rented'].contains(status);
  
  bool get isOverdue {
    if (status != 'rented') return false;
    return DateTime.now().isAfter(rentalEndDate);
  }
  
  int get daysUntilReturn {
    if (status != 'rented') return 0;
    return rentalEndDate.difference(DateTime.now()).inDays;
  }
}