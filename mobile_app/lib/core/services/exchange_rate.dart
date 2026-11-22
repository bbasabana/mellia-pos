import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';

/// Active dollar rate (FC for 1 \$) from the platform, as set by the admin on the web.
/// Read fresh each time the checkout opens, so a new rate applies at once.
final exchangeRateProvider = FutureProvider.autoDispose<double>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  final res = await dio.get('/api/exchange-rate');
  final data = res.data is Map ? res.data['data'] : null;
  final rate = double.tryParse('${data is Map ? data['rateUsdToCdf'] : ''}');
  if (rate == null || rate <= 0) throw Exception('Taux de change indisponible');
  return rate;
});

/// Change and shortfall for a cash payment. Dollars come as whole notes (no cents in Congo)
/// and the change is always given back in francs.
class CashMath {
  final double dueCdf;
  final double rate; // FC per dollar
  final String currency; // 'CDF' or 'USD'
  final double received; // in [currency]; 0 = not typed (exact amount)

  const CashMath({
    required this.dueCdf,
    required this.rate,
    required this.currency,
    required this.received,
  });

  /// What the customer handed over, in francs.
  double get receivedCdf => currency == 'USD' ? received * rate : received;

  /// Fewest whole dollars that cover the bill.
  int get minDollars => rate > 0 ? (dueCdf / rate - 1e-9).ceil() : 0;

  bool get typed => received > 0;
  double get shortfallCdf =>
      typed && receivedCdf + 0.5 < dueCdf ? dueCdf - receivedCdf : 0;
  double get changeCdf => typed && receivedCdf > dueCdf
      ? (receivedCdf - dueCdf).roundToDouble()
      : 0;
}
