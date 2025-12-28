
import { GoogleGenAI } from "@google/genai";
import { Expense, Person } from "../types";

export const getFinancialInsights = async (expenses: Expense[], people: Person[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const expenseSummary = expenses.map(e => ({
    description: e.description,
    amount: e.amount,
    paidBy: people.find(p => p.id === e.paidById)?.name,
    category: e.category
  }));

  const prompt = `
    Role: Financial Auditor for an Indian household/group.
    Data: ${JSON.stringify(expenseSummary.slice(0, 50))} (last 50 items).
    Currency: INR (₹).
    
    Tasks:
    1. Identify the 'Big Spender' and 'Silent Contributor'.
    2. Which category is eating up the budget?
    3. Suggest ONE culturally relevant saving tip (e.g., mention UPI habits, local transport, or grocery bulk buying).
    
    Style: Professional, punchy, and short. Use bold text for emphasis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};
