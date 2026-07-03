import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { AuthGuard } from '../common/auth/auth.guard';
import { OptionalAuthGuard } from '../common/auth/optional-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  list(@Query() query: any, @CurrentUser() userId: number | undefined) {
    return this.articlesService.list(query, userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body: any, @CurrentUser() userId: number) {
    return this.articlesService.create(body, userId);
  }

  @Get('feed')
  @UseGuards(AuthGuard)
  feed(@Query() query: any, @CurrentUser() userId: number) {
    return this.articlesService.feed(query, userId);
  }

  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  getOne(
    @Param('slug') slug: string,
    @CurrentUser() userId: number | undefined,
  ) {
    return this.articlesService.getOne(slug, userId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  update(
    @Param('slug') slug: string,
    @Body() body: any,
    @CurrentUser() userId: number,
  ) {
    return this.articlesService.update(slug, body, userId);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string, @CurrentUser() userId: number) {
    return this.articlesService.remove(slug, userId);
  }

  @Get(':slug/comments')
  @UseGuards(OptionalAuthGuard)
  getComments(
    @Param('slug') slug: string,
    @CurrentUser() userId: number | undefined,
  ) {
    return this.articlesService.getComments(slug, userId);
  }

  @Post(':slug/comments')
  @UseGuards(AuthGuard)
  addComment(
    @Param('slug') slug: string,
    @Body() body: any,
    @CurrentUser() userId: number,
  ) {
    return this.articlesService.addComment(slug, body, userId);
  }

  @Delete(':slug/comments/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() userId: number,
  ) {
    return this.articlesService.deleteComment(slug, id, userId);
  }

  @Post(':slug/favorite')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  favorite(@Param('slug') slug: string, @CurrentUser() userId: number) {
    return this.articlesService.favorite(slug, userId);
  }

  @Delete(':slug/favorite')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  unfavorite(@Param('slug') slug: string, @CurrentUser() userId: number) {
    return this.articlesService.unfavorite(slug, userId);
  }
}
