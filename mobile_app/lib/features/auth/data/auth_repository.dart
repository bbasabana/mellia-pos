import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';

part 'auth_repository.g.dart';

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<void> login(String email, String password) async {
    try {
      final response = await _dio.post(
        "/api/mobile/login",
        data: {'email': email, 'password': password},
      );

      print("Mobile Login Response: ${response.statusCode}");

      if (response.statusCode != 200) {
        throw Exception(
          response.data['error'] ??
              "Échec de connexion (${response.statusCode})",
        );
      }

      print("Login Success: ${response.data}");
    } on DioException catch (e) {
      String errorMessage = "Connexion impossible.";
      if (e.response != null) {
        errorMessage += "\n${e.response?.data['error'] ?? e.response?.data}";
      } else {
        errorMessage += "\nErreur: ${e.message}";
      }
      throw Exception(errorMessage);
    } catch (e) {
      throw Exception("Erreur inattendue: $e");
    }
  }

  Future<Map<String, dynamic>> getSession() async {
    try {
      final response = await _dio.get(
        ApiConstants.session,
        options: Options(headers: {"X-Auth-Return-Redirect": "1"}),
      );
      return response.data;
    } catch (e) {
      throw Exception("Failed to get session");
    }
  }

  Future<void> logout() async {
    try {
      // Get CSRF again for signout
      final csrfRes = await _dio.get("/api/auth/csrf");
      final csrfToken = csrfRes.data['csrfToken'];

      await _dio.post(
        "/api/auth/signout",
        data: {'csrfToken': csrfToken, 'json': 'true'},
        options: Options(contentType: Headers.formUrlEncodedContentType),
      );
    } catch (e) {
      print("Logout error (ignored): $e");
    }
  }
}

@riverpod
Future<AuthRepository> authRepository(AuthRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return AuthRepository(dio);
}
