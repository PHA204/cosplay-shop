class CartItem {
  final String id;
  final String productId;
  final String name;
  final double price;
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
      price: (json['price'] is int) 
          ? (json['price'] as int).toDouble() 
          : (json['price'] ?? 0.0),
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

  double get totalPrice => price * quantity;
}