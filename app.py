from flask import Flask, render_template, request, jsonify
from pyzbar.pyzbar import decode
from PIL import Image
import base64
import io

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

    # Décodage base64 en image
    try:
        header, encoded = image_data.split(',', 1)
        decoded_bytes = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(decoded_bytes))

        qr_codes = decode(image)

        if not qr_codes:
            return jsonify({'error': 'Aucun QR Code détecté.'})

        qr_text = qr_codes[0].data.decode('utf-8')

        # Nettoyage : extraire prénom même si texte style "Nom : Aymeric BAILLE"
        if ':' in qr_text:
            qr_text = qr_text.split(':', 1)[1].strip()

        return jsonify({'message': f'{qr_text}'})

    except Exception as e:
        return jsonify({'error': f'Erreur traitement image: {str(e)}'}), 500

@app.route('/pause', methods=['POST'])
def pause():
    return jsonify({'message': "Pause commencée ou terminée."})

@app.route('/stop', methods=['POST'])
def stop():
    return jsonify({'message': "Session terminée."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
