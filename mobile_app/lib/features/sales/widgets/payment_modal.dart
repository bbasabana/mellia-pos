import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

class PaymentModal extends ConsumerStatefulWidget {
  const PaymentModal({super.key});

  @override
  ConsumerState<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends ConsumerState<PaymentModal> {
  String selectedMethod = 'CASH';
  bool isProcessing = false;

  final methods = [
    {'id': 'CASH', 'label': 'Espèces', 'icon': Icons.payments_outlined},
    {'id': 'CARD', 'label': 'Carte', 'icon': Icons.credit_card},
    {
      'id': 'MOBILE_MONEY',
      'label': 'Mobile Money',
      'icon': Icons.phone_android,
    },
  ];

  Future<void> _processPayment() async {
    setState(() => isProcessing = true);
    try {
      final cart = ref.read(cartNotifierProvider);
      final repo = await ref.read(salesRepositoryProvider.future);

      await repo.createSale(
        items: cart.items.values.toList(),
        paymentMethod: selectedMethod,
        clientId: cart.selectedClient?.id,
        status: "COMPLETED",
      );

      // Success
      if (mounted) {
        ref.read(cartNotifierProvider.notifier).clearCart();
        context.pop(); // Close modal
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Vente validée avec succès !"),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartNotifierProvider);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "Paiement",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Totals
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.orange50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.orange200),
            ),
            child: Column(
              children: [
                Text(
                  "${cart.totalCdf.toInt()} FC",
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.orange600,
                  ),
                ),
                Text(
                  "\$${cart.totalUsd.toStringAsFixed(2)}",
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF9A3412),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            "Mode de paiement",
            style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
          ),
          const SizedBox(height: 12),

          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: methods.map((m) {
              final isSelected = selectedMethod == m['id'];
              return ChoiceChip(
                label: Text(m['label'] as String),
                avatar: Icon(
                  m['icon'] as IconData,
                  size: 18,
                  color: isSelected ? Colors.white : Colors.black,
                ),
                selected: isSelected,
                onSelected: (_) =>
                    setState(() => selectedMethod = m['id'] as String),
                selectedColor: AppTheme.primaryBlue,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : Colors.black,
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 32),
          PrimaryButton(
            text: "Valider le paiement",
            isLoading: isProcessing,
            onPressed: _processPayment,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
