const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Failed to execute: ${command}`);
        throw error;
    }
}

function setupPythonEnv() {
    const venvPath = path.join(__dirname, '..', 'python-env');
    const requirementsPath = path.join(__dirname, '..', 'requirements.txt');

    // Create requirements.txt if it doesn't exist
    if (!fs.existsSync(requirementsPath)) {
        fs.writeFileSync(requirementsPath, 
            'matplotlib\nnumpy\nseaborn\npandas\nscikit-learn\n');
    }

    // Check if python3 is available
    try {
        execSync('python3 --version');
    } catch (error) {
        console.error('Python 3 is not installed. Please install Python 3 first.');
        process.exit(1);
    }

    // Create virtual environment if it doesn't exist
    if (!fs.existsSync(venvPath)) {
        console.log('Creating Python virtual environment...');
        executeCommand(`python3 -m venv ${venvPath}`);
    }

    // Activate virtual environment and install requirements
    const activateCmd = process.platform === 'win32' 
        ? `${venvPath}\\Scripts\\activate`
        : `. ${venvPath}/bin/activate`;

    console.log('Installing Python dependencies...');
    if (process.platform === 'win32') {
        executeCommand(`${venvPath}\\Scripts\\pip install -r ${requirementsPath}`);
    } else {
        executeCommand(`${venvPath}/bin/pip install -r ${requirementsPath}`);
    }

    console.log('Python environment setup complete!');
}

setupPythonEnv();