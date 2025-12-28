
import { GoogleGenAI } from "@google/genai";
import { Expense, Person } from "../types";

export const getFinancialInsights = async (expenses: Expense[], people: Person[]) => {
  // Use the API key directly from process.env.API_KEY as per the guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const expenseSummary = expenses.map(e => ({
    description: e.description,
    amount: e.amount,
    paidBy: people.find(p => p.id === e.paidById)?.name,
    category: e.category
  }));

  const prompt = `
    Analyze these shared expenses for a group of 5 people. All amounts are in Indian Rupees (₹/INR): ${JSON.stringify(expenseSummary)}.
    Provide a concise, friendly summary of the spending habits. 
    Point out:
    1. Who has paid the most/least?
    2. Which category is draining the most money?
    3. One practical tip to save money as a group in the context of typical daily spending in India.
    
    Format the response in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this time. Please check back later.";
  }
};
