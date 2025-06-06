from flask import Flask, render_template, request, jsonify
import base64
import requests
from datetime import datetime
import pytz

app = Flask(__name__)  # ← Création de l'app AVANT les routes

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

        symbol_data = result[0].get('symbol', [{}])[0].get('data')
        if not symbol_data:
            return jsonify({'error': 'Aucun QR détecté.'})

        if ':' in symbol_data:
            symbol_data = symbol_data.split(':', 1)[1].strip()

        horodatage = datetime.now(pytz.timezone("Europe/Paris")).strftime("%d/%m/%Y %H:%M:%S")

        return jsonify({
            'message': symbol_data,
            'timestamp': horodatage
        })

    except Exception as e:
        return jsonify({'error': f'Erreur analyse : {str(e)}'}), 500

if __name__ == '__main__':
    app.run()
