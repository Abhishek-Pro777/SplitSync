
export interface Person {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  date: string;
  category: 'Food' | 'Transport' | 'Housing' | 'Entertainment' | 'Other';
}

export interface Group {
  id: string;
  name: string;
  people: Person[];
  expenses: Expense[];
  createdAt: string;
}

export interface Balance {
  personId: string;
  paid: number;
  share: number;
  net: number;
}
