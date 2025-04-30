from flask import Flask, render_template, request, jsonify
import base64
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan_base64', methods=['POST'])
def scan_base64():
    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'Image manquante'}), 400
    try:
        _, encoded = image_data.split(',', 1)
        decoded = base64.b64decode(encoded)
        files = {'file': ('image.png', decoded, 'image/png')}
        response = requests.post('https://api.qrserver.com/v1/read-qr-code/', files=files)
        result = response.json()
        content = result[0]['symbol'][0]['data']
        if not content:
            return jsonify({'error': 'Aucun QR détecté.'})
        if ':' in content:
            content = content.split(':', 1)[1].strip()
        return jsonify({'message': content})
    except Exception as e:
        return jsonify({'error': f'Erreur : {str(e)}'}), 500

@app.route('/pause', methods=['POST'])
def pause():
    return jsonify({'message': "Pause commencée ou terminée."})

@app.route('/stop', methods=['POST'])
def stop():
    return jsonify({'message': "Session terminée."})

if __name__ == '__main__':
    app.run()
