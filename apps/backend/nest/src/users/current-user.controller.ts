import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';

@Controller('user')
@UseGuards(AuthGuard)
export class CurrentUserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getCurrent(@CurrentUser() userId: number) {
    return this.usersService.getCurrentUser(userId);
  }

  @Put()
  update(@CurrentUser() userId: number, @Body() body: any) {
    return this.usersService.updateCurrentUser(userId, body);
  }
}
