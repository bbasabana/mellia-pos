import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';

part 'api_provider.g.dart';

@Riverpod(keepAlive: true)
Future<Dio> dio(DioRef ref) async {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Cookie Persistence for NextAuth
  final appDocDir = await getApplicationDocumentsDirectory();
  final cookieJar = PersistCookieJar(
    storage: FileStorage("${appDocDir.path}/.cookies/"),
  );

  dio.interceptors.add(CookieManager(cookieJar));

  // Log Interceptor (Debug)
  dio.interceptors.add(
    LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print("🌐 [DIO] $obj"),
    ),
  );

  return dio;
}
