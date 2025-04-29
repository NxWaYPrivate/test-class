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
        return jsonify({'error': 'Image non fournie'}), 400

    try:
        header, encoded = image_data.split(',', 1)
        decoded_bytes = base64.b64decode(encoded)

        files = {'file': ('image.png', decoded_bytes, 'image/png')}
        response = requests.post('https://api.qrserver.com/v1/read-qr-code/', files=files)
        result = response.json()

        if not result or not result[0]['symbol'][0]['data']:
            return jsonify({'error': 'Aucun QR Code détecté.'})

        qr_text = result[0]['symbol'][0]['data']

        # Nettoyage : si QR contient "Nom : Aymeric BAILLE", on extrait juste la partie utile
        if ':' in qr_text:
            qr_text = qr_text.split(':', 1)[1].strip()

        return jsonify({'message': f'{qr_text}'})

    except Exception as e:
        return jsonify({'error': f'Erreur analyse QR : {str(e)}'}), 500

@app.route('/pause', methods=['POST'])
def pause():
    return jsonify({'message': "Pause commencée ou terminée."})

@app.route('/stop', methods=['POST'])
def stop():
    return jsonify({'message': "Session terminée."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
