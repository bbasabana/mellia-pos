import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';
import 'package:mellia_pos_mobile/features/sales/widgets/payment_modal.dart';
import 'package:mellia_pos_mobile/features/clients/widgets/client_selection_modal.dart';

class CartWidget extends ConsumerWidget {
  const CartWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartNotifierProvider);
    final cartItems = cartState.items.values.toList();

    return Container(
      width: 350, // Fixed width side panel
      color: Colors.white,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Panier",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (cartItems.isNotEmpty)
                      IconButton(
                        icon: const Icon(
                          Icons.delete_outline,
                          color: Colors.grey,
                        ),
                        onPressed: () =>
                            ref.read(cartNotifierProvider.notifier).clearCart(),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final selected = await showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => Padding(
                        padding: EdgeInsets.only(
                          top: MediaQuery.of(context).viewPadding.top + 50,
                        ),
                        child: const ClientSelectionModal(),
                      ),
                    );

                    if (selected != null) {
                      ref
                          .read(cartNotifierProvider.notifier)
                          .setClient(selected);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: cartState.selectedClient != null
                          ? AppTheme.primaryBlue.withOpacity(0.1)
                          : Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: cartState.selectedClient != null
                            ? AppTheme.primaryBlue
                            : Colors.grey[300]!,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.person,
                          color: cartState.selectedClient != null
                              ? AppTheme.primaryBlue
                              : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            cartState.selectedClient?.name ??
                                "Sélectionner un client",
                            style: TextStyle(
                              color: cartState.selectedClient != null
                                  ? AppTheme.primaryBlue
                                  : Colors.black,
                              fontWeight: cartState.selectedClient != null
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                        if (cartState.selectedClient != null)
                          InkWell(
                            onTap: () => ref
                                .read(cartNotifierProvider.notifier)
                                .setClient(null),
                            child: const Icon(Icons.close, size: 16),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: cartItems.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_basket_outlined,
                          size: 48,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 8),
                        Text(
                          "Panier vide",
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cartItems.length,
                    itemBuilder: (context, index) {
                      final item = cartItems[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            // Qty Controls
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                children: [
                                  InkWell(
                                    onTap: () => ref
                                        .read(cartNotifierProvider.notifier)
                                        .removeItem(item.product.id),
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      child: Icon(Icons.remove, size: 16),
                                    ),
                                  ),
                                  Text(
                                    "${item.quantity}",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  InkWell(
                                    onTap: () => ref
                                        .read(cartNotifierProvider.notifier)
                                        .addItem(item.product),
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      child: Icon(Icons.add, size: 16),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    "\$${item.unitPriceUsd} / ${item.unitPriceCdf.toInt()} FC",
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Total
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  "\$${item.totalUsd.toStringAsFixed(1)}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  "${item.totalCdf.toInt()} FC",
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Footer Totals
          if (cartItems.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              color: const Color(0xFFF8FAFC),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Total (USD)",
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        "\$${cartState.totalUsd.toStringAsFixed(2)}",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Total (CDF)",
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        "${cartState.totalCdf.toInt()} FC",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppTheme.orange600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    text:
                        "Encaisser (\$${cartState.totalUsd.toStringAsFixed(2)})",
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (ctx) => Padding(
                          padding: EdgeInsets.only(
                            bottom: MediaQuery.of(context).viewInsets.bottom,
                          ),
                          child: const PaymentModal(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
