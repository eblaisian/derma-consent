import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteDto, ChangeRoleDto } from './team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listMembers(@CurrentUser() user: CurrentUserPayload) {
    return this.teamService.listMembers(user.practiceId!);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createInvite(
    @Body() dto: InviteDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.teamService.createInvite(user.practiceId!, dto, user.userId);
  }

  @Delete('members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  removeMember(
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.teamService.removeMember(user.practiceId!, userId, user.userId);
  }

  @Patch('members/:userId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  changeRole(
    @Param('userId') userId: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.teamService.changeRole(user.practiceId!, userId, dto, user.userId);
  }

  // Public endpoints for invite acceptance
  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.teamService.getInviteByToken(token);
  }

  @Post('invite/:token/accept')
  @UseGuards(JwtAuthGuard)
  acceptInvite(
    @Param('token') token: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.teamService.acceptInvite(token, user.userId);
  }
}
