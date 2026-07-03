import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../common/auth/token.service';
import { apiError } from '../common/api-error';
import { checkPassword, hashPassword } from '../common/auth/password';

type StoredUser = {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  passwordHash: string;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  private toUserResponse(user: StoredUser) {
    return {
      user: {
        email: user.email,
        token: this.tokenService.createToken(user.id),
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  private findById(id: number | undefined) {
    if (!id) return Promise.resolve(null);

    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async register(body: any) {
    const username =
      typeof body?.user?.username === 'string' ? body.user.username.trim() : '';
    const email =
      typeof body?.user?.email === 'string'
        ? body.user.email.trim().toLowerCase()
        : '';
    const password =
      typeof body?.user?.password === 'string' ? body.user.password : '';

    if (!username || !email || !password) {
      throw apiError(
        ['Username, email and password are required'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (password.length < 8) {
      throw apiError(
        ['Password must be at least 8 characters long'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!isValidEmail(email)) {
      throw apiError(['Email must be valid'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw apiError(['Email is already used'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw apiError(['Username is already used'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const passwordHash = await hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        bio: null,
        image: null,
        passwordHash,
      },
    });

    return this.toUserResponse(user);
  }

  async login(body: any) {
    const email =
      typeof body?.user?.email === 'string'
        ? body.user.email.trim().toLowerCase()
        : '';
    const password =
      typeof body?.user?.password === 'string' ? body.user.password : '';

    if (!email || !password) {
      throw apiError(
        ['Email and password are required'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!isValidEmail(email)) {
      throw apiError(['Email must be valid'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await checkPassword(password, user.passwordHash))) {
      throw apiError(['Email or password is wrong'], HttpStatus.UNAUTHORIZED);
    }

    return this.toUserResponse(user);
  }

  async getCurrentUser(userId: number | undefined) {
    const user = await this.findById(userId);

    if (!user) {
      throw apiError(['User not found'], HttpStatus.NOT_FOUND);
    }

    return this.toUserResponse(user);
  }

  async updateCurrentUser(userId: number | undefined, body: any) {
    const user = await this.findById(userId);

    if (!user) {
      throw apiError(['User not found'], HttpStatus.NOT_FOUND);
    }

    const usernameInput = body?.user?.username;
    const emailInput = body?.user?.email;
    const passwordInput = body?.user?.password;
    const bioInput = body?.user?.bio;
    const imageInput = body?.user?.image;

    if (
      usernameInput === undefined &&
      emailInput === undefined &&
      passwordInput === undefined &&
      bioInput === undefined &&
      imageInput === undefined
    ) {
      throw apiError(['At least one field is required'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (emailInput !== undefined && typeof emailInput !== 'string') {
      throw apiError(['Email must be text'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (usernameInput !== undefined && typeof usernameInput !== 'string') {
      throw apiError(['Username must be text'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (passwordInput !== undefined && typeof passwordInput !== 'string') {
      throw apiError(['Password must be text'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (
      bioInput !== undefined &&
      bioInput !== null &&
      typeof bioInput !== 'string'
    ) {
      throw apiError(['Bio must be text'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (
      imageInput !== undefined &&
      imageInput !== null &&
      typeof imageInput !== 'string'
    ) {
      throw apiError(['Image must be text'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const email =
      emailInput !== undefined ? emailInput.trim().toLowerCase() : undefined;
    const username =
      usernameInput !== undefined ? usernameInput.trim() : undefined;
    const password = passwordInput;
    const bio = bioInput === undefined ? undefined : bioInput?.trim() || null;
    const image =
      imageInput === undefined ? undefined : imageInput?.trim() || null;

    if (email !== undefined && !email) {
      throw apiError(['Email cannot be empty'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (email !== undefined && !isValidEmail(email)) {
      throw apiError(['Email must be valid'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (username !== undefined && !username) {
      throw apiError(['Username cannot be empty'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (password !== undefined && password.length < 8) {
      throw apiError(
        ['Password must be at least 8 characters long'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existingEmailUser =
      email !== undefined
        ? await this.prisma.user.findUnique({ where: { email } })
        : null;

    if (existingEmailUser && existingEmailUser.id !== user.id) {
      throw apiError(['Email is already used'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const existingUsernameUser =
      username !== undefined
        ? await this.prisma.user.findUnique({ where: { username } })
        : null;

    if (existingUsernameUser && existingUsernameUser.id !== user.id) {
      throw apiError(['Username is already used'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const updateData: {
      email?: string;
      username?: string;
      bio?: string | null;
      image?: string | null;
      passwordHash?: string;
    } = {};

    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio || null;
    if (image !== undefined) updateData.image = image || null;
    if (password !== undefined)
      updateData.passwordHash = await hashPassword(password);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return this.toUserResponse(updatedUser);
  }
}
