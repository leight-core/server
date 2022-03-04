# Server

Server-side helper stuff.

## Schema

```prisma
model File {
    id			String    @id @default(cuid())
    path		String
    name		String
    mime		String
    size		Int
    location	String
    ttl			Int?
    created		DateTime
    updated		DateTime?
    userId      String

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
