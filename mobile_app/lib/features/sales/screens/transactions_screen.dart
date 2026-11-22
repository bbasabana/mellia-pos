import 'package:mellia_pos_mobile/core/services/business_time.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:mellia_pos_mobile/features/products/data/product_repository.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

double _n(Object? v) => double.tryParse(v?.toString() ?? '') ?? 0.0;

String _fc(num v) =>
    '${NumberFormat.decimalPattern('fr').format(v.round())} FC';

const _methods = {
  'CASH': 'Espèces',
  'CARD': 'Carte',
  'MOBILE_MONEY': 'Mobile Money',
  'AIRTEL_MONEY': 'Airtel Money',
  'ORANGE_MONEY': 'Orange Money',
  'SPLIT': 'Mixte',
  'OTHER': 'Autre',
};

/// Sales of one day, newest first. Loads 20 at a time and fetches the next page when the
/// list nears its end; the totals at the top come from the server for the whole day.
class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  static const _pageSize = 20;

  DateTime _day = nowKinshasa();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _sales = [];
  int _page = 0;
  int _totalPages = 1;
  int _total = 0;
  double _totalCdf = 0;
  double _totalUsd = 0;
  bool _loading = false;
  String? _error;
  // Bumped on every reload so a slow page of an older request is dropped.
  int _generation = 0;

  bool get _hasMore => _page < _totalPages;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) {
        _loadMore();
      }
    });
    _reload();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    _generation++;
    setState(() {
      _sales.clear();
      _page = 0;
      _totalPages = 1;
      _error = null;
      _loading = false;
    });
    await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || !_hasMore) return;
    final generation = _generation;
    setState(() => _loading = true);
    try {
      final repo = await ref.read(salesRepositoryProvider.future);
      final page = await repo.getSalesPage(
        day: _day,
        page: _page + 1,
        limit: _pageSize,
      );
      if (!mounted || generation != _generation) return;
      setState(() {
        _page++;
        _sales.addAll(page.items);
        _totalPages = page.totalPages;
        _total = page.total;
        _totalCdf = page.totalCdf;
        _totalUsd = page.totalUsd;
        _error = null;
      });
    } catch (e) {
      if (mounted && generation == _generation) {
        setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted && generation == _generation) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _pickDay() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _day,
      firstDate: DateTime(2024),
      lastDate: nowKinshasa(),
    );
    if (picked != null && !DateUtils.isSameDay(picked, _day)) {
      _day = picked;
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        title: const Text("Historique des ventes"),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _pickDay,
            icon: const Icon(Icons.calendar_month_rounded),
          ),
          IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView.builder(
          controller: _scroll,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 24),
          // header + sales + footer (loader, error, "load more" or end)
          itemCount: _sales.length + 2,
          itemBuilder: (context, index) {
            if (index == 0) return _header();
            if (index == _sales.length + 1) return _footer();
            final sale = _sales[index - 1];
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: FadeSlideIn(
                index: (index - 1) % _pageSize,
                child: _TransactionCard(
                  sale: sale,
                  onTap: () => _openSale(sale),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _footer() {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.error),
            ),
            TextButton(onPressed: _loadMore, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_sales.isEmpty) return _emptyState();
    if (_hasMore) {
      return Center(
        child: TextButton(
          onPressed: _loadMore,
          child: const Text('Voir plus'),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Text(
        _total == 1 ? '1 vente ce jour' : '$_total ventes ce jour',
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppTheme.subtle, fontSize: 12.5),
      ),
    );
  }

  Widget _header() {
    final isToday = DateUtils.isSameDay(_day, nowKinshasa());
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1B2638), AppTheme.ink],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.ink.withValues(alpha: 0.22),
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
                  Text(
                    isToday ? "TOTAL VENDU (AUJOURD'HUI)" : "TOTAL VENDU (JOUR)",
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('EEEE d MMMM yyyy', 'fr').format(_day),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                '$_total vente${_total > 1 ? 's' : ''}',
                style: const TextStyle(
                  color: Colors.greenAccent,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _summaryItem(
                  "\$${_totalUsd.toStringAsFixed(2)}",
                  "En Dollars",
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(child: _summaryItem(_fc(_totalCdf), "En Francs")),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryItem(String value, String label) {
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

  Widget _emptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 80),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text(
            "Aucune vente ce jour",
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

  // ------------------------------------------------------------ sale detail

  void _openSale(Map<String, dynamic> sale) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _SaleSheet(
        sale: sale,
        onReprint: () => _reprint(sale),
        onRepeat: () {
          Navigator.pop(ctx);
          _repeat(sale);
        },
      ),
    );
  }

  Future<void> _reprint(Map<String, dynamic> sale) async {
    try {
      await ref
          .read(printerServiceProvider.notifier)
          .printTicket(
            saleData: sale,
            cashierName: sale['user']?['name']?.toString(),
            paymentMethod: sale['paymentMethod']?.toString(),
            duplicate: true,
          );
      if (mounted) NotificationService.showSuccess(context, 'Ticket réimprimé');
    } catch (e) {
      if (mounted) {
        NotificationService.showError(
          context,
          e.toString().replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  /// Puts the same items back in the cart at today's prices; nothing is charged until the
  /// cashier validates the payment as usual.
  Future<void> _repeat(Map<String, dynamic> sale) async {
    List<Product> products;
    try {
      products = await ref.read(productsProvider.future);
    } catch (_) {
      if (mounted) {
        NotificationService.showError(context, 'Produits indisponibles');
      }
      return;
    }
    final byId = {for (final p in products) p.id: p};
    final cart = ref.read(cartNotifierProvider.notifier);
    final missing = <String>[];
    final repriced = <String>[];
    var added = 0;

    for (final raw in (sale['items'] as List? ?? [])) {
      final item = Map<String, dynamic>.from(raw as Map);
      final name = item['product']?['name']?.toString() ?? 'Article';
      final product = byId[item['productId']?.toString()];
      final qty = _n(item['quantity']).round();
      if (product == null || qty <= 0) {
        missing.add(name);
        continue;
      }
      // Same price as then → same space (Terrasse / VIP); otherwise today's first price.
      final oldCdf = _n(item['unitPriceCdf']);
      ProductPrice? price;
      for (final p in product.prices) {
        if ((p.priceCdf - oldCdf).abs() < 0.5) {
          price = p;
          break;
        }
      }
      if (price == null && product.prices.isNotEmpty) {
        price = product.prices.first;
        repriced.add(name);
      }
      cart.addItem(product, price: price, quantity: qty);
      added++;
    }

    if (!mounted) return;
    if (added == 0) {
      NotificationService.showError(
        context,
        'Aucun article de cette commande n\'est encore en vente',
      );
      return;
    }
    final notes = [
      if (missing.isNotEmpty) 'Plus en vente : ${missing.join(', ')}',
      if (repriced.isNotEmpty) 'Prix actuel : ${repriced.join(', ')}',
    ];
    NotificationService.showSuccess(
      context,
      notes.isEmpty
          ? 'Commande ajoutée au panier'
          : 'Ajoutée au panier. ${notes.join(' · ')}',
    );
    context.go('/');
  }
}

class _SaleSheet extends StatelessWidget {
  final Map<String, dynamic> sale;
  final VoidCallback onReprint;
  final VoidCallback onRepeat;

  const _SaleSheet({
    required this.sale,
    required this.onReprint,
    required this.onRepeat,
  });

  @override
  Widget build(BuildContext context) {
    final items = (sale['items'] as List? ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    final created = kinshasaFrom(sale['createdAt']);
    final method = sale['paymentMethod']?.toString() ?? 'CASH';
    final cashier = sale['user']?['name']?.toString();

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 12, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '#${sale['ticketNum'] ?? ''}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          '${DateFormat('dd/MM/yyyy HH:mm').format(created)}'
                          ' · ${_methods[method] ?? method}'
                          '${cashier != null ? ' · $cashier' : ''}',
                          style: const TextStyle(
                            color: AppTheme.muted,
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            const Divider(),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  for (final item in items)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Text(
                            '${_n(item['quantity']) == _n(item['quantity']).roundToDouble() ? _n(item['quantity']).toInt() : _n(item['quantity'])} ×',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppTheme.cyanDark,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              item['product']?['name']?.toString() ?? 'Article',
                              style: const TextStyle(fontSize: 14.5),
                            ),
                          ),
                          Text(
                            _fc(_n(item['unitPriceCdf']) * _n(item['quantity'])),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'TOTAL',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
                  ),
                  Text(
                    _fc(_n(sale['totalCdf'])),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onReprint,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.print_rounded),
                      label: const Text('Réimprimer'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: onRepeat,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.ink,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.replay_rounded),
                      label: const Text('Refaire'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final Map<String, dynamic> sale;
  final VoidCallback onTap;
  const _TransactionCard({required this.sale, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final ticketNum = sale['ticketNum'] ?? "N/A";
    final totalCdf = _n(sale['totalCdf']);
    final createdAt = kinshasaFrom(sale['createdAt']);
    final clientName = sale['client']?['name'] ?? "Client Passant";
    final method = sale['paymentMethod']?.toString() ?? "CASH";
    final items = (sale['items'] as List? ?? []);
    final count = items.fold<double>(
      0,
      (s, i) => s + _n((i as Map)['quantity']),
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue.withValues(alpha: 0.1),
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
              '$clientName · ${count.round()} article${count.round() > 1 ? 's' : ''}',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            Text(
              DateFormat('HH:mm').format(createdAt),
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
            ),
          ],
        ),
        trailing: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _fc(totalCdf),
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 16,
                color: AppTheme.primaryBlue,
              ),
            ),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                _methods[method] ?? method,
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
