import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

class ProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

class PasswordDto {
  @IsString()
  current!: string;

  @IsString()
  @MinLength(8)
  next!: string;
}

class PlanDto {
  @IsIn(['FREE', 'PRO', 'TEAM'])
  plan!: 'FREE' | 'PRO' | 'TEAM';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: ProfileDto) {
    return this.auth.updateProfile(user.id, dto.name);
  }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: PasswordDto) {
    return this.auth.changePassword(user.id, dto.current, dto.next);
  }

  @Patch('plan')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changePlan(@CurrentUser() user: { id: string }, @Body() dto: PlanDto) {
    return this.auth.changePlan(user.id, dto.plan);
  }
}
