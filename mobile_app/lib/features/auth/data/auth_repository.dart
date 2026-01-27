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
      // NextAuth Credentials Provider expects specific format
      // It returns a redirect or JSON. We must ensure we handle the 'csrf' if needed, but
      // standard NextAuth Credential provider often accepts direct POST if configured.
      // However, usually NextAuth requires a CSRF token first.
      // For this MVP, we try direct POST. If it fails due to CSRF, we will need to fetch CSRF first.
      // NextAuth v4 usually needs 'csrf'.
      // TRICK: We can try to hit /api/auth/callback/credentials? ...
      // OR: The web implementation simply does signIn('credentials').

      // OPTION 1: Direct POST request mimicking 'next-auth/react' client
      // This is hard.

      // OPTION 2: We assume the backend exposes a custom API route for Mobile Login?
      // NO. The requirement is "Consume existing Next.js APIs".

      // IMPLEMENTATION:
      // First, get CSRF token
      final csrfRes = await _dio.get("/api/auth/csrf");
      final csrfToken = csrfRes.data['csrfToken'];

      // Then Post Credentials
      // Then Post Credentials
      // Use JSON to prevent 302 Redirect (NextAuth behavior)
      final requestData = {
        'email': email,
        'password': password,
        'redirect': false,
        'csrfToken': csrfToken,
        'callbackUrl': '/',
        'json': true,
      };

      final response = await _dio.post(
        "/api/auth/signin/credentials",
        data: requestData,
        options: Options(
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Return-Redirect": "1", // Hint for NextAuth to return JSON
          },
          followRedirects: false,
          validateStatus: (status) => status! < 500,
        ),
      );

      print(
        "Login Response: ${response.statusCode} - ${response.headers['content-type']}",
      );

      if (response.statusCode == 302) {
        final location = response.headers.value('location');
        if (location != null && location.contains('error=')) {
          throw Exception("Erreur NextAuth: ${location.split('error=').last}");
        }
        // If it's a redirect to success, we might still be okay if cookies are set
      } else if (response.statusCode != 200) {
        throw Exception("Échec de connexion (${response.statusCode})");
      }

      // If we got HTML instead of JSON, something is wrong
      final contentType = response.headers.value('content-type') ?? '';
      if (!contentType.contains('application/json') &&
          response.statusCode == 200) {
        throw Exception(
          "Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez l'URL.",
        );
      }

      print("Login Success: ${response.data}");
    } on DioException catch (e) {
      String errorMessage = "Connexion impossible.";
      if (e.response != null) {
        errorMessage +=
            " (Status: ${e.response?.statusCode})\n${e.response?.data}";
      } else {
        errorMessage += "\nErreur: ${e.message}";
      }
      print("Login DioError: $errorMessage");
      throw Exception(errorMessage);
    } catch (e) {
      print("Login Error: $e");
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
