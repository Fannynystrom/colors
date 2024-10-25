import React, { useState } from 'react';
import DOMPurify from 'dompurify';

interface Comment {
  productId: number;
  text: string;
}

interface CommentsSectionProps {
  productId: number;
  comments: Comment[];
  onAddComment: (newComment: Comment) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ productId, comments, onAddComment }) => {
  const [newComment, setNewComment] = useState<string>('');

  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newComment.trim() !== '') {
      // sanerar kommentaren innan den läggs till.
      // script taggar försvinner helt, a taggar neutraliseras
      const sanitizedComment = DOMPurify.sanitize(newComment);
      onAddComment({ productId, text: sanitizedComment });
      setNewComment(''); // rensar inputen efter att kommentaren har skickats
    }
  };

  return (
    <div className="comments-section">
      <h3>Kommentarer</h3>
      <ul>
        {comments
          .filter(comment => comment.productId === productId)
          .map((comment, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: comment.text }} />
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
