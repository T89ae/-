import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
};

const createClientTool: FunctionDeclaration = {
  name: "create_client",
  parameters: {
    type: Type.OBJECT,
    description: "إضافة عميل جديد (عامل / كفيل / وسيط)",
    properties: {
      name: { type: Type.STRING, description: "اسم العميل" },
      phone: { type: Type.STRING, description: "رقم الهاتف" },
      type: { type: Type.STRING, enum: ["worker", "sponsor", "middleman"], description: "نوع العميل" }
    },
    required: ["name", "phone", "type"]
  }
};

const createRequestTool: FunctionDeclaration = {
  name: "create_request",
  parameters: {
    type: Type.OBJECT,
    description: "إنشاء طلب خدمة جديد",
    properties: {
      service_type: { type: Type.STRING, description: "نوع الخدمة (تأشيرة، إقامة، نقل كفالة، إلخ)" },
      client_name: { type: Type.STRING, description: "اسم العميل" },
      status: { type: Type.STRING, enum: ["pending", "in_progress", "done"], description: "حالة الطلب" }
    },
    required: ["service_type", "client_name"]
  }
};

const trackRequestTool: FunctionDeclaration = {
  name: "track_request",
  parameters: {
    type: Type.OBJECT,
    description: "متابعة حالة طلب",
    properties: {
      query: { type: Type.STRING, description: "اسم العميل أو وصف الطلب للبحث عنه" }
    },
    required: ["query"]
  }
};

const suggestServicesTool: FunctionDeclaration = {
  name: "suggest_services",
  parameters: {
    type: Type.OBJECT,
    description: "اقتراح أفضل الخدمات بناءً على رغبة المستخدم",
    properties: {
      intent: { type: Type.STRING, description: "ماذا يريد المستخدم فعله؟" }
    },
    required: ["intent"]
  }
};

const extractFileDataTool: FunctionDeclaration = {
  name: "extract_file_data",
  parameters: {
    type: Type.OBJECT,
    description: "تحليل الملفات المرفوعة (PDF، صور، Excel) واستخراج البيانات منها",
    properties: {
      file_id: { type: Type.STRING, description: "معرف الملف المرفوع" }
    },
    required: ["file_id"]
  }
};

const autoFillFormTool: FunctionDeclaration = {
  name: "auto_fill_form",
  parameters: {
    type: Type.OBJECT,
    description: "تعبئة نماذج النظام تلقائياً باستخدام البيانات المستخرجة",
    properties: {
      data: { type: Type.OBJECT, description: "البيانات المراد تعبئتها" }
    },
    required: ["data"]
  }
};

export const chatWithAI = async (message: string, history: any[], userId: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: `أنت موظف عمليات ذكي في مكتب خدمات عامة يسمى "حلول" (7ulul).
          مهمتك هي مساعدة المستخدمين في إنجاز الخدمات مثل: إصدار التأشيرات، تجديد الإقامة، نقل الكفالة، المعاملات الحكومية، وعقود الإيجار.
          
          قواعد السلوك:
          - حاول دائماً التنفيذ باستخدام الأفعال (actions) كلما أمكن ذلك.
          - لا تشرح كثيراً إلا عند الضرورة.
          - اسأل أقل قدر ممكن من الأسئلة.
          - إذا كانت البيانات ناقصة -> اسأل سؤالاً قصيراً ومباشراً.
          - إذا تم رفع ملف -> قم باستدعاء extract_file_data فوراً باستخدام معرف الملف.
          - إذا كان المستخدم مستعجلاً -> أعطه أسرع مسار.
          
          النبرة:
          - ودود ومهني.
          - قصير وواضح.
          - لغة عربية بسيطة فقط.
          - لا تستخدم كلمات تقنية.
          
          المستخدم الحالي: ${userId}
          تاريخ المحادثة: ${JSON.stringify(history)}
          رسالة المستخدم: ${message}` }]
        }
      ],
      config: {
        tools: [{
          functionDeclarations: [
            createClientTool,
            createRequestTool,
            trackRequestTool,
            suggestServicesTool,
            extractFileDataTool,
            autoFillFormTool
          ]
        }]
      }
    });

    return {
      message: response.text || "جاري التنفيذ...",
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
};

export const analyzeFileWithAI = async (fileContent: string, fileType: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Analyze this file content and extract structured data for a business management system. 
            Classify the document type and extract entries for Workers, Sponsors (Kufala), Mediators, and Sales.
            Also identify any expenses or orders linked to specific agents.
            
            Return a JSON object with these keys: 
            - classification: string (the document type)
            - clients: array of {name, phone, category ('worker' | 'sponsor' | 'mediator'), notes}
            - agents: array of {name, phone}
            - agent_requests: array of {agent_name, description, paid_amount, wholesale_price}
            - accounting: array of {title, amount, type (income/expense), date}
            - workers: array of {name, job, sponsor, nid, registration_date}
            - sales: array of {customer_name, product_name, amount, date, supplier_name, wholesale_price, paid_amount}
            
            Ensure phone numbers are validated as strings. 
            Only return the JSON object, no other text.
            
            File Content:
            ${fileContent}` }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('File Analysis Error:', error);
    throw error;
  }
};

export const generateManualContent = async (topic: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Write a detailed user manual section in Arabic for the following topic in the "Thiqa System": ${topic}. Use markdown formatting.` }]
        }
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  } catch (error) {
    console.error('Generate Manual Error:', error);
    return "حدث خطأ أثناء إنشاء المحتوى.";
  }
};
