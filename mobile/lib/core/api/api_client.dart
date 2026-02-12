import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const String baseUrl = 'http://10.0.2.2:4000/api'; // For Android emulator
// const String baseUrl = 'http://localhost:4000/api'; // For iOS simulator

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(AuthInterceptor(ref));
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));

  return dio;
});

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

class AuthInterceptor extends Interceptor {
  final Ref ref;

  AuthInterceptor(this.ref);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.read(key: 'accessToken');

    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final storage = ref.read(secureStorageProvider);
      final refreshToken = await storage.read(key: 'refreshToken');

      if (refreshToken != null) {
        try {
          final dio = Dio(BaseOptions(baseUrl: baseUrl));
          final response = await dio.post('/auth/refresh', data: {
            'refreshToken': refreshToken,
          });

          await storage.write(
            key: 'accessToken',
            value: response.data['accessToken'],
          );
          await storage.write(
            key: 'refreshToken',
            value: response.data['refreshToken'],
          );

          // Retry the original request
          final opts = err.requestOptions;
          opts.headers['Authorization'] =
              'Bearer ${response.data['accessToken']}';

          final cloneReq = await dio.fetch(opts);
          return handler.resolve(cloneReq);
        } catch (e) {
          // Refresh failed, logout user
          await storage.deleteAll();
        }
      }
    }

    handler.next(err);
  }
}

// API Service Providers
final authApiProvider = Provider<AuthApi>((ref) => AuthApi(ref.read(dioProvider)));
final userApiProvider = Provider<UserApi>((ref) => UserApi(ref.read(dioProvider)));
final jobApiProvider = Provider<JobApi>((ref) => JobApi(ref.read(dioProvider)));
final proposalApiProvider = Provider<ProposalApi>((ref) => ProposalApi(ref.read(dioProvider)));
final chatApiProvider = Provider<ChatApi>((ref) => ChatApi(ref.read(dioProvider)));

class AuthApi {
  final Dio dio;
  AuthApi(this.dio);

  Future<Response> login(String email, String password) =>
      dio.post('/auth/login', data: {'email': email, 'password': password});

  Future<Response> register(Map<String, dynamic> data) =>
      dio.post('/auth/register', data: data);

  Future<Response> logout() => dio.post('/auth/logout');

  Future<Response> me() => dio.get('/auth/me');
}

class UserApi {
  final Dio dio;
  UserApi(this.dio);

  Future<Response> getProfile() => dio.get('/users/me');

  Future<Response> updateProfile(Map<String, dynamic> data) =>
      dio.put('/users/me', data: data);

  Future<Response> getUser(String id) => dio.get('/users/$id');

  Future<Response> searchFreelancers(Map<String, dynamic> params) =>
      dio.get('/users/freelancers', queryParameters: params);
}

class JobApi {
  final Dio dio;
  JobApi(this.dio);

  Future<Response> list(Map<String, dynamic>? params) =>
      dio.get('/jobs', queryParameters: params);

  Future<Response> get(String id) => dio.get('/jobs/$id');

  Future<Response> create(Map<String, dynamic> data) =>
      dio.post('/jobs', data: data);

  Future<Response> update(String id, Map<String, dynamic> data) =>
      dio.put('/jobs/$id', data: data);

  Future<Response> myJobs(String? status) =>
      dio.get('/jobs/my-jobs', queryParameters: status != null ? {'status': status} : null);
}

class ProposalApi {
  final Dio dio;
  ProposalApi(this.dio);

  Future<Response> submit(Map<String, dynamic> data) =>
      dio.post('/proposals', data: data);

  Future<Response> get(String id) => dio.get('/proposals/$id');

  Future<Response> myProposals(String? status) =>
      dio.get('/proposals/my-proposals',
          queryParameters: status != null ? {'status': status} : null);

  Future<Response> accept(String id) => dio.post('/proposals/$id/accept');

  Future<Response> reject(String id) => dio.post('/proposals/$id/reject');
}

class ChatApi {
  final Dio dio;
  ChatApi(this.dio);

  Future<Response> getConversations() => dio.get('/chat/conversations');

  Future<Response> getMessages(String conversationId, int? page) =>
      dio.get('/chat/conversations/$conversationId/messages',
          queryParameters: page != null ? {'page': page} : null);

  Future<Response> sendMessage(String conversationId, Map<String, dynamic> data) =>
      dio.post('/chat/conversations/$conversationId/messages', data: data);
}
