Authentication Flow:
├── Login: /login → components/auth/login-form.tsx
│   └── Uses: signIn("credentials") → NextAuth
│
├── Register: /register → components/auth/register-form.tsx
│   └── Uses: axios.post() → Strapi → auto signIn()
│
├── NextAuth API: /api/auth/[...nextauth]/route.ts
│   ├── Uses: axios.post() → Strapi auth endpoint
│   ├── Validates: Zod schemas
│   └── Returns: User + JWT token
│
├── Session Management:
│   ├── JWT Strategy
│   ├── Callbacks: jwt() & session()
│   └── Stores: User data + Strapi JWT
│
├── Sign Out:
│   └── nav-user.tsx
│
└── Protected Routes: proxy.ts
    └── Middleware protects /dashboard/*
