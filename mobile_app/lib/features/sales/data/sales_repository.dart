import 'package:mellia_pos_mobile/core/services/business_time.dart';
import 'package:dio/dio.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sales_repository.g.dart';

class SalesRepository {
  final Dio _dio;

  SalesRepository(this._dio);

  /// POST /api/sales answers with the sale itself, PUT /api/transactions (finalising a draft)
  /// with {success, data: sale}: always hand back the sale, or the receipt shows 0 and no items.
  static Map<String, dynamic> _sale(dynamic body) {
    if (body is Map && body['success'] == false) {
      throw Exception(body['error']?.toString() ?? 'Erreur serveur');
    }
    if (body is Map && body['data'] is Map && body['totalCdf'] == null) {
      return Map<String, dynamic>.from(body['data'] as Map);
    }
    if (body is Map) return Map<String, dynamic>.from(body);
    throw Exception('Réponse inattendue du serveur');
  }

  static String _reason(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['error'] != null) return data['error'].toString();
      if (data is String && data.isNotEmpty && data.length < 200) return data;
      return e.message ?? e.toString();
    }
    return e.toString().replaceFirst('Exception: ', '');
  }

  Future<Map<String, dynamic>> createSale({
    required List<CartItem> items,
    required String paymentMethod, // CASH, CARD, etc.
    String? clientId,
    String orderType = "DINE_IN", // DINE_IN, TAKEAWAY, DELIVERY
    DeliveryInfo? deliveryInfo,
    String status = "COMPLETED", // DRAFT, COMPLETED
  }) async {
    try {
      final payload = {
        "items": items
            .map(
              (item) => {
                "productId": item.product.id,
                "quantity": item.quantity,
                "price": item.unitPriceUsd,
                "priceCdf": item.unitPriceCdf,
                "saleUnit": item.product.saleUnit,
              },
            )
            .toList(),
        "clientId": clientId,
        "paymentMethod": paymentMethod,
        "orderType": orderType,
        "deliveryInfo": deliveryInfo?.toJson(),
        "status": status,
      };

      final res = await _dio.post("/api/sales", data: payload);
      return _sale(res.data);
    } catch (e) {
      throw Exception("Échec de la vente : ${_reason(e)}");
    }
  }

  Future<Map<String, dynamic>> updateSale({
    required String id,
    required List<CartItem> items,
    String? status, // "COMPLETED" to finalize
    String? paymentMethod,
    String? paymentReference,
    String? orderType,
    DeliveryInfo? deliveryInfo,
  }) async {
    try {
      final payload = {
        "items": items
            .map(
              (item) => {
                "productId": item.product.id,
                "quantity": item.quantity,
                "unitPrice": item.unitPriceUsd,
                "unitPriceCdf": item.unitPriceCdf,
              },
            )
            .toList(),
        if (status != null) "status": status,
        if (paymentMethod != null) "paymentMethod": paymentMethod,
        if (paymentReference != null) "paymentReference": paymentReference,
        if (orderType != null) "orderType": orderType,
        if (deliveryInfo != null) "deliveryInfo": deliveryInfo.toJson(),
      };

      final res = await _dio.put("/api/transactions?id=$id", data: payload);
      return _sale(res.data);
    } catch (e) {
      throw Exception("Erreur de mise à jour : ${_reason(e)}");
    }
  }

  /// Sales of a status (drafts screen), newest first.
  Future<List<dynamic>> getTransactions({
    String status = "COMPLETED",
    String? startDate,
    String? endDate,
  }) async {
    try {
      final res = await _dio.get(
        ApiConstants.transactions,
        queryParameters: {
          'status': status,
          'limit': 50,
          if (startDate != null) 'startDate': startDate,
          if (endDate != null) 'endDate': endDate,
        },
      );
      return res.data['data'] ?? [];
    } catch (e) {
      return [];
    }
  }

  /// One page of completed sales for a local day, newest first, with the day's totals
  /// (computed by the server over the whole day, not just this page).
  Future<SalesPage> getSalesPage({
    required DateTime day,
    int page = 1,
    int limit = 20,
  }) async {
    final (start, end) = kinshasaDayBounds(day);
    try {
      final res = await _dio.get(
        ApiConstants.transactions,
        queryParameters: {
          'status': 'COMPLETED',
          'page': page,
          'limit': limit,
          'startDate': start.toUtc().toIso8601String(),
          'endDate': end.toUtc().toIso8601String(),
        },
      );
      final body = res.data;
      if (body is! Map || body['success'] == false) {
        throw Exception(body is Map ? body['error'] : 'Réponse inattendue');
      }
      double n(Object? v) => double.tryParse(v?.toString() ?? '') ?? 0;
      final summary = (body['summary'] as Map?) ?? const {};
      final pagination = (body['pagination'] as Map?) ?? const {};
      return SalesPage(
        items: List<Map<String, dynamic>>.from(
          (body['data'] as List? ?? []).map(
            (e) => Map<String, dynamic>.from(e as Map),
          ),
        ),
        total: (pagination['total'] as num?)?.toInt() ?? 0,
        totalPages: (pagination['totalPages'] as num?)?.toInt() ?? 1,
        totalCdf: n(summary['totalCdf']),
        totalUsd: n(summary['totalUsd']),
      );
    } catch (e) {
      throw Exception("Historique indisponible : ${_reason(e)}");
    }
  }
}

class SalesPage {
  final List<Map<String, dynamic>> items;
  final int total;
  final int totalPages;
  final double totalCdf;
  final double totalUsd;

  const SalesPage({
    required this.items,
    required this.total,
    required this.totalPages,
    required this.totalCdf,
    required this.totalUsd,
  });
}

@riverpod
Future<SalesRepository> salesRepository(SalesRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return SalesRepository(dio);
}
