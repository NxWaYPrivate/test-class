from flask import Flask, render_template, request, jsonify
from datetime import datetime
import pytz

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan_base64', methods=['POST'])
def scan_base64():
    #  résultat de scan QR code
    horodatage = datetime.now(pytz.timezone("Europe/Paris")).strftime("%d/%m/%Y %H:%M:%S")
    return jsonify({
        'message': "Aymeric BAILLE",
        'timestamp': horodatage
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
