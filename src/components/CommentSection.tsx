import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface Comment {
  id: number;
  productId: number;
  text: string;
  name: string; 
  created_at: string;

}

interface CommentsSectionProps {
  productId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ productId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [name, setName] = useState<string>(''); 

  // hämtar kommentarer när produktId ändras
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`http://localhost:3001/products/${productId}/comments`);
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [productId]);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newComment.trim() !== '' && name.trim() !== '') { //kollar att namn o kommentar har innehåll
      const sanitizedComment = DOMPurify.sanitize(newComment);
      const sanitizedName = DOMPurify.sanitize(name);

      try {
        const response = await fetch(`http://localhost:3001/products/${productId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, text: sanitizedComment, name: sanitizedName }),
        });

        if (response.ok) {
          const newCommentData = await response.json();
          setComments([...comments, newCommentData]); // lägger till ny kommentar till listan
          setNewComment(''); // rensar kommentarinput efter att den skickats
          setName(''); // rensar namninput efter att den skickats
        } else {
          console.error('Failed to save comment');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="comments-section">
      <h3>Kommentarer</h3>
      <ul>
      {comments.map((comment) => (
  <li key={comment.id}>
    <p><strong>{comment.name}</strong></p>
    <p dangerouslySetInnerHTML={{ __html: comment.text }} />
    <p className="comment-date">
      <strong>{new Date(comment.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</strong>
    </p>
  </li>
))}

      </ul>

      {/* formulär för ny kommentar */}
      <form onSubmit={handleCommentSubmit}>
        <input
          type="text"
          placeholder="Ditt namn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Skriv en kommentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
        />
        <div className="comment-button-container">
          <button className="submit-comment-btn">Lägg till kommentar</button>
        </div>
      </form>
    </div>
  );
};

export default CommentsSection;
