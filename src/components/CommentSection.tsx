import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface Comment {
  id: number;
  productId: number;
  text: string;
}

interface CommentsSectionProps {
  productId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ productId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');

  // hämtar kommentarer när produktId ändras
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`http://localhost:3001/comments/${productId}`);
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
    if (newComment.trim() !== '') {
      const sanitizedComment = DOMPurify.sanitize(newComment);

      try {
        const response = await fetch('http://localhost:3001/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, text: sanitizedComment }),
        });

        if (response.ok) {
          const newCommentData = await response.json();
          setComments([...comments, newCommentData]); // lägger till ny kommentar till listan
          setNewComment(''); // rensar input efter att kommentaren har skickats
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
        {comments.map((comment, index) => (
          <li key={comment.id} dangerouslySetInnerHTML={{ __html: comment.text }} />
        ))}
      </ul>

      {/* formulär för ny kommentar */}
      <form onSubmit={handleCommentSubmit}>
        <textarea
          placeholder="Skriv en kommentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
        />
        <button type="submit">Skicka kommentar</button>
      </form>
    </div>
  );
};

export default CommentsSection;
