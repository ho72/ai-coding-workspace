import crypto from 'node:crypto'

const password = process.argv.slice(2).join(' ')

if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"')
  process.exit(1)
}

const salt = crypto.randomBytes(16).toString('base64url')
const hash = crypto.scryptSync(password, salt, 64).toString('base64url')
console.log(`scrypt$${salt}$${hash}`)
