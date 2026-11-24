import 'package:mellia_pos_mobile/core/services/business_time.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

/// GET /api/cash-counts: the open day (what the till should hold) and the latest closures.
final dayClosureProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final dio = await ref.watch(dioProvider.future);
  final res = await dio.get('/api/cash-counts');
  final body = res.data;
  if (body is Map && body['success'] == true && body['data'] is Map) {
    return Map<String, dynamic>.from(body['data'] as Map);
  }
  throw Exception(
    body is Map ? (body['error'] ?? 'Erreur serveur') : 'Erreur serveur',
  );
});

double _n(Object? v) => double.tryParse(v?.toString() ?? '') ?? 0.0;

String _fc(num v) {
  final digits = v.round().abs().toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ' ',
  );
  return '${v < 0 ? '-' : ''}$digits FC';
}

int _digits(String s) => int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

String _when(Object? iso) {
  if (DateTime.tryParse(iso?.toString() ?? '') == null) return '';
  return DateFormat('EEE d MMM HH:mm', 'fr').format(kinshasaFrom(iso));
}

/// "Journée du lun. 1 déc." from the server's business day (a morning closure closes the
/// day before), falling back to the closure time.
String _dayTitle(Map<String, dynamic> c) {
  final day = DateTime.tryParse(c['businessDay']?.toString() ?? '');
  if (day == null) return _when(c['periodEnd']);
  return 'Journée du ${DateFormat('EEE d MMM', 'fr').format(day)}';
}

const _statusLabels = {
  'BALANCED': ('Correct', AppTheme.success),
  'TO_VERIFY': ('À vérifier', AppTheme.warning),
  'LOSS': ('Perte', AppTheme.error),
  'JUSTIFIED': ('Justifié', AppTheme.cyanDark),
};

String _reason(Object e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map && data['error'] != null) return data['error'].toString();
    return e.message ?? e.toString();
  }
  return e.toString().replaceFirst('Exception: ', '');
}

/// « Clôturer la journée » (ticket Z): the cashier counts the drawer, the app compares it to
/// what should be there since the last closure, and the gap goes to the manager to settle.
class DayClosureScreen extends ConsumerStatefulWidget {
  const DayClosureScreen({super.key});

  @override
  ConsumerState<DayClosureScreen> createState() => _DayClosureScreenState();
}

