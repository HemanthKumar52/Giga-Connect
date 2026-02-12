import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto, ProductReviewDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';
import { ProductStatus } from '@prisma/client';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search products' })
  async search(@Query() dto: SearchProductsDto) {
    return this.productsService.search(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my products' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  async getMyProducts(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.getMyProducts(userId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-purchases')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my purchased products' })
  async getMyPurchases(@CurrentUser('id') userId: string) {
    return this.productsService.getMyPurchases(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a product' })
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.publish(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.delete(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/purchase')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a product' })
  async purchase(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.purchase(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review' })
  async addReview(
    @Param('id') id: string,
    @Body() dto: ProductReviewDto,
  ) {
    return this.productsService.addReview(id, dto.rating, dto.title, dto.comment);
  }
}
