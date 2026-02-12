class User {
  final String id;
  final String email;
  final String role;
  final String status;
  final Profile? profile;

  User({
    required this.id,
    required this.email,
    required this.role,
    required this.status,
    this.profile,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      role: json['role'],
      status: json['status'],
      profile: json['profile'] != null ? Profile.fromJson(json['profile']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'status': status,
      'profile': profile?.toJson(),
    };
  }

  bool get isFreelancer => role == 'FREELANCER' || role == 'HYBRID';
  bool get isEmployer => role == 'EMPLOYER' || role == 'HYBRID';
}

class Profile {
  final String id;
  final String firstName;
  final String lastName;
  final String? displayName;
  final String? headline;
  final String? bio;
  final String? avatarUrl;
  final String? location;
  final double? hourlyRate;
  final String availability;
  final double totalEarnings;
  final double totalSpent;
  final int completedJobs;
  final double avgRating;
  final int totalReviews;
  final bool isVerified;

  Profile({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.displayName,
    this.headline,
    this.bio,
    this.avatarUrl,
    this.location,
    this.hourlyRate,
    required this.availability,
    required this.totalEarnings,
    required this.totalSpent,
    required this.completedJobs,
    required this.avgRating,
    required this.totalReviews,
    required this.isVerified,
  });

  String get fullName => displayName ?? '$firstName $lastName';

  String get initials => '${firstName[0]}${lastName[0]}';

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      displayName: json['displayName'],
      headline: json['headline'],
      bio: json['bio'],
      avatarUrl: json['avatarUrl'],
      location: json['location'],
      hourlyRate: json['hourlyRate']?.toDouble(),
      availability: json['availability'] ?? 'AVAILABLE',
      totalEarnings: (json['totalEarnings'] ?? 0).toDouble(),
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      completedJobs: json['completedJobs'] ?? 0,
      avgRating: (json['avgRating'] ?? 0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      isVerified: json['isVerified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'displayName': displayName,
      'headline': headline,
      'bio': bio,
      'avatarUrl': avatarUrl,
      'location': location,
      'hourlyRate': hourlyRate,
      'availability': availability,
      'totalEarnings': totalEarnings,
      'totalSpent': totalSpent,
      'completedJobs': completedJobs,
      'avgRating': avgRating,
      'totalReviews': totalReviews,
      'isVerified': isVerified,
    };
  }
}
