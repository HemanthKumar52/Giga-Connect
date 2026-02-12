import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from './dto';
import { ProductStatus, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateProductDto) {
    const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;

    return this.prisma.product.create({
      data: {
        sellerId,
        title: dto.title,
        slug,
        description: dto.description,
        shortDesc: dto.shortDesc,
        category: dto.category,
        subcategory: dto.subcategory,
        price: dto.price,
        salePrice: dto.salePrice,
        currency: dto.currency || 'USD',
        thumbnailUrl: dto.thumbnailUrl,
        imageUrls: dto.imageUrls || [],
        fileUrls: dto.fileUrls || [],
        demoUrl: dto.demoUrl,
        documentation: dto.documentation,
        version: dto.version,
        license: dto.license,
        status: ProductStatus.DRAFT,
        skills: {
          create: dto.skills?.map((slug) => ({
            skill: {
              connectOrCreate: {
                where: { slug },
                create: { name: slug, slug },
              },
            },
          })),
        },
      },
      include: {
        seller: { include: { profile: true } },
        skills: { include: { skill: true } },
      },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: { include: { profile: true } },
        skills: { include: { skill: true } },
        reviews: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        seller: { include: { profile: true } },
        skills: { include: { skill: true } },
        reviews: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return product;
  }

  async update(productId: string, sellerId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only edit your own products');
    }

    if (dto.skills) {
      await this.prisma.productSkill.deleteMany({
        where: { productId },
      });
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title,
        description: dto.description,
        shortDesc: dto.shortDesc,
        category: dto.category,
        subcategory: dto.subcategory,
        price: dto.price,
        salePrice: dto.salePrice,
        thumbnailUrl: dto.thumbnailUrl,
        imageUrls: dto.imageUrls,
        fileUrls: dto.fileUrls,
        demoUrl: dto.demoUrl,
        documentation: dto.documentation,
        version: dto.version,
        license: dto.license,
        ...(dto.skills && {
          skills: {
            create: dto.skills.map((slug) => ({
              skill: {
                connectOrCreate: {
                  where: { slug },
                  create: { name: slug, slug },
                },
              },
            })),
          },
        }),
      },
      include: {
        seller: { include: { profile: true } },
        skills: { include: { skill: true } },
      },
    });
  }

  async publish(productId: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only publish your own products');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.PUBLISHED },
    });
  }

  async delete(productId: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.prisma.product.delete({ where: { id: productId } });

    return { message: 'Product deleted' };
  }

  async search(dto: SearchProductsDto) {
    const { search, category, minPrice, maxPrice, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDesc: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: { include: { profile: true } },
          skills: { include: { skill: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyProducts(sellerId: string, status?: ProductStatus) {
    return this.prisma.product.findMany({
      where: {
        sellerId,
        ...(status && { status }),
      },
      include: {
        skills: { include: { skill: true } },
        _count: { select: { purchases: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async purchase(productId: string, buyerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId === buyerId) {
      throw new BadRequestException('You cannot purchase your own product');
    }

    const existingPurchase = await this.prisma.productPurchase.findFirst({
      where: { productId, buyerId },
    });

    if (existingPurchase) {
      throw new BadRequestException('You have already purchased this product');
    }

    const finalPrice = product.salePrice || product.price;
    const licenseKey = `GC-${nanoid(12).toUpperCase()}`;

    const purchase = await this.prisma.productPurchase.create({
      data: {
        productId,
        buyerId,
        price: finalPrice,
        currency: product.currency,
        licenseKey,
      },
      include: { product: true },
    });

    // Update sales count
    await this.prisma.product.update({
      where: { id: productId },
      data: { salesCount: { increment: 1 } },
    });

    return purchase;
  }

  async getMyPurchases(buyerId: string) {
    return this.prisma.productPurchase.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            seller: { include: { profile: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async addReview(productId: string, rating: number, title?: string, comment?: string) {
    const review = await this.prisma.productReview.create({
      data: { productId, rating, title, comment },
    });

    // Update product rating
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: { avgRating, reviewCount: reviews.length },
    });

    return review;
  }
}
