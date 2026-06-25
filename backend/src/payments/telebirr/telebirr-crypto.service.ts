import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TelebirrCryptoService {
  constructor(private readonly configService: ConfigService) {}

  // 1. Sort payload keys alphabetically for signing
  generateStringA(payload: Record<string, any>): string {
    const sortedKeys = Object.keys(payload).sort();
    return sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  }

  // 2. Generate SHA256 signature for outgoing requests
  generateSignature(stringA: string, appKey: string): string {
    const signString = `${stringA}&key=${appKey}`;
    return crypto.createHash('sha256').update(signString).digest('hex').toUpperCase();
  }

  // 3. Encrypt payload using Telebirr's Public Key (Outbound checkout)
  encryptRSA(payloadJsonStr: string, telebirrPublicKey: string): string {
    const buffer = Buffer.from(payloadJsonStr, 'utf8');
    const chunkSize = 245; // Safe boundary block for RSA-2048 with PKCS1 padding
    const encryptedChunks: Buffer[] = [];

    // Parse and sanitize public key line breaks cleanly
    let formattedKey = telebirrPublicKey.replace(/\\n/g, '\n').trim();
    if (!formattedKey.includes('-----BEGIN PUBLIC KEY-----')) {
      formattedKey = `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
    }

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);
      const encrypted = crypto.publicEncrypt(
        { key: formattedKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        chunk
      );
      encryptedChunks.push(encrypted);
    }
    return Buffer.concat(encryptedChunks).toString('base64');
  }

  // 4. Decrypt incoming data using your Merchant Private Key (Inbound Webhooks)
  decryptRSA(encryptedBase64Str: string, merchantPrivateKey: string): string {
    const buffer = Buffer.from(encryptedBase64Str, 'base64');
    const chunkSize = 256; // Fixed block size for RSA-2048 decryption cipher text
    const decryptedChunks: Buffer[] = [];

    // Safe Check: Process escape sequences and wrap boundaries if missing
    let formattedKey = merchantPrivateKey.replace(/\\n/g, '\n').trim();
    
    // Remove wrapping quotes if Windows environment file assignment introduced them
    if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
      formattedKey = formattedKey.slice(1, -1).replace(/\\n/g, '\n').trim();
    }

    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    }

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);
      const decrypted = crypto.privateDecrypt(
        { key: formattedKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        chunk
      );
      decryptedChunks.push(decrypted);
    }
    return Buffer.concat(decryptedChunks).toString('utf8');
  }

  // Get private key from config
  getPrivateKey(): string {
    const key = this.configService.get<string>('TELEBIRR_PRIVATE_KEY') || '';
    return key;
  }

  // Get public key from config
  getPublicKey(): string {
    const key = this.configService.get<string>('TELEBIRR_PUBLIC_KEY') || '';
    return key;
  }
}
