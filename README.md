# 📚 ***READSMART*** - A Book Recommender System

A machine learning-powered **Book Recommendation Web Application** built with **Flask**, **NumPy**, and **Pickle-based collaborative filtering models**.

This application allows users to:

- View popular books on the homepage
- Get personalized book recommendations based on a selected book
- Receive real-time book title suggestions while typing
- Submit messages through a contact form
- Explore a clean web-based recommendation interface

---

# 🚀 Features

## 1. Popular Books Homepage
Displays trending/popular books with:

- Book title
- Author name
- Cover image
- Number of ratings
- Average rating

---

## 2. Book Recommendation Engine
Users can enter a book name and receive **top 5 similar book recommendations** using a similarity matrix.

Recommendation logic uses:

- Collaborative filtering
- Precomputed similarity scores
- Pivot table indexing
- NumPy sorting

---

## 3. Real-Time Search Suggestions
As users type a book name, the app provides autocomplete suggestions.

Example:
Typing:

Harry

May suggest:

- Harry Potter and the Sorcerer's Stone
- Harry Potter and the Chamber of Secrets

---

## 4. Contact Form
Users can send feedback/messages directly through the website.

Submitted messages are saved locally in:

messages.txt

---

## 5. Error Handling
Handles:

- Book not found errors
- Empty contact form submissions
- Unexpected server errors

---

# 🛠 Tech Stack

## Backend
- Python 3.x
- Flask
- NumPy
- Pickle

## Frontend
- HTML
- CSS
- JavaScript
- Jinja2 Templates

## Machine Learning / Recommendation
- Collaborative Filtering
- Similarity Matrix
- Preprocessed Dataset Models

---

# 📂 Project Structure

```bash
book-recommender-system/
│
├── app.py
│
├── popular.pkl
├── pt.pkl
├── books.pkl
├── similarity_scores.pkl
│
├── messages.txt
│
├── templates/
│   ├── index.html
│   ├── recommend.html
│   └── contact.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── suggest.js
│   │
│   └── images/
│
├── requirements.txt
└── README.md