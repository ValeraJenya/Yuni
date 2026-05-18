import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getFoundationStatus() {
    return {
      status: 'placeholder',
      notes: [
        'Full auth flow is intentionally not implemented yet.',
        'Raw passwords and raw refresh tokens must never be stored.',
        'Future implementation must store password_hash and token_hash only.',
      ],
    };
  }
}
