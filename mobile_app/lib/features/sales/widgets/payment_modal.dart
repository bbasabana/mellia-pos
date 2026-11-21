import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/cart/drafts_provider.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';
import 'package:mellia_pos_mobile/features/sales/widgets/receipt_modal.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

final _fcFormat = NumberFormat.decimalPattern('fr');
String _fc(num v) => '${_fcFormat.format(v.round())} FC';

/// Checkout: the amount is in francs; the cashier types the money handed over, in francs or in
/// dollars as the customer paid (no change is computed, only what was received is recorded).
class PaymentModal extends ConsumerStatefulWidget {
  const PaymentModal({super.key});

  @override
  ConsumerState<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends ConsumerState<PaymentModal> {
  String selectedMethod = 'CASH';
  String currency = 'CDF'; // currency the customer paid with
  bool isProcessing = false;
  String? _error;

  final TextEditingController _amountController = TextEditingController();

  static const methods = [
    (
      id: 'CASH',
      label: 'Espèces',
      icon: Icons.payments_rounded,
      color: AppTheme.limeDark,
    ),
    (
      id: 'CARD',
      label: 'Carte',
      icon: Icons.credit_card_rounded,
      color: AppTheme.cyanDark,
    ),
    (
      id: 'MOBILE_MONEY',
      label: 'Mobile\nMoney',
      icon: Icons.phone_iphone_rounded,
      color: AppTheme.brandOrange,
    ),
  ];

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  /// Amount typed by the cashier ("50 000", "20.5"...), or the exact total when left empty.
  double _amountReceived(CartState cart) {
    final typed = double.tryParse(
      _amountController.text
          .replaceAll(RegExp(r'[\s  ]'), '')
          .replaceAll(',', '.'),
    );
    if (typed != null && typed > 0) return typed;
    return currency == 'USD' ? cart.totalUsd : cart.totalCdf;
  }

  /// Why the typed amount cannot be accepted, or null when it covers the total.
  /// A ticket is always paid in full: less than the total is refused.
  String? _shortfall(CartState cart) {
    if (selectedMethod != 'CASH') return null;
    final received = _amountReceived(cart);
    if (currency == 'USD') {
      if (received + 0.004 < cart.totalUsd) {
        return "Montant insuffisant : il manque \$${(cart.totalUsd - received).toStringAsFixed(2)}. "
            "Le client doit payer \$${cart.totalUsd.toStringAsFixed(2)}.";
      }
    } else if (received + 0.5 < cart.totalCdf) {
      return "Montant insuffisant : il manque ${_fc(cart.totalCdf - received)}. "
          "Le client doit payer ${_fc(cart.totalCdf)}.";
    }
    return null;
  }

  Future<void> _processPayment() async {
    final cart = ref.read(cartNotifierProvider);
    if (cart.items.isEmpty) return;

    final problem = _shortfall(cart);
    if (problem != null) {
      HapticFeedback.heavyImpact();
      setState(() => _error = problem);
      return;
    }

    setState(() {
      _error = null;
      isProcessing = true;
    });
    try {
      final repo = await ref.read(salesRepositoryProvider.future);
      final cartSnapshot = cart;
      final paidCurrency = selectedMethod == 'CASH' ? currency : 'CDF';
      final amountPaid = selectedMethod == 'CASH'
          ? _amountReceived(cartSnapshot)
          : cartSnapshot.totalCdf;

      final Map<String, dynamic> saleData;
      if (cartSnapshot.activeDraftId != null) {
        saleData = await repo.updateSale(
          id: cartSnapshot.activeDraftId!,
          items: cartSnapshot.items.values.toList(),
          status: "COMPLETED",
          paymentMethod: selectedMethod,
          orderType: cartSnapshot.orderType,
          deliveryInfo: cartSnapshot.deliveryInfo,
        );
      } else {
        saleData = await repo.createSale(
          items: cartSnapshot.items.values.toList(),
          paymentMethod: selectedMethod,
          clientId: cartSnapshot.selectedClient?.id,
          status: "COMPLETED",
          orderType: cartSnapshot.orderType,
          deliveryInfo: cartSnapshot.deliveryInfo,
        );
      }

      // A receipt never shows 0: fill anything the server left out from the cart.
      saleData['totalCdf'] ??= cartSnapshot.totalCdf;
      saleData['totalNet'] ??= cartSnapshot.totalUsd;
      if ((saleData['items'] as List?)?.isNotEmpty != true) {
        saleData['items'] = cartSnapshot.items.values
            .map(
              (i) => {
                'quantity': i.quantity,
                'unitPrice': i.unitPriceUsd,
                'unitPriceCdf': i.unitPriceCdf,
                'product': {'name': i.product.name},
              },
            )
            .toList();
      }

      if (mounted) {
        ref.read(cartNotifierProvider.notifier).clearCart();
        context.pop(); // close the payment sheet

        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          sheetAnimationStyle: const AnimationStyle(
            duration: Duration(milliseconds: 420),
          ),
          builder: (ctx) => ReceiptModal(
            saleData: saleData,
            paymentMethod: selectedMethod,
            amountPaid: amountPaid,
            paidCurrency: paidCurrency,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => isProcessing = false);
    }
  }

  /// Saves the order as a draft (to be paid later) and goes back to an empty cart.
  Future<void> _putOnHold() async {
    setState(() => isProcessing = true);
    try {
      final notifier = ref.read(cartNotifierProvider.notifier);
      await notifier.saveDraft();
      ref.invalidate(draftsNotifierProvider);
      notifier.clearCart();
      if (mounted) {
        Navigator.of(context).maybePop();
        NotificationService.showInfo(context, "Commande mise en attente.");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
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
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 8, 0),
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
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        "Encaissement",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: "Retour au panier",
                      onPressed: isProcessing
                          ? null
                          : () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _TotalCard(totalCdf: cart.totalCdf, totalUsd: cart.totalUsd),
                  const SizedBox(height: 22),

                  const _Label("Mode de paiement"),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      for (var i = 0; i < methods.length; i++) ...[
                        if (i > 0) const SizedBox(width: 10),
                        Expanded(
                          child: _MethodTile(
                            label: methods[i].label,
                            icon: methods[i].icon,
                            color: methods[i].color,
                            selected: selectedMethod == methods[i].id,
                            onTap: () => setState(() {
                              selectedMethod = methods[i].id;
                              _error = null;
                            }),
                          ),
                        ),
                      ],
                    ],
                  ),

                  AnimatedSize(
                    duration: AppTheme.medium,
                    curve: AppTheme.curve,
                    alignment: Alignment.topCenter,
                    child: selectedMethod != 'CASH'
                        ? const SizedBox(width: double.infinity)
                        : Padding(
                            padding: const EdgeInsets.only(top: 22),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    const Expanded(
                                      child: _Label("Montant reçu"),
                                    ),
                                    _CurrencySwitch(
                                      value: currency,
                                      onChanged: (v) => setState(() {
                                        currency = v;
                                        _error = null;
                                        _amountController.clear();
                                      }),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                TextField(
                                  controller: _amountController,
                                  onChanged: (_) {
                                    if (_error != null) {
                                      setState(() => _error = null);
                                    }
                                  },
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                  inputFormatters: [
                                    FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9 .,]'),
                                    ),
                                  ],
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: currency == 'USD'
                                        ? cart.totalUsd.toStringAsFixed(2)
                                        : _fcFormat.format(
                                            cart.totalCdf.round(),
                                          ),
                                    suffixIcon: Padding(
                                      padding: const EdgeInsets.only(right: 16),
                                      child: Text(
                                        currency == 'USD' ? '\$' : 'FC',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.muted,
                                        ),
                                      ),
                                    ),
                                    suffixIconConstraints: const BoxConstraints(
                                      minWidth: 0,
                                      minHeight: 0,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  currency == 'USD'
                                      ? "Le client paie en dollars. Laissez vide si c'est le montant exact."
                                      : "Le client paie en francs. Laissez vide si c'est le montant exact.",
                                  style: const TextStyle(
                                    color: AppTheme.muted,
                                    fontSize: 12.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
          // Actions, always visible at the bottom (above the keyboard when it is open)
          Container(
            padding: EdgeInsets.fromLTRB(
              20,
              12,
              20,
              12 +
                  (bottomInset > 0
                      ? bottomInset
                      : MediaQuery.of(context).viewPadding.bottom),
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.line)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Refusal message, always in view just above the buttons
                AnimatedSize(
                  duration: AppTheme.medium,
                  curve: AppTheme.curve,
                  child: _error == null
                      ? const SizedBox(width: double.infinity)
                      : Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFFD9D9)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: AppTheme.error,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: const TextStyle(
                                    color: Color(0xFFB4232A),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isProcessing ? null : _putOnHold,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                        ),
                        child: const Text("Attente"),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: PrimaryButton(
                        text: "Valider · ${_fc(cart.totalCdf)}",
                        isLoading: isProcessing,
                        onPressed: _processPayment,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      fontWeight: FontWeight.w700,
      fontSize: 14,
      color: AppTheme.ink,
    ),
  );
}

/// Amount due, in francs first; the dollar value underneath.
class _TotalCard extends StatelessWidget {
  final double totalCdf;
  final double totalUsd;
  const _TotalCard({required this.totalCdf, required this.totalUsd});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      decoration: BoxDecoration(
        color: AppTheme.ink,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.ink.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            "À PAYER",
            style: TextStyle(
              color: Colors.white54,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: totalCdf),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
            builder: (context, v, _) => FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                _fc(v),
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -1,
                ),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            "soit \$${totalUsd.toStringAsFixed(2)}",
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.lime,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// One payment method: icon in a tinted circle, label underneath, check when selected.
class _MethodTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _MethodTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppTheme.fast,
        curve: AppTheme.curve,
        height: 108,
        decoration: BoxDecoration(
          color: selected
              ? color.withValues(alpha: 0.08)
              : const Color(0xFFF7F9FB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? color : AppTheme.line,
            width: selected ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedContainer(
                    duration: AppTheme.fast,
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: selected ? color : Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: selected ? color : AppTheme.line,
                      ),
                    ),
                    child: Icon(
                      icon,
                      size: 22,
                      color: selected ? Colors.white : color,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.15,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                      color: AppTheme.ink,
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 6,
              right: 6,
              child: AnimatedScale(
                scale: selected ? 1 : 0,
                duration: AppTheme.fast,
                curve: Curves.easeOutBack,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 13,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// FC / $ switch for the money handed over.
class _CurrencySwitch extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;
  const _CurrencySwitch({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Widget option(String code, String label) {
      final on = value == code;
      return GestureDetector(
        onTap: () => onChanged(code),
        child: AnimatedContainer(
          duration: AppTheme.fast,
          curve: AppTheme.curve,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          decoration: BoxDecoration(
            color: on ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            boxShadow: on ? AppTheme.softShadow : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: on ? FontWeight.w800 : FontWeight.w600,
              color: on ? AppTheme.ink : AppTheme.muted,
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFE3E8EE),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [option('CDF', 'FC'), option('USD', '\$')],
      ),
    );
  }
}
