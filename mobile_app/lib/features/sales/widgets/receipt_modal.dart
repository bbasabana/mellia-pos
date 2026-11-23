import 'package:mellia_pos_mobile/core/services/business_time.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/constants/app_assets.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:mellia_pos_mobile/core/services/receipt_name.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

class ReceiptModal extends ConsumerStatefulWidget {
  final Map<String, dynamic> saleData;
  final String paymentMethod;
  final double amountPaid;

  /// Currency the customer paid with: 'CDF' (francs) or 'USD'.
  final String paidCurrency;

  /// Change given back, always in francs.
  final double changeCdf;

  /// FC for 1 dollar applied to this payment.
  final double rate;

  /// The cart as it was paid: "Refaire" puts the same order back in the cart.
  final CartState? paidCart;

  const ReceiptModal({
    super.key,
    required this.saleData,
    required this.paymentMethod,
    required this.amountPaid,
    this.paidCurrency = 'CDF',
    this.changeCdf = 0,
    this.rate = 0,
    this.paidCart,
  });

  @override
  ConsumerState<ReceiptModal> createState() => _ReceiptModalState();
}

class _ReceiptModalState extends ConsumerState<ReceiptModal> {
  bool _printing = false;
  bool _printed = false;

  Map<String, dynamic> get saleData => widget.saleData;
  String get paymentMethod => widget.paymentMethod;
  double get amountPaid => widget.amountPaid;

