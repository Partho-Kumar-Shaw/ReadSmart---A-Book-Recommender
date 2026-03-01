from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np

popular_df = pickle.load(open('popular.pkl', 'rb'))
pt = pickle.load(open('pt.pkl', 'rb'))
books = pickle.load(open('books.pkl', 'rb'))
similarity_scores = pickle.load(open('similarity_scores.pkl', 'rb'))

app = Flask(__name__)


# ================== HOME PAGE ==================
@app.route('/')
def index():
    return render_template(
        'index.html',
        book_name=list(popular_df['Book-Title'].values),
        author=list(popular_df['Book-Author'].values),
        image=list(popular_df['Image-URL-M'].values),
        votes=list(popular_df['num_ratings'].values),
        rating=list(popular_df['avg_rating'].values)
    )


# ================== RECOMMEND UI ==================
@app.route('/recommend')
def recommend_ui():
    return render_template('recommend.html', data=None, error=None)


# ================== RECOMMEND LOGIC ==================
@app.route('/recommend_books', methods=['POST'])
def recommend():
    user_input = request.form.get('user_input')

    try:
        if user_input not in pt.index:
            return render_template('recommend.html',
                                   data=None,
                                   error="❌ Book not found. Please try another name.")

        index = np.where(pt.index == user_input)[0][0]

        similar_items = sorted(
            list(enumerate(similarity_scores[index])),
            key=lambda x: x[1],
            reverse=True
        )[1:6]

        data = []
        for i in similar_items:
            item = []
            temp_df = books[books['Book-Title'] == pt.index[i[0]]]

            item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Title'].values))
            item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Author'].values))
            item.extend(list(temp_df.drop_duplicates('Book-Title')['Image-URL-M'].values))

            data.append(item)

        return render_template('recommend.html', data=data, error=None)

    except Exception:
        return render_template('recommend.html',
                               data=None,
                               error="⚠ Something went wrong. Please try again.")


# ================== REAL-TIME SUGGESTION API ==================
@app.route('/suggest')
def suggest():
    query = request.args.get('q')

    if query:
        suggestions = [title for title in pt.index if query.lower() in title.lower()]
        return jsonify(suggestions[:5])  # limit to 5 suggestions

    return jsonify([])


# ================== CONTACT PAGE ==================
@app.route('/contact')
def contact():
    return render_template('contact.html', success=None)


# ================== CONTACT FORM SUBMIT ==================
@app.route('/send_message', methods=['POST'])
def send_message():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')

    # Validation
    if not name or not email or not message:
        return render_template('contact.html',
                               success="❌ Please fill all fields.")

    # Save message to file
    with open("messages.txt", "a", encoding="utf-8") as f:
        f.write(f"Name: {name}\n")
        f.write(f"Email: {email}\n")
        f.write(f"Message: {message}\n")
        f.write("-" * 50 + "\n")

    return render_template('contact.html',
                           success="✅ Message sent successfully!")


if __name__ == '__main__':
    app.run(debug=True)