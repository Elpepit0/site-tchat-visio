# === IMPORTS ===
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import time
import uuid
import os
import threading # Importer threading pour les verrous

# === CONFIGURATION DE L'APPLICATION FLASK ===
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')

app.secret_key = os.environ.get('SECRET_KEY', 'change-moi-vite')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True  # Mettre à True en production avec HTTPS
app.config['SESSION_PERMANENT'] = True # Rendre la session permanente
app.config['PERMANENT_SESSION_LIFETIME'] = 3600 * 24 * 7 # La session dure 7 jours

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

port = int(os.environ.get('PORT', 5000))

# Attention : avec supports_credentials=True, il faut spécifier une origine précise (pas "*")
# Pour le développement, "*" peut être acceptable, mais pour la production, spécifiez l'URL de votre frontend.
CORS(app, origins=[
    "http://localhost:5173",
    "https://app-f78700db-fb68-49c7-ab1b-b4580a6d2cf7.cleverapps.io",
    "http://localhost:5000",
], supports_credentials=True)

# Utiliser un verrou pour un accès thread-safe aux données partagées (messages, connected_users)
# C'est important car les gestionnaires SocketIO peuvent s'exécuter simultanément.
chat_lock = threading.Lock()

socketio = SocketIO(app, cors_allowed_origins=[
    "http://localhost:5173",
    "https://app-f78700db-fb68-49c7-ab1b-b4580a6d2cf7.cleverapps.io",
    "http://localhost:5000",
], async_mode="eventlet", manage_session=True)

db = SQLAlchemy(app)

# === TABLE USER ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

with app.app_context():
    db.create_all()

# === ROUTES D'AUTHENTIFICATION ===
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

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
    username = data.get('username')
    password = data.get('password')

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
    print("Route /test-flask appelée")
    return "Flask fonctionne"


# === FRONTEND REACT ===
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    print("Requête reçue pour :", path)
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')


# === VISITEURS ACTIFS ===
visitors = {}

@app.route('/ping', methods=['POST'])
def ping():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())

    sid = session['session_id']
    visitors[sid] = time.time()
    return jsonify({'status': 'pong'})

@app.route('/active_visitors')
def active_visitors():
    now = time.time()
    active = [sid for sid, last_ping in visitors.items() if now - last_ping < 2]
    return jsonify({'active_visitors': len(active)})


# === CHAT WEBSOCKET ===
messages = []

connected_users = {}

user_sids = {}

MAX_MESSAGES = 100

@socketio.on('connect')
def handle_connect():
    # Lorsqu'un client se connecte, Flask-SocketIO rend la session Flask disponible.
    username = session.get('username')
    if not username:
        username = f"Anonyme-{str(uuid.uuid4())[:4]}"

    with chat_lock:
        connected_users[request.sid] = {"username": username, "connected_at": time.time()}
        user_sids.setdefault(username, []).append(request.sid)
        print(f"Utilisateur {username} connecté avec SID : {request.sid}. Total connectés : {len(connected_users)}")

        emit('messages', messages)
        # Émettre la liste des utilisateurs à tous les clients
        emit('user_list', list(connected_users.values()), broadcast=True)

@socketio.on('set_username')
def handle_set_username(new_username):
    with chat_lock:
        old_username = connected_users.get(request.sid, {}).get("username")
        if old_username and old_username != new_username:
            if request.sid in user_sids.get(old_username, []):
                user_sids[old_username].remove(request.sid)
                if not user_sids[old_username]:
                    del user_sids[old_username]

        connected_users[request.sid]["username"] = new_username
        user_sids.setdefault(new_username, []).append(request.sid)
        print(f"SID {request.sid} a mis à jour le nom d'utilisateur vers {new_username}")
        emit('user_list', list(connected_users.values()), broadcast=True)


@socketio.on('disconnect')
def handle_disconnect():
    with chat_lock:
        user_info = connected_users.pop(request.sid, None)
        if user_info:
            username = user_info["username"]
            if request.sid in user_sids.get(username, []):
                user_sids[username].remove(request.sid)
                if not user_sids[username]:
                    del user_sids[username]

            print(f"Utilisateur {username} (SID : {request.sid}) déconnecté. Total connectés : {len(connected_users)}")
            emit('user_list', list(connected_users.values()), broadcast=True)

@socketio.on('send_message')
def handle_send_message(data):
    text = data.get('text', '').strip()
    if not text or len(text) > 500:
        return

    username = connected_users.get(request.sid, {}).get("username", "Anonyme")

    message = {
        'id': str(uuid.uuid4()),
        'pseudo': username,
        'text': text
    }
    with chat_lock:
        messages.append(message)
        if len(messages) > MAX_MESSAGES:
            messages.pop(0)

    emit('new_message', message, broadcast=True)

@socketio.on('delete_message')
def handle_delete_message(data):
    message_id = data.get('id')
    with chat_lock:
        global messages
        messages = [msg for msg in messages if msg['id'] != message_id]
    emit('messages', messages, broadcast=True)


# === WEBSOCKET POUR WEBRTC ===
@socketio.on('join-room')
def handle_join_room(room):
    join_room(room)
    emit('user-connected', {'room': room, 'user': request.sid}, room=room)

@socketio.on('offer')
def handle_offer(data):
    room = data.get('room')
    if room:
        emit('offer', data, room=room, include_self=False)

@socketio.on('answer')
def handle_answer(data):
    room = data.get('room')
    if room:
        emit('answer', data, room=room, include_self=False)

@socketio.on('ice-candidate')
def handle_ice(data):
    room = data.get('room')
    if room:
        emit('ice-candidate', data, room=room, include_self=False)


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


# === LANCEMENT DU SERVEUR ===
if __name__ == '__main__':
    print("Eventlet utilisé :", socketio.async_mode)
    socketio.run(app, host='0.0.0.0', port=port)
