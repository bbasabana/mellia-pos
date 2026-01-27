import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/core/constants/app_assets.dart';
import 'package:mellia_pos_mobile/shared/widgets/custom_text_field.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      await ref
          .read(authNotifierProvider.notifier)
          .login(_emailController.text.trim(), _passwordController.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Listen to auth state for errors or success
    ref.listen(authNotifierProvider, (previous, next) {
      if (next is AsyncError) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text("Erreur de Connexion"),
            content: Text(
              next.error.toString().replaceFirst("Exception: ", ""),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("OK"),
              ),
            ],
          ),
        );
      } else if (next is AsyncData && next.value != null) {
        // Navigate to Dashboard on success (Router will handle it, but fallback here)
        // context.go('/');
      }
    });

    final authState = ref.watch(authNotifierProvider);
    final isLoading = authState is AsyncLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // LOGO Placeholder
                    Image.asset(AppAssets.logo, height: 100),
                    const SizedBox(height: 16),
                    const Text(
                      "Mellia POS",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Connexion Caissier",
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 40),

                    CustomTextField(
                      label: "Email",
                      hint: "exemple@mellia.pos",
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icons.email_outlined,
                      validator: (value) {
                        if (value == null || value.isEmpty)
                          return 'Email requis';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    CustomTextField(
                      label: "Mot de passe",
                      hint: "••••••••",
                      controller: _passwordController,
                      isPassword: _obscurePassword,
                      prefixIcon: Icons.lock_outline,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: const Color(0xFF94A3B8),
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty)
                          return 'Mot de passe requis';
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),

                    PrimaryButton(
                      text: "Se connecter",
                      onPressed: _handleLogin,
                      isLoading: isLoading,
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (isLoading)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}
