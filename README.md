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
  name         String
  status       JobStatus @default(NEW)
  total        Int       @default(0)
  progress     Decimal   @default(0) @db.Decimal(5, 2)
  success      Int?
  successRatio Decimal?  @db.Decimal(5, 2)
  failure      Int?
  failureRatio Decimal?  @db.Decimal(5, 2)
  skip         Int?
  skipRatio    Decimal?  @db.Decimal(5, 2)
  created      DateTime
  logs         JobLog[]
  userId       String?
  user         User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  params       String?
}

model JobLog {
  id      String @id @default(cuid())
  jobId   String
  job     Job    @relation(fields: [jobId], references: [id], onDelete: Cascade)
  message String @db.Text
}

enum JobStatus {
  // Just created, nobody cares about the job yet
  NEW
  // Job has been picked up and is in progress.
  RUNNING
  SUCCESS
  // Job has failed hard (usually outside of boundaris of the job handler)
  FAILURE
  //  Job has been processed, but there are some failed items
  REVIEW
  //  When everything is OK, it's done: goes from review->done and failure->done
  DONE
}
```
