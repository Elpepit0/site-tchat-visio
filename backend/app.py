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

# === CONFIGURATION DE L'APPLICATION FLASK ===
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')

app.secret_key = os.environ.get('SECRET_KEY', 'change-moi-vite')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True  # True uniquement en prod HTTPS

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

port = int(os.environ.get('PORT', 5000))

# Attention : avec supports_credentials=True, il faut spécifier une origine précise (pas "*")
CORS(app, origins="*", supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet", manage_session=True, message_queue='redis://')

db = SQLAlchemy(app)

# === TABLE USER ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

with app.app_context():
    db.create_all()

# === AUTH ROUTES ===
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
    print("Route /test-flask called")
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


# === WEBSOCKET CHAT ===
messages = []
connected_users = {}

MAX_MESSAGES = 100

@socketio.on('connect')
def handle_connect():
    connected_users[request.sid] = {"username": "Anonyme", "connected_at": time.time()}
    emit('messages', messages)
    # Émettre la liste actuelle des utilisateurs connectés (liste d’objets cohérents)
    emit('user_list', list(connected_users.values()), broadcast=True)

@socketio.on('set_username')
def handle_set_username(username):
    if request.sid in connected_users:
        connected_users[request.sid]["username"] = username
        connected_users[request.sid]["connected_at"] = time.time()
    else:
        connected_users[request.sid] = {"username": username, "connected_at": time.time()}
    emit('user_list', list(connected_users.values()), broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    connected_users.pop(request.sid, None)
    emit('user_list', list(connected_users.values()), broadcast=True)

@socketio.on('send_message')
def handle_send_message(data):
    text = data.get('text', '').strip()
    if not text or len(text) > 500:
        return

    username = session.get('username', 'Anonyme')
    message = {
        'id': str(uuid.uuid4()),
        'pseudo': username,
        'text': text
    }
    messages.append(message)
    if len(messages) > MAX_MESSAGES:
        messages.pop(0)

    emit('new_message', message, broadcast=True)

@socketio.on('delete_message')
def handle_delete_message(data):
    message_id = data.get('id')
    global messages
    messages = [msg for msg in messages if msg['id'] != message_id]
    emit('messages', messages, broadcast=True)


# === WEBSOCKET POUR WEBRTC ===

@socketio.on('join-room')
def handle_join_room(room):
    join_room(room)
    # Mieux vaut préciser l’utilisateur qui se connecte
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
