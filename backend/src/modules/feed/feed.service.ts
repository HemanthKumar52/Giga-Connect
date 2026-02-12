import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, CreateCommentDto } from './dto';
import { PostType, Visibility } from '@prisma/client';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        authorId,
        content: dto.content,
        imageUrls: dto.imageUrls || [],
        linkUrl: dto.linkUrl,
        postType: dto.postType || PostType.UPDATE,
        visibility: dto.visibility || Visibility.PUBLIC,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get posts from people the user follows + own posts
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          OR: [
            { authorId: { in: followingIds } },
            { visibility: Visibility.PUBLIC },
          ],
        },
        include: {
          author: { include: { profile: true } },
          _count: { select: { comments: true, likes: true } },
          likes: {
            where: { userId },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          OR: [
            { authorId: { in: followingIds } },
            { visibility: Visibility.PUBLIC },
          ],
        },
      }),
    ]);

    return {
      data: posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPost(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { include: { profile: true } },
        comments: {
          include: {
            author: { include: { profile: true } },
            replies: {
              include: {
                author: { include: { profile: true } },
              },
              take: 3,
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { comments: true, likes: true } },
        ...(userId && {
          likes: {
            where: { userId },
            take: 1,
          },
        }),
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...post,
      isLiked: userId ? (post as any).likes?.length > 0 : false,
    };
  }

  async deletePost(postId: string, authorId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id: postId } });

    return { message: 'Post deleted' };
  }

  async likePost(postId: string, userId: string) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });

      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });

      return { liked: false };
    }

    await this.prisma.like.create({
      data: { postId, userId },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });

    return { liked: true };
  }

  async addComment(postId: string, authorId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async deleteComment(commentId: string, authorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    return { message: 'Comment deleted' };
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      return { following: false };
    }

    await this.prisma.follow.create({
      data: { followerId, followingId },
    });

    return { following: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: { include: { profile: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: followers.map((f) => f.follower),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: { include: { profile: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: following.map((f) => f.following),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSuggestedConnections(userId: string, limit = 10) {
    // Get users with similar skills who the current user isn't following
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      select: { skillId: true },
    });

    const skillIds = userSkills.map((s) => s.skillId);

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const suggestions = await this.prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        status: 'ACTIVE',
        skills: {
          some: {
            skillId: { in: skillIds },
          },
        },
      },
      include: {
        profile: true,
        skills: { include: { skill: true }, take: 5 },
      },
      take: limit,
    });

    return suggestions.map((u) => {
      const { password, mfaSecret, ...rest } = u;
      return rest;
    });
  }
}
