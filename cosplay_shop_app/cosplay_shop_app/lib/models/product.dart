class Product {
  final String id;
  final String name;
  final String characterName;
  final double price;
  final List<dynamic> images;

  Product({
    required this.id,
    required this.name,
    required this.characterName,
    required this.price,
    required this.images,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      characterName: json['character_name'] ?? '',
      price: (json['price'] is int) ? (json['price'] as int).toDouble() : (json['price'] ?? 0.0),
      images: json['images'] ?? [],
    );
  }
}
