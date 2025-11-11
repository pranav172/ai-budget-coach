export type Expense = {
    id?: string;
    date: Date | string;
    amount: number;
    merchant: string;
    category?: string | null;
  };
  