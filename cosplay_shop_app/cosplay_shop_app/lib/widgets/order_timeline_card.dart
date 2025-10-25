// lib/widgets/order_timeline_card.dart
import 'package:flutter/material.dart';
import '../models/rental_order.dart';

class OrderTimelineCard extends StatelessWidget {
  final RentalOrder order;

  const OrderTimelineCard({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusBadge(theme),
            const SizedBox(height: 16),
            _buildTimelineInfo(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getStatusColor(),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _getStatusLabel(),
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildTimelineInfo(ThemeData theme) {
    switch (order.status) {
      case 'pending':
      case 'confirmed':
      case 'preparing':
        return _buildPreparingInfo(theme);
      
      case 'delivering':
        return _buildDeliveringInfo(theme);
      
      case 'rented':
        return _buildRentedInfo(theme);
      
      case 'returning':
        return _buildReturningInfo(theme);
      
      case 'completed':
        return _buildCompletedInfo(theme);
      
      default:
        return const SizedBox.shrink();
    }
  }

  // 📦 Đang chuẩn bị (chưa giao hàng)
  Widget _buildPreparingInfo(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow(
          theme,
          icon: Icons.calendar_today,
          label: 'Ngày bắt đầu thuê dự kiến',
          value: _formatDate(order.expectedStartDate),
          highlight: true,
        ),
        const SizedBox(height: 8),
        _buildInfoRow(
          theme,
          icon: Icons.event_busy,
          label: 'Ngày trả dự kiến',
          value: _formatDate(order.expectedEndDate),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(Icons.info, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _getPreparingMessage(),
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getPreparingMessage() {
    switch (order.status) {
      case 'pending':
        return 'Đơn hàng đang chờ xác nhận từ shop';
      case 'confirmed':
        return 'Đơn hàng đã được xác nhận, shop đang chuẩn bị';
      case 'preparing':
        return 'Shop đang chuẩn bị trang phục cho bạn';
      default:
        return 'Đang xử lý đơn hàng';
    }
  }

  // 🚚 Đang giao hàng
  Widget _buildDeliveringInfo(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.purple.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.purple.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.local_shipping, color: Colors.purple, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đơn hàng đang được giao',
                      style: TextStyle(
                        color: Colors.purple[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Dự kiến giao ngày ${_formatDate(order.expectedStartDate)}',
                      style: TextStyle(
                        color: Colors.purple[600],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ✅ Đang thuê (ĐÃ GIAO HÀNG)
  Widget _buildRentedInfo(ThemeData theme) {
    if (order.actualEndDate == null) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text('Chưa có thông tin ngày trả thực tế'),
      );
    }

    final now = DateTime.now();
    final endDate = order.actualEndDate!;
    final daysLeft = endDate.difference(now).inDays;

    Color color;
    IconData icon;
    String message;

    if (daysLeft < 0) {
      color = Colors.red;
      icon = Icons.warning;
      message = '⚠️ Đã quá hạn ${-daysLeft} ngày';
    } else if (daysLeft == 0) {
      color = Colors.orange;
      icon = Icons.access_time;
      message = '⚠️ Phải trả hôm nay';
    } else if (daysLeft <= 2) {
      color = Colors.orange;
      icon = Icons.access_time;
      message = '⏰ Còn $daysLeft ngày phải trả';
    } else {
      color = Colors.green;
      icon = Icons.check_circle;
      message = '✅ Còn $daysLeft ngày phải trả';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow(
          theme,
          icon: Icons.play_circle,
          label: 'Ngày bắt đầu thuê (thực tế)',
          value: _formatDate(order.actualStartDate!),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(
          theme,
          icon: Icons.event_busy,
          label: 'Ngày phải trả',
          value: _formatDate(order.actualEndDate!),
          highlight: true,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 🔄 Đang trả hàng
  Widget _buildReturningInfo(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Row(
        children: [
          Icon(Icons.assignment_return, color: Colors.orange, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Shop đang kiểm tra trang phục bạn trả',
              style: TextStyle(color: Colors.orange, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  // ✅ Hoàn thành
  Widget _buildCompletedInfo(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow(
          theme,
          icon: Icons.check_circle,
          label: 'Đã hoàn thành',
          value: order.actualReturnDate != null
              ? _formatDate(order.actualReturnDate!)
              : 'N/A',
        ),
        if (order.lateFee != null && order.lateFee! > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Phí trễ: ${_formatPrice(order.lateFee!)}đ',
              style: const TextStyle(color: Colors.red),
            ),
          ),
        ],
        if (order.damageFee != null && order.damageFee! > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Phí hư hỏng: ${_formatPrice(order.damageFee!)}đ',
              style: const TextStyle(color: Colors.red),
            ),
          ),
        ],
        if (order.refundAmount != null && order.refundAmount! > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Đã hoàn tiền: ${_formatPrice(order.refundAmount!)}đ',
              style: const TextStyle(color: Colors.green),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required String value,
    bool highlight = false,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: highlight ? Colors.blue : Colors.grey),
        const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(color: Colors.black87, fontSize: 14),
              children: [
                TextSpan(text: '$label: '),
                TextSpan(
                  text: value,
                  style: TextStyle(
                    fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
                    color: highlight ? Colors.blue : Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor() {
    switch (order.status) {
      case 'pending': return Colors.amber;
      case 'confirmed': return Colors.blue;
      case 'preparing': return Colors.purple;
      case 'delivering': return Colors.cyan;
      case 'rented': return Colors.green;
      case 'returning': return Colors.orange;
      case 'completed': return Colors.grey;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusLabel() {
    switch (order.status) {
      case 'pending': return '⏳ Chờ xác nhận';
      case 'confirmed': return '✓ Đã xác nhận';
      case 'preparing': return '📦 Đang chuẩn bị';
      case 'delivering': return '🚚 Đang giao';
      case 'rented': return '✅ Đang thuê';
      case 'returning': return '🔄 Đang trả';
      case 'completed': return '✅ Hoàn thành';
      case 'cancelled': return '❌ Đã hủy';
      default: return order.status;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}