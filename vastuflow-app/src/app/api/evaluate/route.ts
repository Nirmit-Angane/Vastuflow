import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { itemName, zone } = await req.json();

        if (!itemName || !zone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Groq API Key not configured" }, { status: 500 });
        }

        const prompt = `You are an expert in Vastu Shastra.
A user has placed a custom item named "${itemName}" in the "${zone}" zone of their floor plan.

Please evaluate this placement based on Vastu principles and provide:
1. Status: One of "best", "good", "bad", "worst".
2. Reasoning: A brief explanation (1-2 sentences) why this status was chosen.
3. Fix: A practical remedy (1-2 sentences) if the status is bad or worst. If the status is good or best, provide a tip to enhance its energy.

Respond strictly in valid JSON format with exactly these three keys: "status", "reasoning", and "fix". Do not include Markdown blocks or any other text.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You output strict JSON. No markdown backticks." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 300,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("Empty response from Groq");
        }

        const parsedContent = JSON.parse(content);
        return NextResponse.json(parsedContent);

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Evaluation API Error:", err);
        return NextResponse.json({ error: err.message || "Failed to evaluate placement" }, { status: 500 });
    }
}
