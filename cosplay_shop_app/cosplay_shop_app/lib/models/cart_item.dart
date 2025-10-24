// lib/models/cart_item.dart - UPDATED FOR RENTAL SYSTEM
class CartItem {
  final String id;
  final String productId;
  final String name;
  final double price;  // Đây sẽ là daily_price từ backend
  final int quantity;
  final List<dynamic> images;
  final String? size;
  final String? color;

  CartItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
    required this.images,
    this.size,
    this.color,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'].toString(),
      productId: json['product_id'].toString(),
      name: json['name'] ?? '',
      // Backend trả về daily_price cho rental system
      price: _parsePrice(json['daily_price'] ?? json['price']),
      quantity: json['quantity'] ?? 1,
      images: json['images'] ?? [],
      size: json['size'],
      color: json['color'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product_id': productId,
      'name': name,
      'price': price,
      'quantity': quantity,
      'images': images,
      'size': size,
      'color': color,
    };
  }

  CartItem copyWith({
    String? id,
    String? productId,
    String? name,
    double? price,
    int? quantity,
    List<dynamic>? images,
    String? size,
    String? color,
  }) {
    return CartItem(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      name: name ?? this.name,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      images: images ?? this.images,
      size: size ?? this.size,
      color: color ?? this.color,
    );
  }

  // Tính tổng giá theo ngày (sẽ nhân với số ngày thuê khi checkout)
  double get totalPrice => price * quantity;

  // Helper method
  static double _parsePrice(dynamic value) {
    if (value == null) return 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }
}