// prisma/seed.js - CommonJS wrapper for seed.ts
require('ts-node').register({ compilerOptions: { module: 'CommonJS' } })
require('./seed.ts')
