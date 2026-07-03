import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { CurrentUserController } from './current-user.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, CurrentUserController],
  providers: [UsersService],
})
export class UsersModule {}
