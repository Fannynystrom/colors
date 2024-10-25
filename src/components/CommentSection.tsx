import React, { useState } from 'react';

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
      onAddComment({ productId, text: newComment });
      setNewComment(''); // rensar input efter att kommentaren har skickats
    }
  };

  return (
    <div className="comments-section">
      <h3>Kommentarer</h3>
      <ul>
        {comments
          .filter(comment => comment.productId === productId)
          .map((comment, index) => (
            <li key={index}>{comment.text}</li>
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
