import { NextResponse } from 'next/server';
import path from 'path';
import { executePythonScript } from '@/lib/pythonExecutor';

export async function GET() {
    try {
        const scriptPath = path.join(process.cwd(), 'python-scripts', 'python_plot.py');
        const result = await executePythonScript(scriptPath);
        
        return NextResponse.json(JSON.parse(result));
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}