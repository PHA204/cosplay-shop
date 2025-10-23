import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/product.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  const ProductCard({required this.product, this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    final imageUrl = product.images.isNotEmpty ? product.images[0].toString() : null;
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl != null)
              SizedBox(
                height: 140,
                width: double.infinity,
                child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover),
              )
            else
              Container(height: 140, color: Colors.grey[200]),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Text('${product.price.toStringAsFixed(0)} VNĐ'),
            )
          ],
        ),
      ),
    );
  }
}
