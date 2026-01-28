import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';
import 'package:mellia_pos_mobile/features/sales/widgets/receipt_modal.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

class PaymentModal extends ConsumerStatefulWidget {
  const PaymentModal({super.key});

  @override
  ConsumerState<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends ConsumerState<PaymentModal> {
  String selectedMethod = 'CASH';
  bool isProcessing = false;

  final TextEditingController _amountController = TextEditingController();

  Future<void> _processPayment() async {
    final cart = ref.read(cartNotifierProvider);
    if (cart.items.isEmpty) return;

    setState(() => isProcessing = true);
    try {
      final repo = await ref.read(salesRepositoryProvider.future);
      final cartSnapshot = cart; // Keep a reference
      final amountPaid =
          double.tryParse(_amountController.text) ?? cartSnapshot.totalUsd;

      final Map<String, dynamic> saleData;
      if (cartSnapshot.activeDraftId != null) {
        // Finalize existing draft
        saleData = await repo.updateSale(
          id: cartSnapshot.activeDraftId!,
          items: cartSnapshot.items.values.toList(),
          status: "COMPLETED",
          paymentMethod: selectedMethod,
          orderType: cartSnapshot.orderType,
          deliveryInfo: cartSnapshot.deliveryInfo,
        );
      } else {
        // Create new sale
        saleData = await repo.createSale(
          items: cartSnapshot.items.values.toList(),
          paymentMethod: selectedMethod,
          clientId: cartSnapshot.selectedClient?.id,
          status: "COMPLETED",
          orderType: cartSnapshot.orderType,
          deliveryInfo: cartSnapshot.deliveryInfo,
        );
      }

      // Success
      if (mounted) {
        ref.read(cartNotifierProvider.notifier).clearCart();
        context.pop(); // Close PaymentModal

        // Show Receipt
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (ctx) => ReceiptModal(
            saleData: saleData,
            paymentMethod: selectedMethod,
            amountPaid: amountPaid,
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

  final methods = [
    {'id': 'CASH', 'label': 'Espèces', 'icon': Icons.payments_outlined},
    {'id': 'CARD', 'label': 'Carte', 'icon': Icons.credit_card},
    {
      'id': 'MOBILE_MONEY',
      'label': 'Mobile Money',
      'icon': Icons.phone_android,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartNotifierProvider);

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "Finalisation de la vente",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Totals
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    "\$${cart.totalUsd.toStringAsFixed(2)}",
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                  Text(
                    "${cart.totalCdf.toInt()} FC",
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (selectedMethod == 'CASH') ...[
              const Text(
                "Montant Reçu (\$)",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                autofocus: true,
                decoration: InputDecoration(
                  hintText: cart.totalUsd.toStringAsFixed(2),
                  prefixIcon: const Icon(Icons.attach_money),
                ),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
            ],

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
                  label: Text(m['label']! as String),
                  avatar: Icon(
                    m['icon']! as IconData,
                    size: 18,
                    color: isSelected ? Colors.white : Colors.black,
                  ),
                  selected: isSelected,
                  onSelected: (_) =>
                      setState(() => selectedMethod = m['id']! as String),
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
      ),
    );
  }
}
