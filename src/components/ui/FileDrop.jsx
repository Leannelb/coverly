import { useRef, useState } from 'react';

export default function FileDrop({ onFile, accept = 'image/*,.pdf', loading, loadingText = 'Reading document…', fileName }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    if (files && files[0]) onFile(files[0]);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver ? 'border-primary bg-primary-light' : 'border-line bg-white hover:border-primary/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {loading ? (
        <>
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-secondary">{loadingText}</span>
        </>
      ) : fileName ? (
        <>
          <span className="text-2xl">📄</span>
          <span className="text-sm font-semibold text-secondary">{fileName}</span>
          <span className="text-xs text-primary">Click to replace</span>
        </>
      ) : (
        <>
          <span className="text-2xl">📤</span>
          <span className="text-sm font-semibold text-secondary">Drop a file here, or click to upload</span>
          <span className="text-xs text-ink-soft">PDF or photo — a camera shot of the page works fine</span>
        </>
      )}
    </div>
  );
}
