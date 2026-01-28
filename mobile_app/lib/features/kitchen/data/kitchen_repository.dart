import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/features/kitchen/data/kitchen_model.dart';

part 'kitchen_repository.g.dart';

class KitchenRepository {
  final Dio _dio;
  KitchenRepository(this._dio);

  Future<List<KitchenOrder>> getOrders() async {
    final response = await _dio.get('/api/kitchen/orders');
    if (response.data['success'] == true) {
      final List data = response.data['data'];
      return data.map((e) => KitchenOrder.fromJson(e)).toList();
    }
    throw Exception('Failed to load kitchen orders');
  }

  Future<void> updateStatus(String orderId, String status) async {
    await _dio.post(
      '/api/kitchen/orders/$orderId/status',
      data: {'status': status},
    );
  }

  Future<void> deleteOrder(String orderId) async {
    await _dio.delete('/api/kitchen/orders/$orderId');
  }
}

@riverpod
Future<KitchenRepository> kitchenRepository(KitchenRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return KitchenRepository(dio);
}

@riverpod
Future<List<KitchenOrder>> kitchenOrders(KitchenOrdersRef ref) async {
  final repo = await ref.watch(kitchenRepositoryProvider.future);
  return repo.getOrders();
}
