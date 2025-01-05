from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.views import MethodView
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskmanager.db'
db = SQLAlchemy(app)

# Models
class List(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    position = db.Column(db.Integer)
    cards = db.relationship('Card', backref='list', lazy=True, cascade='all, delete-orphan')

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    assigned_to = db.Column(db.String(100))
    completion_rate = db.Column(db.Integer, default=0)
    position = db.Column(db.Integer)
    list_id = db.Column(db.Integer, db.ForeignKey('list.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    lists = List.query.order_by(List.position).all()
    return render_template('index.html', lists=lists)

class ListAPI(MethodView):
    def get(self):
        lists = List.query.order_by(List.position).all()
        return jsonify([{
            'id': lst.id,
            'title': lst.title,
            'position': lst.position,
            'cards': [{
                'id': card.id,
                'title': card.title,
                'description': card.description,
                'due_date': card.due_date.isoformat() if card.due_date else None,
                'assigned_to': card.assigned_to,
                'completion_rate': card.completion_rate,
                'position': card.position
            } for card in sorted(lst.cards, key=lambda x: x.position)]
        } for lst in lists])

    def post(self):
        data = request.json
        new_list = List(
            title=data['title'],
            position=data.get('position', List.query.count())
        )
        db.session.add(new_list)
        db.session.commit()
        return jsonify({
            'id': new_list.id,
            'title': new_list.title,
            'position': new_list.position
        })

class ListDetailAPI(MethodView):
    def put(self, list_id):
        lst = List.query.get_or_404(list_id)
        data = request.json
        lst.title = data.get('title', lst.title)
        lst.position = data.get('position', lst.position)
        db.session.commit()
        return jsonify({'message': 'List updated successfully'})

    def delete(self, list_id):
        lst = List.query.get_or_404(list_id)
        db.session.delete(lst)
        db.session.commit()
        return jsonify({'message': 'List deleted successfully'})

class CardAPI(MethodView):
    def post(self):
        data = request.json
        new_card = Card(
            title=data['title'],
            description=data.get('description', ''),
            due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
            assigned_to=data.get('assigned_to'),
            completion_rate=data.get('completion_rate', 0),
            position=data.get('position', Card.query.filter_by(list_id=data['list_id']).count()),
            list_id=data['list_id']
        )
        db.session.add(new_card)
        db.session.commit()
        return jsonify({
            'id': new_card.id,
            'title': new_card.title,
            'description': new_card.description,
            'due_date': new_card.due_date.isoformat() if new_card.due_date else None,
            'assigned_to': new_card.assigned_to,
            'completion_rate': new_card.completion_rate,
            'position': new_card.position
        })

@app.route('/api/cards/<int:card_id>', methods=['PUT', 'DELETE'])
def handle_card(card_id):
    card = Card.query.get_or_404(card_id)
    
    if request.method == 'PUT':
        data = request.json
        card.title = data.get('title', card.title)
        card.description = data.get('description', card.description)
        if 'due_date' in data:
            card.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
        card.assigned_to = data.get('assigned_to', card.assigned_to)
        card.completion_rate = data.get('completion_rate', card.completion_rate)
        card.position = data.get('position', card.position)
        card.list_id = data.get('list_id', card.list_id)
        db.session.commit()
        return jsonify({'message': 'Card updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(card)
        db.session.commit()
        return jsonify({'message': 'Card deleted successfully'})

# Register the API views
app.add_url_rule('/api/lists', view_func=ListAPI.as_view('lists'), methods=['GET', 'POST'])
app.add_url_rule('/api/lists/<int:list_id>', view_func=ListDetailAPI.as_view('list'), methods=['PUT', 'DELETE'])
app.add_url_rule('/api/cards', view_func=CardAPI.as_view('cards'), methods=['POST'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
