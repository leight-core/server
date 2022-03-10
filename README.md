# Server

Server-side helper stuff.

## Schema

```prisma
model File {
  id       String    @id @default(cuid())
  path     String
  name     String
  mime     String
  size     Int
  location String
  ttl      Int?
  created  DateTime
  updated  DateTime?
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Job {
  id           String    @id @default(cuid())
  agenda       String    @unique
  status       JobStatus @default(NEW)
  total        Int       @default(0)
  success      Int?
  successRatio Decimal?  @db.Decimal(3, 2)
  failure      Int?
  failureRatio Decimal?  @db.Decimal(3, 2)
  created      DateTime
  logs         JobLog[]
  userId       String?
  user         User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model JobLog {
  id      String @id @default(cuid())
  jobId   String
  job     Job    @relation(fields: [jobId], references: [id], onDelete: Cascade)
  message String @db.Text
}

enum JobStatus {
  NEW
  RUNNING
  SUCCESS
  FAILURE
  DONE
}
```
