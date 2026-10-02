import { OpenApiGeneratorV31, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { loginSchema, signupSchema } from '../../features/auth/auth.schemas'

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()


const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorBody } },
})

const jsonOk = <T extends z.ZodTypeAny>(description: string, schema: T) => ({
  description,
  content: { 'application/json': { schema } },
})


const UserPublic = registry.register(
  'User',
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string().datetime(),
  }),
)

const ErrorBody = registry.register(
  'Error',
  z.object({
    error: z.object({
      code: z.string().openapi({ example: 'invalid_credentials' }),
      message: z.string().openapi({ example: 'Email or password is incorrect.' }),
    }),
  }),
)

const Anchor = registry.register(
  'NoteAnchor',
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('free') }),
    z.object({ kind: z.literal('system'), id: z.string() }),
    z.object({ kind: z.literal('parts'), ids: z.array(z.string()) }),
  ]),
)

const Note = registry.register(
  'Note',
  z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    anchor: Anchor,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
)

const Preset = registry.register(
  'Preset',
  z.object({
    id: z.string(),
    name: z.string(),
    partIds: z.array(z.string()),
    createdAt: z.string().datetime(),
  }),
)


registry.registerPath({
  method: 'post',
  path: '/auth/signup',
  summary: 'Create an account',
  description: 'Sets the session and refresh cookies on success.',
  tags: ['auth'],
  request: { body: { content: { 'application/json': { schema: signupSchema } } } },
  responses: {
    201: jsonOk('Account created', z.object({ user: UserPublic })),
    400: jsonError('Validation failed'),
    409: jsonError('Email already registered'),
    429: jsonError('Too many attempts'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  summary: 'Sign in',
  description: 'Sets the session and refresh cookies on success.',
  tags: ['auth'],
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: {
    200: jsonOk('Signed in', z.object({ user: UserPublic })),
    400: jsonError('Validation failed'),
    401: jsonError('Invalid credentials'),
    429: jsonError('Too many attempts'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Rotate the session cookies',
  tags: ['auth'],
  responses: {
    204: { description: 'Cookies rotated' },
    401: jsonError('No valid refresh token'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Sign out',
  tags: ['auth'],
  responses: { 204: { description: 'Cookies cleared' } },
})

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Current user',
  tags: ['auth'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonOk('The signed-in user', z.object({ user: UserPublic })),
    401: jsonError('Not authenticated'),
  },
})


registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Liveness',
  tags: ['health'],
  responses: {
    200: jsonOk('Process is up', z.object({ ok: z.literal(true), uptime: z.number() })),
  },
})

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  summary: 'Readiness',
  description: 'Pings the database.',
  tags: ['health'],
  responses: {
    200: jsonOk('Database reachable', z.object({ ok: z.literal(true), db: z.literal('up') })),
    503: jsonOk('Database unreachable', z.object({ ok: z.literal(false), db: z.literal('down') })),
  },
})


registry.registerPath({
  method: 'get',
  path: '/notes',
  summary: 'List your notes',
  description: 'Returns every note owned by the signed-in user.',
  tags: ['notes'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonOk('Your notes', z.object({ notes: z.array(Note) })),
    401: jsonError('Not authenticated'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/notes',
  summary: 'Create a note',
  description:
    'A note must have a title, a body, or both. A note with neither is rejected.',
  tags: ['notes'],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().max(120).optional().default(''),
            body: z.string().max(5000).optional().default(''),
            anchor: Anchor,
          }),
        },
      },
    },
  },
  responses: {
    201: jsonOk('Note created', z.object({ note: Note })),
    400: jsonError('Validation failed — title and body are both empty'),
    401: jsonError('Not authenticated'),
  },
})

registry.registerPath({
  method: 'patch',
  path: '/notes/{id}',
  summary: 'Update a note',
  description: 'Partial update — send only the fields you want to change.',
  tags: ['notes'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().max(120).optional(),
            body: z.string().max(5000).optional(),
            anchor: Anchor.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: jsonOk('Note updated', z.object({ note: Note })),
    400: jsonError('Validation failed'),
    401: jsonError('Not authenticated'),
    404: jsonError('Note not found or not owned by you'),
  },
})

registry.registerPath({
  method: 'delete',
  path: '/notes/{id}',
  summary: 'Delete a note',
  tags: ['notes'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Note deleted' },
    401: jsonError('Not authenticated'),
    404: jsonError('Note not found or not owned by you'),
  },
})

registry.registerPath({
  method: 'get',
  path: '/presets',
  summary: 'List your presets',
  tags: ['presets'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonOk('Your presets', z.object({ presets: z.array(Preset) })),
    401: jsonError('Not authenticated'),
  },
})

registry.registerPath({
  method: 'post',
  path: '/presets',
  summary: 'Create a preset',
  tags: ['presets'],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(60),
            partIds: z.array(z.string()).min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: jsonOk('Preset created', z.object({ preset: Preset })),
    400: jsonError('Validation failed'),
    401: jsonError('Not authenticated'),
  },
})

registry.registerPath({
  method: 'patch',
  path: '/presets/{id}',
  summary: 'Update a preset',
  description: 'Rename, replace the part list, or both.',
  tags: ['presets'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(60).optional(),
            partIds: z.array(z.string()).min(1).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: jsonOk('Preset updated', z.object({ preset: Preset })),
    400: jsonError('Validation failed'),
    401: jsonError('Not authenticated'),
    404: jsonError('Preset not found or not owned by you'),
  },
})

registry.registerPath({
  method: 'delete',
  path: '/presets/{id}',
  summary: 'Delete a preset',
  tags: ['presets'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Preset deleted' },
    401: jsonError('Not authenticated'),
    404: jsonError('Preset not found or not owned by you'),
  },
})


registry.registerPath({
  method: 'get',
  path: '/users/me',
  summary: 'Read your profile',
  description: 'Alias of GET /auth/me. Both return the same shape.',
  tags: ['users'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonOk('Your profile', z.object({ user: UserPublic })),
    401: jsonError('Not authenticated'),
  },
})

registry.registerPath({
  method: 'patch',
  path: '/users/me',
  summary: 'Update your profile',
  tags: ['users'],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(60).optional(),
            email: z.string().email().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: jsonOk('Profile updated', z.object({ user: UserPublic })),
    400: jsonError('Validation failed'),
    401: jsonError('Not authenticated'),
    409: jsonError('Email already registered'),
  },
})

registry.registerPath({
  method: 'delete',
  path: '/users/me',
  summary: 'Delete your account',
  description: 'Permanently removes the account and every note and preset it owns.',
  tags: ['users'],
  security: [{ cookieAuth: [] }],
  responses: {
    204: { description: 'Account deleted' },
    401: jsonError('Not authenticated'),
  },
})


registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'session',
  description:
    'Session cookie set by /auth/login or /auth/signup. Rotated by /auth/refresh.',
})


export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'ProAnatomy API',
      version: '0.1.0',
      description:
        'Auth is cookie-based. Use /auth/login then /auth/me from a client that ' +
        'persists cookies (a browser, or a REST client with cookie support).',
    },
    servers: [{ url: 'http://localhost:4000/api', description: 'Local development' }],
    tags: [
      { name: 'auth', description: 'Signup, login, session management' },
      { name: 'health', description: 'Liveness and readiness probes' },
      { name: 'notes', description: 'Study notes attached to parts or systems' },
      { name: 'presets', description: 'Saved groups of structures' },
      { name: 'users', description: 'Profile management' },
    ],
  })
}
