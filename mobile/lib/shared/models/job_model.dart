import 'user_model.dart';

class Job {
  final String id;
  final String title;
  final String description;
  final String category;
  final String? subcategory;
  final String jobType;
  final String experienceLevel;
  final String budgetType;
  final double? budgetMin;
  final double? budgetMax;
  final double? fixedPrice;
  final String? deadline;
  final String visibility;
  final String status;
  final bool isRemote;
  final int proposalCount;
  final int viewCount;
  final String createdAt;
  final User? poster;
  final List<JobSkill> skills;

  Job({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.subcategory,
    required this.jobType,
    required this.experienceLevel,
    required this.budgetType,
    this.budgetMin,
    this.budgetMax,
    this.fixedPrice,
    this.deadline,
    required this.visibility,
    required this.status,
    required this.isRemote,
    required this.proposalCount,
    required this.viewCount,
    required this.createdAt,
    this.poster,
    required this.skills,
  });

  String get budgetDisplay {
    if (fixedPrice != null) {
      return '\$${fixedPrice!.toStringAsFixed(0)}';
    }
    if (budgetMin != null && budgetMax != null) {
      return '\$${budgetMin!.toStringAsFixed(0)} - \$${budgetMax!.toStringAsFixed(0)}';
    }
    return 'Budget not specified';
  }

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      subcategory: json['subcategory'],
      jobType: json['jobType'],
      experienceLevel: json['experienceLevel'],
      budgetType: json['budgetType'],
      budgetMin: json['budgetMin']?.toDouble(),
      budgetMax: json['budgetMax']?.toDouble(),
      fixedPrice: json['fixedPrice']?.toDouble(),
      deadline: json['deadline'],
      visibility: json['visibility'],
      status: json['status'],
      isRemote: json['isRemote'] ?? true,
      proposalCount: json['proposalCount'] ?? 0,
      viewCount: json['viewCount'] ?? 0,
      createdAt: json['createdAt'],
      poster: json['poster'] != null ? User.fromJson(json['poster']) : null,
      skills: (json['skills'] as List<dynamic>?)
              ?.map((s) => JobSkill.fromJson(s))
              .toList() ??
          [],
    );
  }
}

class JobSkill {
  final String id;
  final Skill skill;
  final bool isRequired;

  JobSkill({
    required this.id,
    required this.skill,
    required this.isRequired,
  });

  factory JobSkill.fromJson(Map<String, dynamic> json) {
    return JobSkill(
      id: json['id'],
      skill: Skill.fromJson(json['skill']),
      isRequired: json['isRequired'] ?? true,
    );
  }
}

class Skill {
  final String id;
  final String name;
  final String slug;
  final String? category;

  Skill({
    required this.id,
    required this.name,
    required this.slug,
    this.category,
  });

  factory Skill.fromJson(Map<String, dynamic> json) {
    return Skill(
      id: json['id'],
      name: json['name'],
      slug: json['slug'],
      category: json['category'],
    );
  }
}
