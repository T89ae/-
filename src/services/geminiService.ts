import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateManualContent = async (section: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `أنت خبير في أنظمة إدارة المكاتب. اشرح بالتفصيل قسم "${section}" في نظام "ثقة" لإدارة الخدمات. 
    يجب أن يتضمن الشرح:
    1. نظرة عامة.
    2. الوظائف الرئيسية.
    3. كيفية الاستخدام.
    4. نصائح للأمان (مثل نظام اللقطات Snapshots).
    اجعل الإجابة بتنسيق Markdown وباللغة العربية.`,
  });
  return response.text;
};
