// lib/models/review.dart
class Review {
  final String id;
  final int rating;
  final String? comment;
  final List<dynamic> images;
  final DateTime time;
  final String userName;
  final String? userAvatar;

  Review({
    required this.id,
    required this.rating,
    this.comment,
    required this.images,
    required this.time,
    required this.userName,
    this.userAvatar,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'].toString(),
      rating: json['rating'] ?? 5,
      comment: json['comment'],
      images: json['images'] ?? [],
      time: DateTime.parse(json['time'] ?? json['created_at']),
      userName: json['name'] ?? 'Anonymous',
      userAvatar: json['avatar_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rating': rating,
      'comment': comment,
      'images': images,
    };
  }
}