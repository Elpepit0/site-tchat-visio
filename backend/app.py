# === IMPORTS ===
# Importation des outils nécessaires à Flask, à la base de données, aux WebSockets, à la sécurité et au système.
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import time
import uuid
import os

# === CONFIGURATION DE L'APPLICATION FLASK ===
# On crée l'application Flask et on définit où sont situés les fichiers React compilés.
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')

# Clé secrète pour sécuriser les sessions (à garder confidentielle).
app.secret_key = os.environ.get('SECRET_KEY', 'change-moi-vite')
app.config['SESSION_TYPE'] = 'filesystem'  # Les sessions sont stockées sur le disque.
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Empêche certaines attaques CSRF.
app.config['SESSION_COOKIE_SECURE'] = False    # Peut être mis à True en production (HTTPS).

# Configuration de la base de données avec SQLite.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Désactive un système de notification inutile.

# Port d'exécution (par défaut 5000, mais modifiable via une variable d'environnement).
port = int(os.environ.get('PORT', 5000))

# CORS : Autorise le frontend (React) à faire des requêtes vers le backend (Flask).
CORS(app, origins="*", supports_credentials=True)

# WebSocket avec Flask-SocketIO, en mode eventlet, et gestion automatique des sessions.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet", manage_session=True)

# Initialisation de SQLAlchemy (ORM pour gérer la base de données).
db = SQLAlchemy(app)

# === DÉFINITION DE LA TABLE UTILISATEUR ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)               # Clé primaire
    username = db.Column(db.String(80), unique=True, nullable=False)  # Nom unique
    password_hash = db.Column(db.String(128), nullable=False)  # Mot de passe hashé

# Création automatique de la table si elle n'existe pas déjà
with app.app_context():
    db.create_all()



# === ROUTES D'AUTHENTIFICATION ===

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Nom d’utilisateur déjà pris.'}), 409

    password_hash = generate_password_hash(password)
    new_user = User(username=username, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()

    session['username'] = username
    return jsonify({'message': 'Inscription réussie !'}), 200


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Nom d’utilisateur ou mot de passe invalide.'}), 401

    session['username'] = username
    return jsonify({'message': 'Connexion réussie !'}), 200


@app.route('/me', methods=['GET'])
def me():
    if 'username' in session:
        return jsonify({'username': session['username']})
    else:
        return jsonify({'error': 'Non connecté.'}), 401


@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'message': 'Déconnexion réussie !'})

@app.route('/test-flask')
def test_flask():
    print("Route /test-flask called")
    return "Flask fonctionne"


# === ROUTES POUR SERVIR LE FRONTEND REACT ===
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    print("Requête reçue pour :", path)  # Ajoute ça
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')




# === GESTION DU NOMBRE DE VISITEURS ACTIFS ===

visitors = {}  # Dictionnaire contenant l’heure du dernier ping de chaque utilisateur.

@app.route('/ping', methods=['POST'])
def ping():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())  # Identifiant unique pour ce visiteur

    sid = session['session_id']
    visitors[sid] = time.time()
    return jsonify({'status': 'pong'})

@app.route('/active_visitors')
def active_visitors():
    now = time.time()
    # On ne garde que les visiteurs qui ont pingé il y a moins de 2 secondes.
    active = [ip for ip, last_ping in visitors.items() if now - last_ping < 2]
    return jsonify({'active_visitors': len(active)})


# === WEBSOCKET — CHAT TEMPS RÉEL ===

messages = []  # Liste contenant les messages sous forme de dictionnaires.
connected_users = {}  # Dictionnaire pour suivre les utilisateurs connectés.

@socketio.on('connect')
def handle_connect():
    connected_users[request.sid] = 'Anonyme'  # Par défaut
    emit('messages', messages)
    emit('user_count', list(connected_users.values()), broadcast=True)

@socketio.on('set_username')
def handle_set_username(username):
    connected_users[request.sid] = username
    emit('user_count', list(connected_users.values()), broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    connected_users.pop(request.sid, None)
    emit('user_count', list(connected_users.values()), broadcast=True)



@socketio.on('send_message')
def handle_send_message(data):
    text = data.get('text', '').strip()
    if not text:
        return  # On ignore les messages vides.

    username = session.get('username', 'Anonyme')  # On récupère le nom depuis la session.
    message = {
        'id': str(uuid.uuid4()),  # ID unique pour supprimer le message plus tard.
        'pseudo': username,
        'text': text
    }
    messages.append(message)
    emit('new_message', message, broadcast=True)  # Envoie à tous les clients.


@socketio.on('delete_message')
def handle_delete_message(data):
    message_id = data.get('id')
    global messages
    messages = [msg for msg in messages if msg['id'] != message_id]  # On filtre la liste
    emit('messages', messages, broadcast=True)  # Mise à jour globale


# === WEBSOCKET — GESTION DES ROOMS POUR WEBRTC (APPELS) ===

@socketio.on('join-room')
def handle_join_room(room):
    join_room(room)
    emit('user-connected', {'room': room}, room=room)


@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, room=data['room'], include_self=False)

@socketio.on('answer')
def handle_answer(data):
    room = data.get('room')
    answer = data.get('answer')
    if not room or not answer:
        emit('answer', answer, room=room, include_self=False)


@socketio.on('ice-candidate')
def handle_ice(data):
    emit('ice-candidate', data, room=data['room'], include_self=False)


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

# === LANCEMENT DU SERVEUR ===

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=port)

