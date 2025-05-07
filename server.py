from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging
import datetime
from server_utils import get_local_ip, get_network_info, convert_image_to_pdf, list_uploads

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Simple HTML for the server status page
STATUS_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Phone Scanner Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #4A90E2; }
        .status { background-color: #e8f4ff; padding: 15px; border-radius: 5px; }
        .files { margin-top: 20px; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; }
        .info { color: #666; font-size: 0.9em; }
        .no-files { color: #999; font-style: italic; }
        .url-box { 
            background-color: #f5f5f5; padding: 10px; border-radius: 5px; 
            font-family: monospace; margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Phone Scanner Server</h1>
    <div class="status">
        <h2>Server Status: Running</h2>
        <p>Use one of these URLs in your phone app:</p>
        <div class="url-box">http://{{ network_info.ip }}:5000</div>
        <p class="info">
            Server running on {{ network_info.hostname }}<br>
            Upload directory: {{ upload_folder }}
        </p>
    </div>
    
    <div class="files">
        <h2>Recent Uploads ({{ files|length }})</h2>
        {% if files %}
            {% for file in files %}
                <div class="file-item">
                    <strong>{{ file.name }}</strong><br>
                    <span class="info">
                        Size: {{ (file.size / 1024)|round(1) }} KB | 
                        Uploaded: {{ file.modified|timestamp_to_str }}
                    </span>
                </div>
            {% endfor %}
        {% else %}
            <p class="no-files">No files have been uploaded yet.</p>
        {% endif %}
    </div>
</body>
</html>
"""

# Template filter for converting timestamps
@app.template_filter('timestamp_to_str')
def timestamp_to_str(timestamp):
    dt = datetime.datetime.fromtimestamp(timestamp)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

# Endpoints
@app.route('/', methods=['GET'])
def home():
    """Simple status page for the server"""
    files = list_uploads(UPLOAD_FOLDER, max_files=10)
    network_info = get_network_info()
    
    return render_template_string(
        STATUS_HTML, 
        network_info=network_info,
        upload_folder=UPLOAD_FOLDER,
        files=files
    )

@app.route('/discover', methods=['GET'])
def discover():
    """Endpoint for app to discover this server on the network"""
    logger.info(f"Discovery request received from {request.remote_addr}")
    return jsonify({'status': 'ok', 'message': 'Scanner server available'})

@app.route('/upload', methods=['POST'])
def upload():
    """Endpoint to receive document uploads from the app"""
    if 'file' not in request.files:
        logger.error("No file part in request")
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        logger.error("No file selected")
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # Generate timestamp for unique filenames
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Secure the filename
        original_filename = secure_filename(file.filename)
        filename = f"{timestamp}_{original_filename}"
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        logger.info(f"File saved: {file_path}")
        
        # If the file doesn't end in .pdf, try to convert it
        if not file_path.lower().endswith('.pdf'):
            try:
                pdf_path = convert_image_to_pdf(file_path)
                if pdf_path:
                    logger.info(f"Converted to PDF: {pdf_path}")
            except Exception as e:
                logger.error(f"Error converting to PDF: {str(e)}")
        
        # Return success with the filename and path
        return jsonify({
            'status': 'success', 
            'filename': filename,
            'path': file_path
        }), 200
            
    return jsonify({'error': 'Unknown error'}), 500

@app.route('/status', methods=['GET'])
def status():
    """Endpoint to check server status and recent uploads"""
    try:
        # List recent uploads (limited to 10)
        files = list_uploads(UPLOAD_FOLDER, max_files=10)
        network_info = get_network_info()
        
        return jsonify({
            'status': 'running',
            'network': network_info,
            'upload_folder': UPLOAD_FOLDER,
            'recent_files': [f['name'] for f in files],
            'file_count': len(files)
        })
    except Exception as e:
        logger.error(f"Error in status endpoint: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    network_info = get_network_info()
    print("\n" + "="*60)
    print(f"PHONE SCANNER SERVER STARTING")
    print("="*60)
    print(f"\nDocuments will be saved to: {UPLOAD_FOLDER}")
    print(f"\nServer URLs:")
    print(f"  Local:   http://127.0.0.1:5000")
    print(f"  Network: http://{network_info['ip']}:5000")
    print("\nUse the Network URL in your phone app settings")
    print("\n" + "="*60)
    app.run(host='0.0.0.0', port=5000, debug=True) 