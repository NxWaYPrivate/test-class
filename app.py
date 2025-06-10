from flask import Flask, render_template, request, jsonify
from datetime import datetime
import base64
import requests
import mysql.connector
import pytz

app = Flask(__name__)

# Connexion MySQL
db = mysql.connector.connect(
    host="localhost",
    user="net_noway",
    password="admin",
    database="bts_pointage"
)
cursor = db.cursor()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan_base64', methods=['POST'])
def scan_base64():
    try:
        data = request.get_json()
        image_data = data.get('image')

        if not image_data:
            return jsonify({'error': 'Aucune image reçue.'}), 400

        _, encoded = image_data.split(",", 1)
        decoded = base64.b64decode(encoded)
        files = {'file': ('image.png', decoded, 'image/png')}
        response = requests.post('https://api.qrserver.com/v1/read-qr-code/', files=files)
        result = response.json()

        content = result[0]['symbol'][0].get('data', '')
        if not content:
            return jsonify({'error': 'QR Code vide ou invalide.'})

        horodatage = datetime.now(pytz.timezone('Europe/Paris')).strftime('%Y-%m-%d %H:%M:%S')

        # Logique de reconnaissance
        if "Camion" in content:
            immat = content.split(':')[1].strip()
            cursor.execute("INSERT INTO pointage_camion (immatriculation, timestamp) VALUES (%s, %s)", (immat, horodatage))
            db.commit()
            message = f"Camion détecté : {immat}"
        elif "Nom" in content:
            nom = content.split(':')[1].strip()
            cursor.execute("INSERT INTO pointage_ouvrier (nom, timestamp) VALUES (%s, %s)", (nom, horodatage))
            db.commit()
            message = f"Ouvrier détecté : {nom}"
        else:
            return jsonify({'error': 'QR Code non reconnu.'})

        return jsonify({'message': message, 'timestamp': horodatage})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