  @override
  void initState() {
    super.initState();
    // Nothing prints by itself unless the cashier turned on auto-print in Settings:
    // the ticket is printed on demand with the "Imprimer" button.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(printerServiceProvider.future);
      final printer = ref.read(printerServiceProvider.notifier);
      if (printer.autoPrint && mounted) _print(auto: true);
    });
  }

  /// Same items, client and order type back in the cart, as a new order to pay.
  void _repeat() {
    final paid = widget.paidCart;
    if (paid != null && paid.items.isNotEmpty) {
      ref
          .read(cartNotifierProvider.notifier)
          .restoreCart(paid.copyWith(activeDraftId: null, isLoading: false));
    }
    Navigator.of(context).maybePop();
  }

  Future<void> _print({bool auto = false}) async {
    if (_printing) return;
    setState(() => _printing = true);
    final user = ref.read(authNotifierProvider).asData?.value;
    try {
      await ref
          .read(printerServiceProvider.notifier)
          .printTicket(
            saleData: saleData,
            cashierName: user?.name,
            paymentMethod: paymentMethod,
            amountPaid: amountPaid,
            paidCurrency: widget.paidCurrency,
            changeCdf: widget.changeCdf,
            rate: widget.rate,
          );
      if (mounted) setState(() => _printed = true);
    } catch (e) {
      if (mounted) {
        final reason = e.toString().replaceFirst('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auto ? "Ticket non imprimé : $reason" : reason),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authNotifierProvider).asData?.value;
    final createdAt = kinshasaFrom(saleData['createdAt']);
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    final items = saleData['items'] as List? ?? [];
    final totalUsd =
        double.tryParse(saleData['totalNet']?.toString() ?? "0") ?? 0.0;
    final totalCdf =
        double.tryParse(saleData['totalCdf']?.toString() ?? "0") ?? 0.0;
    final ticketNum = saleData['ticketNum'] ?? "N/A";
    final clientName = saleData['client']?['name'] ?? "Passant";

    final saleId = saleData['id']?.toString() ?? '';
    final fcFormat = NumberFormat.decimalPattern('fr');
    String fc(num v) => '${fcFormat.format(v.round())} FC';
    final cashier = receiptCashier(ref.watch(receiptNameProvider), user?.name);
    const methodLabels = {
      'CASH': 'Espèces',
      'CARD': 'Carte',
      'MOBILE_MONEY': 'Mobile Money',
    };

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.canvas,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
          child: Column(
            children: [
              Container(
                width: 38,
                height: 5,
                decoration: BoxDecoration(
                  color: AppTheme.line,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 18),
              const _SuccessBadge(),
              const SizedBox(height: 12),
              const FadeSlideIn(
                index: 2,
                child: Text(
                  'Vente enregistrée',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              FadeSlideIn(
                index: 3,
                child: Text(
                  '${fc(totalCdf)}  ·  \$${totalUsd.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: AppTheme.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // The receipt itself
              FadeSlideIn(
                index: 4,
                offset: 24,
                child: SoftCard(
                  radius: 20,
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
                  child: Column(
                    children: [
                      Image.asset(AppAssets.logo, height: 48),
                      const SizedBox(height: 6),
                      const Text(
                        '10, Bypass, Mont-Ngafula, Kinshasa',
                        style: TextStyle(color: AppTheme.muted, fontSize: 11.5),
                      ),
                      const _Dashed(),
                      _buildInfoRow('Ticket', '#$ticketNum'),
                      _buildInfoRow('Date', dateFormat.format(createdAt)),
                      _buildInfoRow('Caissier', cashier ?? '—'),
                      _buildInfoRow('Client', clientName),
                      const _Dashed(),
                      ...items.map((item) {
                        final product = item['product'] ?? {};
                        final qty =
                            double.tryParse(item['quantity'].toString()) ?? 1.0;
                        final price =
                            double.tryParse(item['unitPriceCdf'].toString()) ??
                            0.0;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(
                                  right: 10,
                                  top: 1,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.canvas,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${qty.toInt()}×',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  product['name'] ?? 'Article',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13.5,
                                  ),
                                ),
                              ),
                              Text(
                                fc(qty * price),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const _Dashed(),
                      _buildTotalRow('Total', fc(totalCdf), isBold: true),
                      _buildTotalRow(
                        'Soit',
                        '\$${totalUsd.toStringAsFixed(2)}',
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        'Paiement',
                        methodLabels[paymentMethod] ?? paymentMethod,
                      ),
                      if (amountPaid > 0)
                        _buildInfoRow(
                          'Reçu',
                          widget.paidCurrency == 'USD'
                              ? '${amountPaid.round()} \$'
                                    '${widget.rate > 0 ? ' (${fc(amountPaid * widget.rate)})' : ''}'
                              : fc(amountPaid),
                        ),
                      if (widget.changeCdf > 0)
                        _buildTotalRow(
                          'Monnaie rendue',
                          fc(widget.changeCdf),
                          isBold: true,
                        ),
                      if (saleId.isNotEmpty) ...[
                        const _Dashed(),
                        QrImageView(
                          data: '${ApiConstants.baseUrl}/v/$saleId',
                          size: 120,
                          padding: EdgeInsets.zero,
                          eyeStyle: const QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: AppTheme.ink,
                          ),
                          dataModuleStyle: const QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: AppTheme.ink,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Scannez pour vérifier l\'authenticité',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: AppTheme.muted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      const Text(
                        'Merci de votre visite !',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const Text(
                        'Mangez comme chez vous',
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          color: AppTheme.muted,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                index: 6,
                child: Column(
                  children: [
                    ElevatedButton.icon(
                      onPressed: _printing ? null : () => _print(),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(54),
                      ),
                      icon: AnimatedSwitcher(
                        duration: AppTheme.fast,
                        child: _printing
                            ? const SizedBox(
                                key: ValueKey('p'),
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Icon(
                                _printed
                                    ? Icons.check_rounded
                                    : Icons.print_rounded,
                                key: ValueKey(_printed),
                                size: 20,
                              ),
                      ),
                      label: Text(
                        _printing
                            ? 'Impression…'
                            : (_printed
                                  ? 'Réimprimer le ticket'
                                  : 'Imprimer le ticket'),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (widget.paidCart?.items.isNotEmpty == true) ...[
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _repeat,
                              style: OutlinedButton.styleFrom(
                                backgroundColor: Colors.white,
                                minimumSize: const Size.fromHeight(52),
                              ),
                              icon: const Icon(Icons.replay_rounded, size: 20),
                              label: const Text('Refaire'),
                            ),
                          ),
                          const SizedBox(width: 10),
                        ],
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => Navigator.of(context).maybePop(),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(52),
                            ),
                            icon: const Icon(Icons.add_rounded, size: 20),
                            label: const Text('Nouvelle commande'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
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
          Text(
            label,
            style: const TextStyle(color: AppTheme.muted, fontSize: 13),
          ),
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
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              fontSize: isBold ? 17 : 13.5,
              color: isBold ? AppTheme.ink : AppTheme.muted,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              fontSize: isBold ? 17 : 13.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Green check that pops in, then its ring fades out (sale confirmed).
class _SuccessBadge extends StatefulWidget {
  const _SuccessBadge();

  @override
  State<_SuccessBadge> createState() => _SuccessBadgeState();
}

class _SuccessBadgeState extends State<_SuccessBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pop = CurvedAnimation(
      parent: _c,
      curve: const Interval(0, 0.55, curve: Curves.easeOutBack),
    );
    final ring = CurvedAnimation(
      parent: _c,
      curve: const Interval(0.3, 1, curve: Curves.easeOut),
    );
    return SizedBox(
      width: 84,
      height: 84,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) => Stack(
          alignment: Alignment.center,
          children: [
            Transform.scale(
              scale: 0.8 + ring.value * 0.45,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.lime.withValues(
                    alpha: 0.35 * (1 - ring.value),
                  ),
                ),
              ),
            ),
            Transform.scale(
              scale: pop.value,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.lime, AppTheme.limeDark],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.limeDark.withValues(alpha: 0.35),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Colors.white,
                  size: 34,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Dashed separator, like the tear line of a paper receipt.
class _Dashed extends StatelessWidget {
  const _Dashed();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: LayoutBuilder(
        builder: (context, c) {
          final n = (c.maxWidth / 8).floor();
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              n,
              (_) => Container(width: 4, height: 1.2, color: AppTheme.line),
            ),
          );
        },
      ),
    );
  }
}
