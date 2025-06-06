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

        # Vérification robuste du contenu
        if isinstance(result, list) and len(result) > 0:
            symbols = result[0].get('symbol', [])
            if isinstance(symbols, list) and len(symbols) > 0:
                symbol_data = symbols[0].get('data')

                print("Contenu brut du QR :", symbol_data)

                if not symbol_data:
                    return jsonify({'error': 'Aucun QR détecté.'})

                # Nettoyage du contenu
                if "nom" in symbol_data.lower():
                    parts = symbol_data.split(':', 1)
                    if len(parts) == 2:
                        symbol_data = parts[1].strip()
                else:
                    symbol_data = symbol_data.strip()

                # Ajout de l'horodatage
                horodatage = datetime.now(pytz.timezone("Europe/Paris")).strftime("%d/%m/%Y %H:%M:%S")

                return jsonify({
                    'message': symbol_data,
                    'timestamp': horodatage
                })

        return jsonify({'error': 'Format de réponse inattendu.'})

    except Exception as e:
        return jsonify({'error': f'Erreur analyse : {str(e)}'}), 500
