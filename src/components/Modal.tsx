'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export default function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} aria-label={label} onCancel={event => { event.preventDefault(); onClose(); }} className="m-auto p-4 w-full max-w-3xl max-h-[95dvh] bg-transparent text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"><div className="flex min-w-0 justify-center [&>*]:min-w-0">{children}</div></dialog>;
}
