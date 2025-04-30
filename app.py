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

        # Récupération sécurisée du contenu QR
        symbol_data = result[0].get('symbol', [{}])[0].get('data')
        if not symbol_data:
            return jsonify({'error': 'Aucun QR détecté.'})

        # Nettoyage si le contenu contient "Nom :"
        if ':' in symbol_data:
            symbol_data = symbol_data.split(':', 1)[1].strip()

        return jsonify({'message': symbol_data})
        print("Image reçue")
        print("Résultat API QRserver :", result)

    except Exception as e:
        return jsonify({'error': f'Erreur analyse : {str(e)}'}), 500

@app.route('/pause', methods=['POST'])
def pause():
    return jsonify({'message': "Pause commencée ou terminée."})

@app.route('/stop', methods=['POST'])
def stop():
    return jsonify({'message': "Session terminée."})

if __name__ == '__main__':
    app.run()
