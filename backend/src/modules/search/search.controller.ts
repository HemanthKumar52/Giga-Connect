import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { GlobalSearchDto } from './dto';
import { Public } from '../../common/decorators';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Global search' })
  async globalSearch(@Query() dto: GlobalSearchDto) {
    return this.searchService.globalSearch(dto);
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'q', required: true })
  async getAutocompleteSuggestions(@Query('q') query: string) {
    return this.searchService.getAutocompleteSuggestions(query);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  async getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }
}
