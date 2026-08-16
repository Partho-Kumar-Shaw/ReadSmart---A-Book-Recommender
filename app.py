from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np

popular_df = pickle.load(open('popular.pkl', 'rb'))
pt = pickle.load(open('pt.pkl', 'rb'))
books = pickle.load(open('books.pkl', 'rb'))
similarity_scores = pickle.load(open('similarity_scores.pkl', 'rb'))

app = Flask(__name__)


# ================== HOME PAGE ==================
TAGS = ["🔥 BookTok Viral", "⭐ Top Rated", "⚡ Mind Brawler", "💎 Classic Gem", "🚀 Trending 2026"]

def get_enriched_books():
    books_list = []
    for i in range(len(popular_df)):
        title = str(popular_df['Book-Title'].values[i])
        author = str(popular_df['Book-Author'].values[i])
        img = str(popular_df['Image-URL-M'].values[i])
        votes = int(popular_df['num_ratings'].values[i])
        rating = float(round(popular_df['avg_rating'].values[i], 2))
        tag = TAGS[i % len(TAGS)]
        books_list.append({
            'id': i,
            'title': title,
            'author': author,
            'image': img,
            'votes': votes,
            'rating': rating,
            'tag': tag
        })
    return books_list

@app.route('/')
def index():
    books_data = get_enriched_books()
    return render_template(
        'index.html',
        book_name=list(popular_df['Book-Title'].values),
        author=list(popular_df['Book-Author'].values),
        image=list(popular_df['Image-URL-M'].values),
        votes=list(popular_df['num_ratings'].values),
        rating=list(popular_df['avg_rating'].values),
        enriched_books=books_data
    )

@app.route('/topbooks')
def topbooks():
    books_data = get_enriched_books()
    return render_template(
        'topbooks.html',
        book_name=list(popular_df['Book-Title'].values),
        author=list(popular_df['Book-Author'].values),
        image=list(popular_df['Image-URL-M'].values),
        votes=list(popular_df['num_ratings'].values),
        rating=list(popular_df['avg_rating'].values),
        enriched_books=books_data
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
        if not user_input or user_input not in pt.index:
            return render_template('recommend.html',
                                   data=None,
                                   error="❌ Book not found in dataset. Please try another book title.")

        index = np.where(pt.index == user_input)[0][0]

        similar_items = sorted(
            list(enumerate(similarity_scores[index])),
            key=lambda x: x[1],
            reverse=True
        )[1:7]  # Fetch top 6 similar books

        data = []
        for i in similar_items:
            item = []
            temp_df = books[books['Book-Title'] == pt.index[i[0]]]

            item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Title'].values))
            item.extend(list(temp_df.drop_duplicates('Book-Title')['Book-Author'].values))
            item.extend(list(temp_df.drop_duplicates('Book-Title')['Image-URL-M'].values))

            # Add fallback rating / votes or calculation if available
            data.append({
                'title': item[0] if len(item) > 0 else "Unknown",
                'author': item[1] if len(item) > 1 else "Unknown",
                'image': item[2] if len(item) > 2 else "",
                'similarity': float(round(i[1] * 100, 1))
            })

        return render_template('recommend.html', data=data, user_input=user_input, error=None)

    except Exception as e:
        return render_template('recommend.html',
                               data=None,
                               error="⚠ Something went wrong. Please try searching for another title.")


# ================== REAL-TIME SUGGESTION & JSON API ==================
@app.route('/suggest')
def suggest():
    query = request.args.get('q')

    if query:
        suggestions = [title for title in pt.index if query.lower() in title.lower()]
        return jsonify(suggestions[:8])  # limit to 8 suggestions

    return jsonify([])


@app.route('/api/books')
def api_books():
    return jsonify(get_enriched_books())


@app.route('/api/random')
def api_random():
    books_data = get_enriched_books()
    import random
    selected = random.choice(books_data)
    return jsonify(selected)


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
                           success="✅ Message sent successfully! Our team will get back to you soon.")


if __name__ == '__main__':
    app.run(debug=True)