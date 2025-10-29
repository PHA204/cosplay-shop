// lib/models/product.dart (Updated)
class Product {
  final String id;
  final String name;
  final String characterName;
  final double dailyPrice;        // Giá thuê theo ngày
  final double? weeklyPrice;      // Giá thuê theo tuần (optional)
  final double depositAmount;     // Tiền đặt cọc
  final List<dynamic> images;
  final String? size;
  final int totalQuantity;        // Tổng số lượng
  final int availableQuantity;    // Số lượng có sẵn
  final String? description;
  final String? condition;        // Tình trạng
  final String? categoryId;       // Category ID

  Product({
    required this.id,
    required this.name,
    required this.characterName,
    required this.dailyPrice,
    required this.depositAmount,
    required this.images,
    this.weeklyPrice,
    this.size,
    this.totalQuantity = 1,
    this.availableQuantity = 1,
    this.description,
    this.condition,
    this.categoryId,
  });
  double get deposit => depositAmount;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      characterName: json['character_name'] ?? '',
      dailyPrice: (json['daily_price'] is int) 
          ? (json['daily_price'] as int).toDouble() 
          : (json['daily_price'] ?? 0.0),
      depositAmount: (json['deposit_amount'] is int)
          ? (json['deposit_amount'] as int).toDouble()
          : (json['deposit_amount'] ?? 0.0),
      images: json['images'] ?? [],
      weeklyPrice: json['weekly_price'] != null
          ? ((json['weekly_price'] is int)
              ? (json['weekly_price'] as int).toDouble()
              : json['weekly_price'])
          : null,
      size: json['size'],
      totalQuantity: json['total_quantity'] ?? 1,
      availableQuantity: json['available_quantity'] ?? 1,
      description: json['description'],
      condition: json['condition'],
      categoryId: json['category_id']?.toString(),
    );
  }

  bool get isAvailable => availableQuantity > 0;

  String get conditionText {
    switch (condition) {
      case 'new':
        return 'Mới';
      case 'good':
        return 'Tốt';
      case 'fair':
        return 'Khá';
      default:
        return 'Không rõ';
    }
  }

  // Tính giá thuê theo số ngày
  double calculateRentalPrice(int days) {
    if (weeklyPrice != null && days >= 7) {
      final weeks = days ~/ 7;
      final remainingDays = days % 7;
      return (weeks * weeklyPrice!) + (remainingDays * dailyPrice);
    }
    return days * dailyPrice;
  }
}