import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  DateTime selectedDate = DateTime.now();

  String get _dateStr => DateFormat('yyyy-MM-dd').format(selectedDate);

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(
      transactionsProvider({
        'status': 'COMPLETED',
        'startDate': _dateStr,
        'endDate': _dateStr,
      }),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          "Transactions",
          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _selectDate(context),
            icon: const Icon(Icons.calendar_today, color: Colors.black),
          ),
          IconButton(
            onPressed: () => ref.invalidate(transactionsProvider),
            icon: const Icon(Icons.refresh, color: Colors.black),
          ),
        ],
      ),
      body: transactionsAsync.when(
        data: (sales) {
          final totalUsd = sales.fold<double>(
            0,
            (sum, s) =>
                sum + (double.tryParse(s['totalNet']?.toString() ?? '0') ?? 0),
          );
          final totalCdf = sales.fold<double>(
            0,
            (sum, s) =>
                sum + (double.tryParse(s['totalCdf']?.toString() ?? '0') ?? 0),
          );

          return Column(
            children: [
              _buildSummaryHeader(totalUsd, totalCdf),
              Expanded(
                child: sales.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: sales.length,
                        itemBuilder: (context, index) {
                          final sale = sales[index];
                          return _TransactionCard(sale: sale);
                        },
                      ),
              ),
            ],
          );
        },
        error: (err, stack) => Center(child: Text("Erreur: $err")),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  Widget _buildSummaryHeader(double totalUsd, double totalCdf) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryBlue, Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "TOTAL VENDU (JOUR)",
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('dd MMMM yyyy', 'fr').format(selectedDate),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const Icon(Icons.trending_up, color: Colors.greenAccent),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  "\$${totalUsd.toStringAsFixed(2)}",
                  "En Dollars",
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(
                child: _buildSummaryItem(
                  "${NumberFormat('#,###', 'fr').format(totalCdf)} FC",
                  "En Francs",
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey[200]),
          const SizedBox(height: 16),
          const Text(
            "Aucune transaction trouvée",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final Map<String, dynamic> sale;
  const _TransactionCard({required this.sale});

  @override
  Widget build(BuildContext context) {
    final ticketNum = sale['ticketNum'] ?? "N/A";
    final totalUsd =
        double.tryParse(sale['totalNet']?.toString() ?? "0") ?? 0.0;
    final createdAt =
        DateTime.tryParse(sale['createdAt'] ?? "") ?? DateTime.now();
    final clientName = sale['client']?['name'] ?? "Client Passant";
    final paymentMethod = sale['paymentMethod'] ?? "CASH";

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.receipt_rounded, color: AppTheme.primaryBlue),
        ),
        title: Text(
          "#$ticketNum",
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              clientName,
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            Text(
              DateFormat('dd/MM HH:mm').format(createdAt),
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ],
        ),
        trailing: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "\$${totalUsd.toStringAsFixed(2)}",
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 17,
                color: AppTheme.primaryBlue,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                paymentMethod,
                style: const TextStyle(
                  color: Colors.green,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
