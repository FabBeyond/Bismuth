// Big centered message for loading, error and empty states.
// `action` is an optional button/link shown underneath.
export default function StatusMessage({ children, action }) {
  return (
    <div className="status">
      <p>{children}</p>
      {action}
    </div>
  );
}
