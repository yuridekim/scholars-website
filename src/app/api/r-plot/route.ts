import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), 'viz-scripts', 'r_plot.R');
    
    // Execute R script
    const { stdout, stderr } = await execAsync(`Rscript ${scriptPath}`);
    
    if (stderr) {
      console.error('R Script Error:', stderr);
      return NextResponse.json({ error: 'Error executing R script' }, { status: 500 });
    }

    // Read the generated plot
    const plotPath = path.join(process.cwd(), 'public', 'r-plot.png');
    const plotBuffer = await fs.readFile(plotPath);
    const plotBase64 = plotBuffer.toString('base64');

    // Parse the JSON output from R (data points)
    const data = JSON.parse(stdout);
    
    return NextResponse.json({ 
      plot: plotBase64,
      data: data
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}