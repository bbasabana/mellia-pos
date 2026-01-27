import 'package:dio/dio.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/features/clients/data/client_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'client_repository.g.dart';

class ClientRepository {
  final Dio _dio;

  ClientRepository(this._dio);

  Future<List<Client>> getClients({String query = ""}) async {
    try {
      final response = await _dio.get(
        ApiConstants.clients,
        queryParameters: {if (query.isNotEmpty) "query": query, "limit": 50},
      );

      // Adaptation to Next.js API response structure
      // Typically: { success: true, data: [...], pagination: {...} }
      final data = response.data;
      List<dynamic> list = [];

      if (data is Map && data.containsKey('data')) {
        list = data['data'];
      } else if (data is List) {
        list = data;
      }

      return list.map((e) => Client.fromJson(e)).toList();
    } catch (e) {
      // Return empty list on error for now to not block UI
      print("Error fetching clients: $e");
      return [];
    }
  }

  Future<Client> createClient(String name, String phone) async {
    try {
      final response = await _dio.post(
        ApiConstants.clients,
        data: {"name": name, "phone": phone},
      );
      return Client.fromJson(response.data);
    } catch (e) {
      throw Exception("Impossible de créer le client");
    }
  }
}

@riverpod
Future<ClientRepository> clientRepository(ClientRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return ClientRepository(dio);
}

@riverpod
Future<List<Client>> clients(ClientsRef ref, {String query = ""}) async {
  final repo = await ref.watch(clientRepositoryProvider.future);
  return repo.getClients(query: query);
}