class _DayClosureScreenState extends ConsumerState<DayClosureScreen> {
  final _counted = TextEditingController();
  final _withdrawal = TextEditingController();
  final _note = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _counted.addListener(_refresh);
    _withdrawal.addListener(_refresh);
  }

  void _refresh() => setState(() {});

  @override
  void dispose() {
    _counted.dispose();
    _withdrawal.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _print(Map<String, dynamic> closure) async {
    try {
      await ref.read(printerServiceProvider.notifier).printZTicket(closure);
    } catch (e) {
      if (mounted) NotificationService.showError(context, _reason(e));
    }
  }

  Future<void> _close(double expected) async {
    final counted = _digits(_counted.text);
    final withdrawal = _digits(_withdrawal.text);
    final gap = counted - expected;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clôturer la journée ?'),
        content: Text(
          'Compté : ${_fc(counted)}\n'
          'Attendu : ${_fc(expected)}\n'
          '${gap == 0 ? 'Caisse juste' : (gap < 0 ? 'Manquant : ${_fc(-gap)}' : 'Surplus : ${_fc(gap)}')}\n'
          '${withdrawal > 0 ? 'Versé au patron : ${_fc(withdrawal)}\n' : ''}\n'
          'Les ventes de la journée ne pourront plus être modifiées.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Clôturer'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() => _saving = true);
    try {
      final dio = await ref.read(dioProvider.future);
      final res = await dio.post(
        '/api/cash-counts',
        data: {
          'countedCdf': counted,
          'withdrawalCdf': withdrawal,
          'notes': _note.text.trim(),
        },
      );
      final body = res.data;
      if (body is! Map || body['success'] != true) {
        throw Exception(body is Map ? body['error'] : 'Erreur serveur');
      }
      final closure = Map<String, dynamic>.from(body['data'] as Map);
      _counted.clear();
      _withdrawal.clear();
      _note.clear();
      ref.invalidate(dayClosureProvider);
      if (mounted) {
        NotificationService.showSuccess(context, 'Journée clôturée');
      }
      await _print(closure);
    } catch (e) {
      if (mounted) NotificationService.showError(context, _reason(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(dayClosureProvider);
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        title: const Text('Clôturer la journée'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(dayClosureProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(_reason(e), textAlign: TextAlign.center),
          ),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dayClosureProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 32),
            children: [
              _openDay(Map<String, dynamic>.from(data['open'] as Map)),
              const SizedBox(height: 18),
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 8),
                child: Text(
                  'DERNIÈRES CLÔTURES',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.subtle,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              ..._history((data['counts'] as List? ?? []).take(10).toList()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _openDay(Map<String, dynamic> open) {
    if (open['ready'] != true) {
      return const SoftCard(
        color: Color(0xFFFFF8E6),
        child: Text(
          "La caisse n'a pas encore de date de démarrage. Un administrateur doit "
          "d'abord faire la clôture de démarrage sur le site (Caisse › Démarrage).",
          style: TextStyle(fontSize: 14, height: 1.4),
        ),
      );
    }
    final e = Map<String, dynamic>.from(open['expectation'] as Map? ?? {});
    final expected = _n(open['expectedCdf']);
    final countedText = _counted.text.trim();
    final counted = _digits(_counted.text);
    final withdrawal = _digits(_withdrawal.text);
    final gap = counted - expected;
    final withdrawalTooHigh = withdrawal > counted;

    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Depuis ${_when(open['periodStart'])}',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          Text(
            open['floatSource']?.toString() ?? '',
            style: const TextStyle(color: AppTheme.muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          if (_n(open['openingFloatCdf']) != 0)
            _row('Resté dans le tiroir', _fc(_n(open['openingFloatCdf']))),
          _row(
            '+ Ventes cash (${e['salesCount'] ?? 0})',
            _fc(_n(e['salesCashCdf'])),
            color: AppTheme.success,
          ),
          _row(
            '- Dépenses caisse',
            _fc(_n(e['expensesCdf'])),
            color: AppTheme.error,
          ),
          // Purchases are paid from the Caisse, not from the day's takings.
          if (_n(e['purchasesCdf']) != 0)
            _row(
              '- Achats caisse',
              _fc(_n(e['purchasesCdf'])),
              color: AppTheme.error,
            ),
          const Divider(height: 20),
          _row('Recette à remettre', _fc(expected), bold: true),
          if (_n(e['salesOtherCdf']) > 0)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Hors cash (carte, mobile money) : ${_fc(_n(e['salesOtherCdf']))} — pas dans le tiroir',
                style: const TextStyle(fontSize: 12, color: AppTheme.muted),
              ),
            ),
          const SizedBox(height: 16),
          _amountField(_counted, 'Argent compté dans le tiroir'),
          if (countedText.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color:
                    (gap == 0
                            ? AppTheme.success
                            : gap < 0
                            ? AppTheme.error
                            : AppTheme.cyanDark)
                        .withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                gap == 0
                    ? 'Caisse juste'
                    : gap < 0
                    ? 'Manquant : ${_fc(-gap)} (à vérifier par le gérant)'
                    : 'Surplus : ${_fc(gap)} (à vérifier par le gérant)',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: gap == 0
                      ? AppTheme.success
                      : gap < 0
                      ? AppTheme.error
                      : AppTheme.cyanDark,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          _amountField(_withdrawal, 'Remis au patron (optionnel)'),
          if (countedText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Text(
                withdrawalTooHigh
                    ? 'Le versement dépasse l\'argent compté'
                    : 'Reste dans le tiroir : ${_fc(counted - withdrawal)}',
                style: TextStyle(
                  fontSize: 12.5,
                  color: withdrawalTooHigh ? AppTheme.error : AppTheme.muted,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _note,
            maxLength: 500,
            decoration: const InputDecoration(
              labelText: 'Note (ex : transport payé 50 000)',
              counterText: '',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _saving || countedText.isEmpty || withdrawalTooHigh
                ? null
                : () => _close(expected),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.ink,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.lock_rounded),
            label: const Text(
              'Clôturer et imprimer le ticket Z',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _history(List items) {
    if (items.isEmpty) {
      return const [
        Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Aucune journée clôturée pour l\'instant.',
            style: TextStyle(color: AppTheme.muted),
          ),
        ),
      ];
    }
    return [
      for (final raw in items)
        Builder(
          builder: (context) {
            final c = Map<String, dynamic>.from(raw as Map);
            final diff = _n(c['differenceCdf']);
            final (label, color) =
                _statusLabels[c['status']] ??
                (c['status'].toString(), AppTheme.muted);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: SoftCard(
                padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
                radius: 14,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _dayTitle(c),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Compté ${_fc(_n(c['countedCdf']))} · Attendu ${_fc(_n(c['expectedCdf']))}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.muted,
                            ),
                          ),
                          if (diff != 0)
                            Text(
                              diff < 0
                                  ? 'Manquant ${_fc(-diff)}'
                                  : 'Surplus ${_fc(diff)}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: diff < 0
                                    ? AppTheme.error
                                    : AppTheme.cyanDark,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        label,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Réimprimer le ticket Z',
                      onPressed: () => _print(c),
                      icon: const Icon(Icons.print_rounded, size: 20),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
    ];
  }

  Widget _row(String label, String value, {Color? color, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: bold ? 15 : 14,
                fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: bold ? 17 : 14,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w700,
              color: color ?? AppTheme.ink,
            ),
          ),
        ],
      ),
    );
  }

  Widget _amountField(TextEditingController c, String label) {
    return TextField(
      controller: c,
      keyboardType: TextInputType.number,
      inputFormatters: [_Thousands()],
      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
      decoration: InputDecoration(labelText: label, suffixText: 'FC'),
    );
  }
}

/// Groups digits by thousands while typing: 250000 → 250 000.
class _Thousands extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return const TextEditingValue();
    final text = digits.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ' ',
    );
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
