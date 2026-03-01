import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { itemType, zone, status } = await req.json();

        if (!itemType || !zone || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY || "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";

        if (!apiKey) {
            return NextResponse.json({ error: "Groq API Key not configured" }, { status: 500 });
        }

        const prompt = `You are an expert in Vastu Shastra.
A user has placed a "${itemType}" in the "${zone}" zone of their floor plan.
According to Vastu principles, this placement is considered "${status}".

Since this placement is bad or worst, please provide:
1. A brief reasoning (1-2 sentences) explaining why this is considered ${status} in Vastu.
2. A practical, actionable remedy (1-2 sentences) to fix or mitigate this defect without requiring structural demolition. Focus on elemental correctors, colors, plants, or specific objects.

Respond strictly in valid JSON format with exactly these two keys: "reasoning" and "fix". Do not include Markdown blocks or any other text.`;

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
        console.error("Remedy API Error:", err);
        return NextResponse.json({ error: err.message || "Failed to generate remedy" }, { status: 500 });
    }
}
