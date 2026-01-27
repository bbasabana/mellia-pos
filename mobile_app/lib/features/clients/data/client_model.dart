import 'package:freezed_annotation/freezed_annotation.dart';

part 'client_model.freezed.dart';
part 'client_model.g.dart';

@freezed
abstract class Client with _$Client {
  const factory Client({
    required String id,
    required String name,
    String? phone,
    String? email,
    @Default(0) int points,
    // Add other fields as needed from Prisma schema
  }) = _Client;

  factory Client.fromJson(Map<String, dynamic> json) => _$ClientFromJson(json);
}
