// src/common/seed/seed-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../user.repository';

// Dev-only defaults so local dev works without extra setup. Production must
// provide SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD — resolveAdminAccount()
// fails fast otherwise, rather than seeding a publicly known account.
const DEV_FALLBACK_CREDENTIALS = {
  email: 'you@example.com',
  password: '12345678',
};

function resolveAdminAccount() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if ((!email || !password) && process.env.NODE_ENV === 'production') {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables must be set in production',
    );
  }

  return {
    email: email || DEV_FALLBACK_CREDENTIALS.email,
    password: password || DEV_FALLBACK_CREDENTIALS.password,
    name: 'Administrator',
    role: 1, // super admin role
    status: 2, // verified status
  };
}

@Injectable()
export class SeedAdminService {
  private readonly logger = new Logger(SeedAdminService.name);

  constructor(private readonly userRepository: UserRepository) { }

  async initAdmin() {
    const adminAccount = resolveAdminAccount();
    const existingAdmin = await this.userRepository.findOne({
      email: adminAccount.email,
      deleted: false,
    });

    if (!existingAdmin) {
      await this.userRepository.create(adminAccount);
      this.logger.log('✅ Super Admin account created');
    } else {
      this.logger.log('ℹ️ Super Admin account already exists');
    }
  }
}
