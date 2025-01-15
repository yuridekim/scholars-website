import matplotlib.pyplot as plt
import numpy as np
import json
from io import BytesIO
import base64

def create_plot():
    # Create simple data
    x = np.array([1, 2, 3, 4, 5])
    y = np.array([2, 4, 5, 4, 5])
    
    # Create a simple, clean plot
    plt.figure(figsize=(8, 6))
    plt.plot(x, y, 'b-', linewidth=2)
    
    plt.title('Simple Plot')
    plt.xlabel('X')
    plt.ylabel('Y')
    
    # Remove top and right spines
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    
    # Save plot to base64 string
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close()
    
    # Create data for frontend
    data = {
        'plot': image_base64,
        'data': {
            'x': x.tolist(),
            'y': y.tolist()
        }
    }
    
    return json.dumps(data)

if __name__ == '__main__':
    print(create_plot())