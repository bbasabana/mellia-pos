import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/constants/app_assets.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReceiptModal extends ConsumerWidget {
  final Map<String, dynamic> saleData;
  final String paymentMethod;
  final double amountPaid;

  const ReceiptModal({
    super.key,
    required this.saleData,
    required this.paymentMethod,
    required this.amountPaid,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).asData?.value;
    final createdAt =
        DateTime.tryParse(saleData['createdAt'] ?? "") ?? DateTime.now();
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    final items = saleData['items'] as List? ?? [];
    final totalUsd =
        double.tryParse(saleData['totalNet']?.toString() ?? "0") ?? 0.0;
    final totalCdf =
        double.tryParse(saleData['totalCdf']?.toString() ?? "0") ?? 0.0;
    final ticketNum = saleData['ticketNum'] ?? "N/A";
    final clientName = saleData['client']?['name'] ?? "Passant";

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            Image.asset(AppAssets.logo, height: 60),
            const SizedBox(height: 12),
            const Text(
              "MELLIA RESTO",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
            ),
            const Text(
              "10, Bypass, Mont-ngafula, Kinshasa",
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const Divider(height: 32, thickness: 1),

            // Info
            _buildInfoRow("Ticket", "#$ticketNum"),
            _buildInfoRow("Date", dateFormat.format(createdAt)),
            _buildInfoRow("Caissier", user?.name ?? "N/A"),
            _buildInfoRow("Client", clientName),
            const Divider(height: 32, thickness: 1),

            // Items
            ...items.map((item) {
              final product = item['product'] ?? {};
              final qty = double.tryParse(item['quantity'].toString()) ?? 1.0;
              final price =
                  double.tryParse(item['unitPrice'].toString()) ?? 0.0;

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product['name'] ?? "Inconnu",
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            "${qty.toInt()} x \$${price.toStringAsFixed(2)}",
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      "\$${(qty * price).toStringAsFixed(2)}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            }),

            const Divider(height: 32, thickness: 1),

            // Totals
            _buildTotalRow("SOUS-TOTAL", "\$${totalUsd.toStringAsFixed(2)}"),
            _buildTotalRow("TVA (0%)", "\$0.00"),
            const SizedBox(height: 12),
            _buildTotalRow(
              "TOTAL",
              "\$${totalUsd.toStringAsFixed(2)}",
              isBold: true,
            ),
            _buildTotalRow(
              "TOTAL (FC)",
              "${NumberFormat("#,###").format(totalCdf)} FC",
              isBold: true,
            ),

            const Divider(height: 32, thickness: 1),
            _buildInfoRow("Mode de Paiement", paymentMethod),
            _buildInfoRow("Montant Reçu", "\$${amountPaid.toStringAsFixed(2)}"),
            _buildInfoRow(
              "Rendu",
              "\$${(amountPaid - totalUsd).toStringAsFixed(2)}",
            ),

            const SizedBox(height: 40),
            const Text(
              "MERCI DE VOTRE VISITE !",
              style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5),
            ),
            const SizedBox(height: 4),
            const Text(
              "Mangez comme chez vous",
              style: TextStyle(
                fontStyle: FontStyle.italic,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              "Facture certifiée par Mellia API",
              style: TextStyle(fontSize: 10, color: Colors.grey),
            ),

            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  try {
                    await ref
                        .read(printerServiceProvider.notifier)
                        .printTicket(
                          saleData: saleData,
                          cashierName: user?.name,
                        );
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
                icon: const Icon(Icons.print),
                label: const Text("IMPRIMER REÇU"),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildTotalRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.w900 : FontWeight.normal,
              fontSize: isBold ? 18 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.w900 : FontWeight.bold,
              fontSize: isBold ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}
