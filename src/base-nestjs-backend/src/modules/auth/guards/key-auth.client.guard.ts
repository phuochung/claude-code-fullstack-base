import { Injectable } from '@nestjs/common';
import { KeyAuthGuard } from './key-auth.guard';

/** Gates the public storefront API with the website's static bearer token. */
@Injectable()
export class KeyAuthClientGuard extends KeyAuthGuard('WEBSITE_AUTH_TOKEN') {}
