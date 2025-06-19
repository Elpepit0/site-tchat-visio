import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import os

app = Flask(__name__, static_folder='frontend/dist', static_url_path='')

# Secret key et config sessions
app.secret_key = os.environ.get('SECRET_KEY', 'change-moi-vite')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Port
port = int(os.environ.get('PORT', 5000))

# CORS pour localhost:5173 (ton frontend Vite/React)
CORS(app, origins=["http://localhost:5000"], supports_credentials=True)

# Socket.IO avec eventlet
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5000"], async_mode="eventlet", manage_session=True)


db = SQLAlchemy(app)

# Modèle utilisateur
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

with app.app_context():
    db.create_all()

# Route pour servir le frontend React buildé
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')

# Inscription
@app.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Utilisateur déjà existant'}), 400
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Utilisateur créé avec succès'})

# Connexion
@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Identifiants invalides'}), 401
    session['username'] = user.username
    return jsonify({'message': 'Connexion réussie', 'username': user.username})

# Récupérer l'utilisateur connecté
@app.route('/me', methods=['GET'])
def me():
    if 'username' in session:
        return jsonify({'username': session['username']})
    return jsonify({'error': 'Non connecté'}), 401

# Déconnexion
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Déconnecté'})

# Messages en mémoire (pas persistés)
messages = []

@socketio.on('connect')
def handle_connect():
    emit('messages', messages)


@socketio.on('send_message')
def handle_send_message(data):
    message_text = data.get('message')
    if not message_text or not isinstance(message_text, str):
        return
    pseudo = session.get('username', 'Anonyme')
    message = {
        'id': str(uuid.uuid4()),
        'text': message_text,
        'pseudo': pseudo
    }
    messages.append(message)
    emit('messages', messages, broadcast=True)

@socketio.on('delete_message')
def handle_delete_message(data):
    msg_id = data.get('id')
    global messages
    messages = [m for m in messages if m['id'] != msg_id]
    emit('messages', messages, broadcast=True)

# Gestion des rooms WebRTC (optionnel)
@socketio.on('join-room')
def handle_join_room(room):
    join_room(room)
    emit('user-joined', room=room, include_self=False)

@socketio.on('leave-room')
def handle_leave_room(room):
    leave_room(room)
    emit('user-left', room=room, include_self=False)

@socketio.on('offer')
def handle_offer(data):
    room = data.get('room')
    offer = data.get('offer')
    if room and offer:
        emit('offer', offer, room=room, include_self=False)

@socketio.on('answer')
def handle_answer(data):
    room = data.get('room')
    answer = data.get('answer')
    if room and answer:
        emit('answer', answer, room=room, include_self=False)

@socketio.on('ice-candidate')
def handle_ice(data):
    room = data.get('room')
    candidate = data.get('candidate')
    if room and candidate:
        emit('ice-candidate', candidate, room=room, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=port)
