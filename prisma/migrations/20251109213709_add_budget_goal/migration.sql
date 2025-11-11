-- CreateTable
CREATE TABLE "BudgetGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetGoal_userId_month_key" ON "BudgetGoal"("userId", "month");
