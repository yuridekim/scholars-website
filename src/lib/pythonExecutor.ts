import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function executePythonScript(scriptPath: string): Promise<string> {
    const pythonEnvPath = path.join(process.cwd(), 'python-env');
    const pythonExecutable = process.platform === 'win32'
        ? path.join(pythonEnvPath, 'Scripts', 'python.exe')
        : path.join(pythonEnvPath, 'bin', 'python');

    try {
        const { stdout, stderr } = await execAsync(`"${pythonExecutable}" "${scriptPath}"`);
        
        if (stderr) {
            console.error('Python Script Error:', stderr);
            throw new Error(stderr);
        }

        return stdout;
    } catch (error) {
        console.error('Error executing Python script:', error);
        throw error;
    }
}