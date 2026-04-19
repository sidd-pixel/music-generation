/**
 * components/LoadingSpinner.jsx
 * Minimal inline spinner for buttons and loading states.
 */

const LoadingSpinner = ({ size = 18, color = '#ffffff' }) => {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Loading"
      role="status"
    />
  );
};

export default LoadingSpinner;
