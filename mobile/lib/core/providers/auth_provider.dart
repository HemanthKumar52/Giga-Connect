import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../api/api_client.dart';
import '../../shared/models/user_model.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AsyncValue<AuthState>> {
  final AuthApi authApi;
  final UserApi userApi;
  final FlutterSecureStorage storage;

  AuthNotifier({
    required this.authApi,
    required this.userApi,
    required this.storage,
  }) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    final token = await storage.read(key: 'accessToken');
    if (token != null) {
      try {
        final response = await userApi.getProfile();
        final user = User.fromJson(response.data);
        state = AsyncValue.data(AuthState(
          user: user,
          isAuthenticated: true,
        ));
      } catch (e) {
        await storage.deleteAll();
        state = AsyncValue.data(AuthState());
      }
    } else {
      state = AsyncValue.data(AuthState());
    }
  }

  Future<void> login(String email, String password) async {
    state = AsyncValue.data(state.value!.copyWith(isLoading: true, error: null));

    try {
      final response = await authApi.login(email, password);
      await storage.write(key: 'accessToken', value: response.data['accessToken']);
      await storage.write(key: 'refreshToken', value: response.data['refreshToken']);

      final user = User.fromJson(response.data['user']);
      state = AsyncValue.data(AuthState(
        user: user,
        isAuthenticated: true,
      ));
    } catch (e) {
      state = AsyncValue.data(state.value!.copyWith(
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      ));
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
  }) async {
    state = AsyncValue.data(state.value!.copyWith(isLoading: true, error: null));

    try {
      final response = await authApi.register({
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
      });

      await storage.write(key: 'accessToken', value: response.data['accessToken']);
      await storage.write(key: 'refreshToken', value: response.data['refreshToken']);

      final user = User.fromJson(response.data['user']);
      state = AsyncValue.data(AuthState(
        user: user,
        isAuthenticated: true,
      ));
    } catch (e) {
      state = AsyncValue.data(state.value!.copyWith(
        isLoading: false,
        error: 'Registration failed. Please try again.',
      ));
    }
  }

  Future<void> logout() async {
    try {
      await authApi.logout();
    } catch (_) {}

    await storage.deleteAll();
    state = AsyncValue.data(AuthState());
  }

  void clearError() {
    if (state.value != null) {
      state = AsyncValue.data(state.value!.copyWith(error: null));
    }
  }
}

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<AuthState>>((ref) {
  return AuthNotifier(
    authApi: ref.read(authApiProvider),
    userApi: ref.read(userApiProvider),
    storage: ref.read(secureStorageProvider),
  );
});
