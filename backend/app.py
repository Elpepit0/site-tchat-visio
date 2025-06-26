# === IMPORTS ===
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import redis
import time
import uuid
import os
import json

# === CONFIGURATION FLASK & REDIS ===
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'change-moi-vite')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600 * 24 * 7
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://uq7xkhav1wn7wvjpvivh:iUo75NftjJPDK8opaITvrJ4YPsRDXo@bmmnewpodxpug01sbfgh-postgresql.services.clever-cloud.com:50013/bmmnewpodxpug01sbfgh'

port = int(os.environ.get('PORT', 5000))

CORS(app, origins=[
    "http://localhost:5173",
    "https://app-f78700db-fb68-49c7-ab1b-b4580a6d2cf7.cleverapps.io",
    "http://localhost:5000",
    "http://localhost:9000",
    "https://tchat-visio.cleverapps.io",
], supports_credentials=True)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

socketio = SocketIO(app, cors_allowed_origins=[
    "http://localhost:5173",
    "https://app-f78700db-fb68-49c7-ab1b-b4580a6d2cf7.cleverapps.io",
    "http://localhost:5000",
    "http://localhost:9000",
    "https://tchat-visio.cleverapps.io",
], async_mode="eventlet", manage_session=True, message_queue=REDIS_URL)

db = SQLAlchemy(app)

# === TABLE USER ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar_url = db.Column(db.String(256), nullable=True)

with app.app_context():
    db.create_all()

# === AUTHENTIFICATION ===
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

# === FRONTEND REACT SERVE ===
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
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

# === CHAT GLOBAL SYNCHRONISÉ AVEC REDIS ===

MAX_MESSAGES = 500
TYPING_USERS_KEY = "typing_users"

def get_connected_users():
    users = r.hvals('connected_users')
    result = []
    for u in users:
        user_info = json.loads(u)
        db_user = User.query.filter_by(username=user_info["username"]).first()
        avatar_url = db_user.avatar_url if db_user else None
        user_info["avatar_url"] = avatar_url
        result.append(user_info)
    return result

def add_connected_user(sid, username):
    user_info = {"username": username, "connected_at": time.time(), "sid": sid}
    r.hset('connected_users', sid, json.dumps(user_info))

def remove_connected_user(sid):
    r.hdel('connected_users', sid)

def update_username(sid, new_username):
    user_json = r.hget('connected_users', sid)
    if user_json:
        user_info = json.loads(user_json)
        user_info["username"] = new_username
        user_info["connected_at"] = time.time()
        r.hset('connected_users', sid, json.dumps(user_info))

def get_messages():
    return [json.loads(m) for m in r.lrange('messages', -MAX_MESSAGES, -1)]

def add_message(message):
    r.rpush('messages', json.dumps(message))
    r.ltrim('messages', -MAX_MESSAGES, -1)

# === SOCKET.IO EVENTS CHAT GLOBAL ===

@socketio.on('connect')
def handle_connect():
    username = session.get('username')
    if not username:
        username = f"Anonyme-{str(uuid.uuid4())[:4]}"
    add_connected_user(request.sid, username)
    print(f"Utilisateur {username} connecté avec SID : {request.sid}.")
    emit('messages', get_messages())
    emit('user_list', get_connected_users(), broadcast=True)

@socketio.on('set_username')
def handle_set_username(new_username):
    update_username(request.sid, new_username)
    print(f"SID {request.sid} a mis à jour le nom d'utilisateur vers {new_username}")
    emit('user_list', get_connected_users(), broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    user_json = r.hget('connected_users', request.sid)
    if user_json:
        username = json.loads(user_json)["username"]
        print(f"Utilisateur {username} (SID : {request.sid}) déconnecté.")
    remove_connected_user(request.sid)
    emit('user_list', get_connected_users(), broadcast=True)

@socketio.on('send_message')
def handle_send_message(data):
    text = data.get('text', '').strip()
    if not text or len(text) > 500:
        return
    user_json = r.hget('connected_users', request.sid)
    username = "Anonyme"
    if user_json:
        username = json.loads(user_json)["username"]
    message = {
        'id': str(uuid.uuid4()),
        'pseudo': username,
        'text': text,
        'reactions': {}
    }
    add_message(message)
    emit('new_message', message, broadcast=True)

@socketio.on('delete_message')
def handle_delete_message(data):
    message_id = data.get('id')
    if message_id == "all":
        r.delete('messages')
        emit('messages', [], broadcast=True)
        return
    messages = [m for m in get_messages() if m['id'] != message_id]
    r.delete('messages')
    for m in messages:
        r.rpush('messages', json.dumps(m))
    emit('messages', messages, broadcast=True)

@socketio.on('user_typing')
def handle_user_typing(data):
    pseudo = data.get('pseudo')
    emit('user_typing', {'pseudo': pseudo}, broadcast=True, include_self=False)

@socketio.on('react_message')
def handle_react_message(data):
    message_id = data.get('messageId')
    emoji = data.get('emoji')
    username = session.get('username', 'Anonyme')
    messages = [json.loads(m) for m in r.lrange('messages', -MAX_MESSAGES, -1)]
    found = False
    for msg in messages:
        if msg['id'] == message_id:
            if 'reactions' not in msg:
                msg['reactions'] = {}
            if emoji not in msg['reactions']:
                msg['reactions'][emoji] = []
            if username in msg['reactions'][emoji]:
                msg['reactions'][emoji].remove(username)
                if not msg['reactions'][emoji]:
                    del msg['reactions'][emoji]
            else:
                msg['reactions'][emoji].append(username)
            found = True
            break
    if found:
        r.delete('messages')
        for m in messages:
            r.rpush('messages', json.dumps(m))
        emit('messages', messages, broadcast=True)

# === WEBSOCKET POUR WEBRTC (rooms pour la visio uniquement) ===

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

# === AUTRES ROUTES ET CONFIG ===

@app.route('/set_avatar', methods=['POST'])
def set_avatar():
    if 'username' not in session:
        return jsonify({'error': 'Non connecté.'}), 401
    data = request.json
    avatar_url = data.get('avatar_url')
    user = User.query.filter_by(username=session['username']).first()
    if user:
        user.avatar_url = avatar_url
        db.session.commit()
        return jsonify({'message': 'Avatar mis à jour !'})
    return jsonify({'error': 'Utilisateur non trouvé.'}), 404

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

@app.before_request
def log_origin():
    print("Origin:", request.headers.get("Origin"))

@app.after_request
def allow_cors_for_native_clients(response):
    if request.headers.get("Origin") is None:
        response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# === LANCEMENT DU SERVEUR ===
if __name__ == '__main__':
    print("Eventlet utilisé :", socketio.async_mode)
    socketio.run(app, host='0.0.0.0', port=port)
