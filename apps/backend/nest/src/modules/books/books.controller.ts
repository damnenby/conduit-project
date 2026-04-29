import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { BooksService } from './books.service';
import * as z from 'zod';
import { CreateBookDtoSchema, UpdateBookDtoSchema } from '@common/model';

@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get('/')
  getAllBooks() {
    return this.booksService.getAllBooks();
  }

  @Post('/')
  createBook(@Body() dto: unknown) {
    const result = CreateBookDtoSchema.safeParse(dto);
    if (result.error) throw new BadRequestException(result.error);

    return this.booksService.createBook(result.data);
  }

  @Get('/:id')
  getBookById(@Param('id') id: string) {
    const result = z.coerce.number().safeParse(id);
    if (result.error) throw new BadRequestException(`Invalid id: ${id}`);

    return this.booksService.getBookById(result.data);
  }

  @Put('/:id')
  replaceBook(@Param('id') id: string, @Body() dto: unknown) {
    const bookId = z.coerce.number().parse(id);
    const book = CreateBookDtoSchema.parse(dto);

    return this.booksService.replaceBook(bookId, book);
  }

  @Patch('/:id')
  updateBook(@Param('id') id: string, @Body() dto: unknown) {
    const bookId = z.coerce.number().parse(id);
    const book = UpdateBookDtoSchema.parse(dto);

    return this.booksService.updateBook(bookId, book);
  }

  @Delete('/:id')
  deleteBook(@Param('id') id: string) {
    const bookId = z.coerce.number().parse(id);
    return this.booksService.deleteBook(bookId);
  }
}
