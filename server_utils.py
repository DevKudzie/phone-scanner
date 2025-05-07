import socket
import os
from PIL import Image
import io

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Create a socket connection to an external server
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Doesn't need to be reachable
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"  # Fallback to localhost

def get_network_info():
    """Get network information for the server"""
    local_ip = get_local_ip()
    hostname = socket.gethostname()
    
    return {
        'ip': local_ip,
        'hostname': hostname,
        'url': f"http://{local_ip}:5000"
    }

def convert_image_to_pdf(image_path, output_path=None):
    """
    Convert an image file to PDF
    
    Args:
        image_path (str): Path to the image file
        output_path (str, optional): Path where to save the PDF. If None,
                                    uses the same name as image but with .pdf extension
    
    Returns:
        str: Path to the created PDF file
    """
    if not output_path:
        output_path = os.path.splitext(image_path)[0] + ".pdf"
    
    try:
        # Open the image
        image = Image.open(image_path)
        
        # Convert to RGB if it's a different mode (e.g., RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save as PDF
        image.save(output_path, "PDF", resolution=100.0)
        return output_path
    except Exception as e:
        print(f"Error converting image to PDF: {str(e)}")
        return None

def check_filepath_exists(filepath):
    """Check if a file exists at the given path"""
    return os.path.isfile(filepath)

def list_uploads(uploads_dir, max_files=None):
    """
    List files in uploads directory, sorted by modification time (newest first)
    
    Args:
        uploads_dir (str): Path to uploads directory
        max_files (int, optional): Maximum number of files to return
        
    Returns:
        list: List of dictionaries with file information
    """
    if not os.path.exists(uploads_dir):
        return []
        
    files = []
    for filename in os.listdir(uploads_dir):
        file_path = os.path.join(uploads_dir, filename)
        if os.path.isfile(file_path):
            file_info = {
                'name': filename,
                'path': file_path,
                'size': os.path.getsize(file_path),
                'modified': os.path.getmtime(file_path)
            }
            files.append(file_info)
    
    # Sort by modification time (newest first)
    files.sort(key=lambda x: x['modified'], reverse=True)
    
    if max_files:
        files = files[:max_files]
        
    return files 