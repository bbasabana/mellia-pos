class ApiConstants {
  // Mobile Emulator URL (Android uses 10.0.2.2, iOS uses localhost)
  // For physical device, use local IP like http://192.168.1.X:3000
  // static const String baseUrl = "http://localhost:3000";
  static const String baseUrl = "https://mellia-pos.vercel.app";

  // Auth
  static const String signIn = "/api/auth/signin";
  static const String session = "/api/auth/session";

  // Products
  static const String products = "/api/products";

  // Transactions
  static const String transactions = "/api/transactions";

  // Clients
  static const String clients = "/api/clients";
}
