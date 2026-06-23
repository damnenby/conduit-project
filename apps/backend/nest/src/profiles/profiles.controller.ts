import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { AuthGuard } from '../common/auth/auth.guard';
import { OptionalAuthGuard } from '../common/auth/optional-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  getProfile(
    @Param('username') username: string,
    @CurrentUser() currentUserId: number | undefined,
  ) {
    return this.profilesService.getProfile(username, currentUserId);
  }

  @Post(':username/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  follow(
    @Param('username') username: string,
    @CurrentUser() currentUserId: number,
  ) {
    return this.profilesService.follow(username, currentUserId);
  }

  @Delete(':username/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  unfollow(
    @Param('username') username: string,
    @CurrentUser() currentUserId: number,
  ) {
    return this.profilesService.unfollow(username, currentUserId);
  }
}
