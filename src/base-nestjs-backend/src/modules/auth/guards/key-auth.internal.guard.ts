import { Injectable } from '@nestjs/common';
import { KeyAuthGuard } from './key-auth.guard';

/** Gates internal maintenance endpoints (e.g. storage cleanup). */
@Injectable()
export class KeyAuthInternalGuard extends KeyAuthGuard('INTERNAL_AUTH_TOKEN') {}
