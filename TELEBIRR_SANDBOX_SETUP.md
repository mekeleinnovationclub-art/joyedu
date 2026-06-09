# Telebirr Sandbox Setup Checklist

## Step 1: Register for Telebirr Sandbox Account
- [ ] Visit https://developerportal.ethiotelebirr.et
- [ ] Register as a merchant
- [ ] Verify email address
- [ ] Log in to sandbox portal

## Step 2: Obtain API Credentials
- [ ] Navigate to API Keys section
- [ ] Copy `X-APP-KEY` → set as `TELEBIRR_X_APP_KEY` in `backend/.env`
- [ ] Copy `APP-SECRET` → set as `TELEBIRR_APP_SECRET` in `backend/.env`
- [ ] Copy `MERCHANT-APP-ID` → set as `TELEBIRR_MERCHANT_APP_ID` in `backend/.env`
- [ ] Copy `MERCHANT-CODE` → set as `TELEBIRR_MERCHANT_CODE` in `backend/.env`

## Step 3: Generate RSA Key Pair
- [ ] Generate RSA private key (2048-bit):
  ```bash
  openssl genrsa -out telebirr_private_key.pem 2048
  ```
- [ ] Extract public key from private key:
  ```bash
  openssl rsa -in telebirr_private_key.pem -pubout -out telebirr_public_key.pem
  ```
- [ ] Upload public key to Telebirr sandbox portal
- [ ] Move keys to backend config directory:
  ```bash
  mkdir -p backend/config
  mv telebirr_private_key.pem backend/config/
  mv telebirr_public_key.pem backend/config/
  ```
- [ ] Set key paths in `backend/.env`:
  - `TELEBIRR_PRIVATE_KEY_PATH=./config/telebirr_private_key.pem`
  - `TELEBIRR_PUBLIC_KEY_PATH=./config/telebirr_public_key.pem`

## Step 4: Configure Webhook URLs
- [ ] Set `TELEBIRR_NOTIFY_URL` in `backend/.env`:
  - Sandbox: `https://your-sandbox-domain.com/api/payments/telebirr/webhook`
  - Production: `https://your-domain.com/api/payments/telebirr/webhook`
- [ ] Set `TELEBIRR_REDIRECT_URL` in `backend/.env`:
  - Sandbox: `https://your-sandbox-domain.com/payment/telebirr/return`
  - Production: `https://your-domain.com/payment/telebirr/return`
- [ ] Register webhook URL in Telebirr sandbox portal

## Step 5: Update Backend .env File
Add the following to `backend/.env`:
```env
# Telebirr Configuration
TELEBIRR_BASE_URL=https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway
TELEBIRR_X_APP_KEY=your_actual_x_app_key
TELEBIRR_APP_SECRET=your_actual_app_secret
TELEBIRR_MERCHANT_APP_ID=your_actual_merchant_app_id
TELEBIRR_MERCHANT_CODE=your_actual_merchant_code
TELEBIRR_PRIVATE_KEY_PATH=./config/telebirr_private_key.pem
TELEBIRR_PUBLIC_KEY_PATH=./config/telebirr_public_key.pem
TELEBIRR_NOTIFY_URL=https://yourdomain.com/api/payments/telebirr/webhook
TELEBIRR_REDIRECT_URL=https://yourdomain.com/payment/telebirr/return
```

## Step 6: Test Connectivity
- [ ] Start backend server: `cd backend && npm run start:dev`
- [ ] Test fabric token endpoint (Telebirr API)
- [ ] Verify RSA key loading works
- [ ] Test signature generation/verification

## Step 7: End-to-End Testing
- [ ] Create test course in JoyEdu
- [ ] Open JoyEdu in Telebirr SuperApp (sandbox)
- [ ] Attempt course purchase
- [ ] Verify payment initiation
- [ ] Verify webhook receipt
- [ ] Verify enrollment creation
- [ ] Verify course appears in student dashboard

## Step 8: Production Checklist
- [ ] Obtain production credentials from Telebirr
- [ ] Update .env with production values
- [ ] Upload production public key to Telebirr
- [ ] Update webhook URLs to production domain
- [ ] Enable HTTPS for production domain
- [ ] Test production payment flow
- [ ] Monitor webhook logs
- [ ] Set up monitoring/alerts for payment failures
