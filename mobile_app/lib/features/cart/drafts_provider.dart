import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';

part 'drafts_provider.freezed.dart';
part 'drafts_provider.g.dart';

@freezed
abstract class DraftOrder with _$DraftOrder {
  const factory DraftOrder({
    required String id,
    required String ticketNum,
    required DateTime createdAt,
    required Map<String, dynamic> rawData,
  }) = _DraftOrder;
}

@Riverpod(keepAlive: true)
class DraftsNotifier extends _$DraftsNotifier {
  @override
  Future<List<DraftOrder>> build() async {
    return _fetchDrafts();
  }

  Future<List<DraftOrder>> _fetchDrafts() async {
    final repo = await ref.read(salesRepositoryProvider.future);
    final data = await repo.getTransactions(status: 'DRAFT');

    return data
        .map(
          (json) => DraftOrder(
            id: json['id'],
            ticketNum: json['ticketNum'] ?? "",
            createdAt: DateTime.parse(json['createdAt']),
            rawData: json,
          ),
        )
        .toList();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchDrafts());
  }

  void removeDraft(String id) {
    if (state.hasValue) {
      state = AsyncValue.data(state.value!.where((d) => d.id != id).toList());
    }
  }
}
