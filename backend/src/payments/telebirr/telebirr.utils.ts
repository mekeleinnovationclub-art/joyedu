import * as crypto from 'crypto';
import * as fs from 'fs';
import { EXCLUDE_FIELDS } from './telebirr.constants';

export function createTimeStamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function createNonceStr(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

export function signRequestObject(
  requestObject: Record<string, any>,
  privateKey: string,
): string {
  const fieldMap: Record<string, any> = {};

  // 1. Extract participating top-level fields
  for (const key in requestObject) {
    if (
      !EXCLUDE_FIELDS.includes(key) &&
      requestObject[key] !== undefined
    ) {
      fieldMap[key] = requestObject[key];
    }
  }

  // 2. Flatten and pull fields out of the nested biz_content object
  if (requestObject.biz_content) {
    const biz = requestObject.biz_content;
    for (const key in biz) {
      if (!EXCLUDE_FIELDS.includes(key) && biz[key] !== undefined) {
        fieldMap[key] = biz[key];
      }
    }
  }

  // 3. Sort keys alphabetically (ASCII format)
  const sortedKeys = Object.keys(fieldMap).sort();

  // 4. Construct the key=value parameter sequence
  const signOriginStr = sortedKeys
    .map((key) => `${key}=${fieldMap[key]}`)
    .join('&');

  // 5. Sign with SHA256withRSA
  const signer = crypto.createSign('SHA256');
  signer.update(signOriginStr);

  return signer.sign(privateKey, 'base64');
}

export function verifyTelebirrSignature(
  incomingPayload: Record<string, any>,
  publicKey: string,
): boolean {
  const { sign, sign_type, ...restParams } = incomingPayload;

  if (!sign) return false;

  // 1. Sort the keys alphabetically
  const sortedKeys = Object.keys(restParams).sort();

  // 2. Format exactly into a query string sequence
  const verifyString = sortedKeys
    .map((key) => `${key}=${restParams[key]}`)
    .join('&');

  // 3. Verify the signature using Telebirr's Public Key
  const verifier = crypto.createVerify('SHA256');
  verifier.update(verifyString);

  return verifier.verify(publicKey, sign, 'base64');
}

export function createRawRequest(
  prepayId: string,
  appId: string,
  merchCode: string,
  privateKey: string,
): string {
  const map = {
    appid: appId,
    merch_code: merchCode,
    nonce_str: createNonceStr(),
    prepay_id: prepayId,
    timestamp: createTimeStamp(),
  };

  const signature = signRequestObject(map, privateKey);

  return [
    `appid=${map.appid}`,
    `merch_code=${map.merch_code}`,
    `nonce_str=${map.nonce_str}`,
    `prepay_id=${map.prepay_id}`,
    `timestamp=${map.timestamp}`,
    `sign=${encodeURIComponent(signature)}`,
    'sign_type=SHA256WithRSA',
  ].join('&');
}

export function loadPrivateKey(path: string): string {
  return fs.readFileSync(path, 'utf8');
}

export function loadPublicKey(path: string): string {
  return fs.readFileSync(path, 'utf8');
}
